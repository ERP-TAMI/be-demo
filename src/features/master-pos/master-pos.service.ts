import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterPo, MasterPoStatus } from './entities/master-po.entity.js';
import { MasterPoLine } from './entities/master-po-line.entity.js';
import { Bom } from '../boms/entities/bom.entity.js';
import { PoLine } from '../po-lines/entities/po-line.entity.js';
import {
  CreateMasterPoDto,
  UpdateMasterPoDto,
  LinkPOLineDto,
} from './dto/create-master-po.dto.js';

@Injectable()
export class MasterPosService {
  constructor(
    @InjectRepository(MasterPo)
    private readonly masterPoRepo: Repository<MasterPo>,
    @InjectRepository(MasterPoLine)
    private readonly masterPoLineRepo: Repository<MasterPoLine>,
    @InjectRepository(PoLine)
    private readonly poLineRepo: Repository<PoLine>,
    @InjectRepository(Bom)
    private readonly bomRepo: Repository<Bom>,
  ) {}

  async findAll(filters?: {
    status?: MasterPoStatus;
    shippingMonth?: string;
  }): Promise<MasterPo[]> {
    const query = this.masterPoRepo.createQueryBuilder('mpo');

    if (filters?.status) {
      query.andWhere('mpo.status = :status', { status: filters.status });
    }

    if (filters?.shippingMonth) {
      query.andWhere('mpo.shippingMonth = :shippingMonth', {
        shippingMonth: filters.shippingMonth,
      });
    }

    return query
      .leftJoinAndSelect('mpo.linkedLines', 'linkedLines')
      .orderBy('mpo.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<MasterPo> {
    const mpo = await this.masterPoRepo.findOne({
      where: { id },
      relations: ['linkedLines', 'linkedLines.poLine', 'linkedLines.poLine.colors'],
    });
    if (!mpo) throw new NotFoundException(`Master PO #${id} not found`);
    return mpo;
  }

  async create(dto: CreateMasterPoDto, actor?: string): Promise<MasterPo> {
    const existing = await this.masterPoRepo.findOne({
      where: { masterPoCode: dto.masterPoCode },
    });
    if (existing) {
      throw new ConflictException(
        `Master PO code "${dto.masterPoCode}" already exists`,
      );
    }

    const mpo = this.masterPoRepo.create({
      ...dto,
      status: MasterPoStatus.DRAFT,
      createdBy: actor ?? 'system',
    });
    return this.masterPoRepo.save(mpo);
  }

  async update(id: string, dto: UpdateMasterPoDto): Promise<MasterPo> {
    const mpo = await this.findOne(id);
    Object.assign(mpo, dto);
    return this.masterPoRepo.save(mpo);
  }

  async confirm(id: string): Promise<MasterPo> {
    const mpo = await this.findOne(id);
    if (mpo.linkedLines?.length === 0) {
      throw new BadRequestException('Cannot confirm Master PO without linked PO Lines');
    }
    mpo.status = MasterPoStatus.CONFIRMED;
    return this.masterPoRepo.save(mpo);
  }

  async linkPOLine(
    masterPoId: string,
    dto: LinkPOLineDto,
  ): Promise<MasterPoLine> {
    const mpo = await this.findOne(masterPoId);

    const existingLink = await this.masterPoLineRepo.findOne({
      where: { masterPoId, poLineId: dto.poLineId },
    });
    if (existingLink) {
      throw new ConflictException('PO Line already linked to this Master PO');
    }

    const poLine = await this.poLineRepo.findOne({
      where: { id: dto.poLineId },
    });
    if (!poLine) {
      throw new NotFoundException(`PO Line #${dto.poLineId} not found`);
    }

    const link = this.masterPoLineRepo.create({
      masterPoId,
      poLineId: dto.poLineId,
      notes: dto.notes,
    });
    const saved = await this.masterPoLineRepo.save(link);

    await this.recalculateTotals(masterPoId);

    return saved;
  }

  async linkMultiplePOLines(
    masterPoId: string,
    poLineIds: string[],
  ): Promise<MasterPoLine[]> {
    const savedLinks: MasterPoLine[] = [];

    for (const poLineId of poLineIds) {
      try {
        const link = await this.linkPOLine(masterPoId, { poLineId });
        savedLinks.push(link);
      } catch (error) {
        if (error instanceof ConflictException) {
          continue;
        }
        throw error;
      }
    }

    return savedLinks;
  }

  async unlinkPOLine(masterPoId: string, poLineId: string): Promise<void> {
    const link = await this.masterPoLineRepo.findOne({
      where: { masterPoId, poLineId },
    });
    if (!link) {
      throw new NotFoundException('Link not found');
    }

    await this.masterPoLineRepo.remove(link);
    await this.recalculateTotals(masterPoId);
  }

  async getSummary(masterPoId: string): Promise<{
    totalQuantity: number;
    totalTrimCost: number;
    byMaterialGroup: Record<string, { quantity: number; cost: number }>;
    byVendor: Record<string, { quantity: number; cost: number }>;
  }> {
    const mpo = await this.findOne(masterPoId);

    let totalQuantity = 0;
    let totalTrimCost = 0;
    const byMaterialGroup: Record<string, { quantity: number; cost: number }> = {};
    const byVendor: Record<string, { quantity: number; cost: number }> = {};

    for (const link of mpo.linkedLines || []) {
      const poLine = link.poLine;
      totalQuantity += 1;

      const boms = await this.bomRepo.find({
        where: { lineId: poLine.id },
        relations: ['bomLines', 'bomLines.masterMaterial'],
      });

      for (const bom of boms) {
        totalTrimCost += Number(bom.totalCostPerUnit) * bom.poQuantity;

        for (const bomLine of bom.bomLines || []) {
          const group = bomLine.materialGroup || 'Other';
          if (!byMaterialGroup[group]) {
            byMaterialGroup[group] = { quantity: 0, cost: 0 };
          }
          byMaterialGroup[group].cost +=
            Number(bomLine.lineCostPerUnit) * bom.poQuantity;

          const vendorId =
            bomLine.masterMaterial?.id || 'default';
          if (!byVendor[vendorId]) {
            byVendor[vendorId] = { quantity: 0, cost: 0 };
          }
          byVendor[vendorId].cost +=
            Number(bomLine.lineCostPerUnit) * bom.poQuantity;
        }
      }
    }

    return {
      totalQuantity,
      totalTrimCost,
      byMaterialGroup,
      byVendor,
    };
  }

  async finalize(masterPoId: string): Promise<MasterPo> {
    const mpo = await this.findOne(masterPoId);

    const summary = await this.getSummary(masterPoId);

    mpo.totalQuantity = summary.totalQuantity;
    mpo.totalTrimCost = summary.totalTrimCost;
    mpo.status = MasterPoStatus.CONFIRMED;

    return this.masterPoRepo.save(mpo);
  }

  async remove(id: string): Promise<void> {
    const mpo = await this.findOne(id);
    await this.masterPoRepo.remove(mpo);
  }

  private async recalculateTotals(masterPoId: string): Promise<void> {
    const summary = await this.getSummary(masterPoId);
    await this.masterPoRepo.update(masterPoId, {
      totalQuantity: summary.totalQuantity,
      totalTrimCost: summary.totalTrimCost,
    });
  }

  async getUnlinkedPOLines(masterPoId: string): Promise<PoLine[]> {
    const mpo = await this.findOne(masterPoId);
    const linkedPoLineIds = (mpo.linkedLines || []).map((l) => l.poLineId);

    const query = this.poLineRepo.createQueryBuilder('line');

    if (linkedPoLineIds.length > 0) {
      query.where('line.id NOT IN (:...linkedIds)', {
        linkedIds: linkedPoLineIds,
      });
    }

    return query.orderBy('line.createdAt', 'DESC').getMany();
  }
}
