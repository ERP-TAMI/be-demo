import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bom, BomStatus } from './entities/bom.entity';
import { BomLine } from './entities/bom-line.entity';
import {
  PoEventType,
  PoVersionLog,
} from '../purchase-orders/entities/po-version-log.entity';

@Injectable()
export class BomsService {
  constructor(
    @InjectRepository(Bom)
    private readonly bomRepo: Repository<Bom>,
    @InjectRepository(BomLine)
    private readonly lineRepo: Repository<BomLine>,
    @InjectRepository(PoVersionLog)
    private readonly logRepo: Repository<PoVersionLog>,
  ) {}

  async findAll(filters?: { poId?: string; lineId?: string }): Promise<Bom[]> {
    const where: { poId?: string; lineId?: string } = {};
    if (filters?.poId) where.poId = filters.poId;
    if (filters?.lineId) where.lineId = filters.lineId;
    return this.bomRepo.find({
      where,
      relations: ['bomLines'],
      order: { createdAt: 'DESC', bomLines: { createdAt: 'ASC' } },
    });
  }

  async findOne(id: string): Promise<Bom> {
    const bom = await this.bomRepo.findOne({
      where: { id },
      relations: ['bomLines', 'bomLines.masterMaterial'],
      order: { bomLines: { createdAt: 'ASC' } },
    });
    if (!bom) throw new NotFoundException(`BOM #${id} not found`);
    return bom;
  }

  private static readonly WASTAGE = 1.03;

  private calcLineCost(consumptionPerUnit: number, unitCost: number): number {
    return consumptionPerUnit * BomsService.WASTAGE * unitCost;
  }

  async create(dto: Partial<Bom>, actor?: string): Promise<Bom> {
    const { lines: rawLines, ...rest } = dto as Partial<Bom> & {
      lines?: Partial<BomLine>[];
    };
    const lines = Array.isArray(rawLines) ? rawLines : [];

    const bom = this.bomRepo.create({
      ...rest,
      status: rest.status ?? BomStatus.DRAFT,
    });
    const savedBom = await this.bomRepo.save(bom);

    if (lines.length > 0) {
      for (const line of lines) {
        const consumption = Number(line.consumptionPerUnit ?? 0);
        const cost = Number(line.unitCost ?? 0);
        const lineCostPerUnit = this.calcLineCost(consumption, cost);

        await this.lineRepo.save(
          this.lineRepo.create({
            bomId: savedBom.id,
            masterMaterialId: line.masterMaterialId ?? undefined,
            materialName: line.materialName ?? '',
            materialGroup: line.materialGroup ?? '',
            unit: line.unit ?? '',
            consumptionPerUnit: consumption,
            yieldPct: 3,
            unitCost: cost,
            lineCostPerUnit,
          }),
        );
      }
      await this.recomputeTotal(savedBom.id);
    }

    const created = await this.findOne(savedBom.id);
    await this.writeBomLog(created, actor ?? 'system', PoEventType.BOM_CREATED);

    if ((created.version || 1) > 1 && created.changeReason) {
      await this.writeBomLog(
        created,
        actor ?? 'system',
        PoEventType.BOM_REVISED,
        {
          reason: created.changeReason,
        },
      );
    }

    return created;
  }

  async update(id: string, dto: Partial<Bom>, actor?: string): Promise<Bom> {
    const bom = await this.findOne(id);
    if (bom.status === BomStatus.APPROVED || bom.status === BomStatus.LOCKED) {
      throw new BadRequestException(
        'Approved/Locked BOM cannot be edited directly',
      );
    }

    const patch: Partial<Bom> = {};
    if (dto.rdComment !== undefined) patch.rdComment = dto.rdComment;
    if (dto.changeReason !== undefined) patch.changeReason = dto.changeReason;
    if (dto.deadline !== undefined) patch.deadline = dto.deadline;

    await this.bomRepo.update(id, patch);
    const updated = await this.findOne(id);

    if (Object.keys(patch).length > 0) {
      await this.writeBomLog(
        updated,
        actor ?? 'system',
        PoEventType.BOM_UPDATED,
        {
          changes: Object.keys(patch).map((field) => ({
            field,
            before: bom[field as keyof Bom] ?? null,
            after: updated[field as keyof Bom] ?? null,
          })),
        },
      );
    }

    return updated;
  }

  async updateStatus(
    id: string,
    status: BomStatus,
    actorId?: string,
    rejectReason?: string,
    actor?: string,
  ): Promise<Bom> {
    const bom = await this.findOne(id);
    const previousStatus = bom.status;

    // Workflow transitions:
    // Draft → Wait_RD (RD nhập định mức)
    // → Wait_TP_Approve (TPKH review số lượng)
    // → Wait_Price (KT nhập đơn giá)
    // → Wait_SA_Approve (SA duyệt final)
    const validTransitions: Record<BomStatus, BomStatus[]> = {
      [BomStatus.DRAFT]:           [BomStatus.WAIT_RD],
      [BomStatus.WAIT_RD]:         [BomStatus.WAIT_TP_APPROVE, BomStatus.DRAFT],
      [BomStatus.WAIT_TP_APPROVE]: [BomStatus.WAIT_PRICE, BomStatus.WAIT_RD],
      [BomStatus.WAIT_PRICE]:      [BomStatus.WAIT_SA_APPROVE, BomStatus.WAIT_TP_APPROVE],
      [BomStatus.WAIT_SA_APPROVE]: [BomStatus.APPROVED, BomStatus.WAIT_PRICE],
      [BomStatus.APPROVED]:        [BomStatus.LOCKED],
      [BomStatus.LOCKED]:          [],
    };

    if (!validTransitions[bom.status].includes(status)) {
      throw new BadRequestException(
        `Cannot transition BOM from ${bom.status} to ${status}`,
      );
    }

    this.assertTransitionDataReady(bom, status);

    bom.status = status;

    if (status === BomStatus.APPROVED || status === BomStatus.LOCKED) {
      if (actorId) bom.approvedById = actorId;
      bom.approvedAt = new Date();
    }
    if (status === BomStatus.WAIT_RD) {
      if (actorId) bom.submittedById = actorId;
      bom.submittedAt = new Date();
    }
    if (rejectReason) {
      bom.rejectReason = rejectReason;
    }

    const saved = await this.bomRepo.save(bom);
    const eventType = rejectReason
      ? PoEventType.BOM_REJECTED
      : status === BomStatus.APPROVED || status === BomStatus.LOCKED
        ? PoEventType.BOM_APPROVED
        : status === BomStatus.WAIT_RD ||
            status === BomStatus.WAIT_PRICE ||
            status === BomStatus.WAIT_TP_APPROVE ||
            status === BomStatus.WAIT_SA_APPROVE
          ? PoEventType.BOM_SUBMITTED
          : PoEventType.BOM_UPDATED;

    await this.writeBomLog(saved, actor ?? 'system', eventType, {
      reason: rejectReason || undefined,
      changes: [
        {
          field: 'status',
          before: previousStatus,
          after: status,
        },
      ],
    });

    return saved;
  }

  async addLine(
    bomId: string,
    dto: Partial<BomLine>,
    actor?: string,
  ): Promise<BomLine> {
    const bom = await this.findOne(bomId);
    this.assertEditableBomForLineChange(bom);

    const consumption = Number(dto.consumptionPerUnit ?? 0);
    const cost = Number(dto.unitCost ?? 0);
    const line = this.lineRepo.create({
      ...dto,
      bomId,
      consumptionPerUnit: consumption,
      yieldPct: 3,
      unitCost: cost,
      lineCostPerUnit: this.calcLineCost(consumption, cost),
    });
    const saved = await this.lineRepo.save(line);

    // Recompute BOM total cost
    await this.recomputeTotal(bomId);
    await this.writeBomLog(bom, actor ?? 'system', PoEventType.BOM_UPDATED, {
      reason: 'Added BOM line',
      targetId: saved.id,
      targetLabel: saved.materialName,
    });

    return saved;
  }

  async updateLine(
    bomId: string,
    lineId: string,
    dto: Partial<BomLine>,
    actor?: string,
  ): Promise<BomLine> {
    const bom = await this.findOne(bomId);
    this.assertEditableBomForLineChange(bom);

    const line = await this.lineRepo.findOne({ where: { id: lineId, bomId } });
    if (!line) {
      throw new NotFoundException(
        `BOM Line #${lineId} not found in BOM #${bomId}`,
      );
    }

    const patched = {
      ...line,
      ...dto,
      id: line.id,
      bomId: line.bomId,
      yieldPct: 3,
    };

    const consumption = Number(patched.consumptionPerUnit ?? 0);
    const cost = Number(patched.unitCost ?? 0);
    patched.lineCostPerUnit = this.calcLineCost(consumption, cost);

    const saved = await this.lineRepo.save(patched);
    await this.recomputeTotal(bomId);
    await this.writeBomLog(bom, actor ?? 'system', PoEventType.BOM_UPDATED, {
      reason: 'Updated BOM line',
      targetId: saved.id,
      targetLabel: saved.materialName,
      changes: Object.keys(dto || {}).map((field) => ({
        field,
        before: line[field as keyof BomLine] ?? null,
        after: saved[field as keyof BomLine] ?? null,
      })),
    });
    return saved;
  }

  async removeLine(lineId: string, actor?: string): Promise<void> {
    const line = await this.lineRepo.findOne({ where: { id: lineId } });
    if (!line) throw new NotFoundException(`BOM Line #${lineId} not found`);
    const { bomId } = line;
    const bom = await this.findOne(bomId);
    this.assertEditableBomForLineChange(bom);
    await this.lineRepo.remove(line);
    await this.recomputeTotal(bomId);
    await this.writeBomLog(bom, actor ?? 'system', PoEventType.BOM_UPDATED, {
      reason: 'Removed BOM line',
      targetId: line.id,
      targetLabel: line.materialName,
    });
  }

  private async recomputeTotal(bomId: string): Promise<void> {
    const lines = await this.lineRepo.find({ where: { bomId } });
    const total = lines.reduce((sum, l) => sum + Number(l.lineCostPerUnit), 0);
    await this.bomRepo.update(bomId, { totalCostPerUnit: total });
  }

  async remove(id: string): Promise<void> {
    const bom = await this.findOne(id);
    if (bom.status === BomStatus.LOCKED) {
      throw new BadRequestException('Cannot delete a locked BOM');
    }
    await this.bomRepo.remove(bom);
  }

  private assertEditableBomForLineChange(bom: Bom): void {
    const editableStatuses = [
      BomStatus.DRAFT,
      BomStatus.WAIT_RD,
      BomStatus.WAIT_PRICE,
    ];
    if (!editableStatuses.includes(bom.status)) {
      throw new BadRequestException(
        `Cannot edit BOM lines while status is ${bom.status}`,
      );
    }
  }

  private assertTransitionDataReady(bom: Bom, nextStatus: BomStatus): void {
    const lines = bom.bomLines || [];

    if (nextStatus === BomStatus.WAIT_RD) {
      const basicDone =
        lines.length > 0 &&
        lines.every(
          (l) =>
            !!l.materialName?.trim() &&
            !!l.materialGroup?.trim() &&
            !!l.unit?.trim(),
        );
      if (!basicDone) {
        throw new BadRequestException(
          'Chưa nhập đủ tên, nhóm và ĐVT cho tất cả vật tư',
        );
      }
    }

    // TPKH review: R&D phải đã nhập consumptionPerUnit > 0
    if (nextStatus === BomStatus.WAIT_TP_APPROVE) {
      const rdDone =
        lines.length > 0 &&
        lines.every((l) => Number(l.consumptionPerUnit) > 0);
      if (!rdDone) {
        throw new BadRequestException(
          'R&D chưa nhập đủ Định mức tiêu hao cho tất cả vật tư',
        );
      }
    }

    // SA duyệt: KT phải đã nhập unitCost > 0
    if (nextStatus === BomStatus.WAIT_SA_APPROVE) {
      const ktDone =
        lines.length > 0 &&
        lines.every((l) => l.unitCost != null && Number(l.unitCost) > 0);
      if (!ktDone) {
        throw new BadRequestException(
          'Kế toán chưa nhập đủ đơn giá cho tất cả vật tư',
        );
      }
    }
  }

  private async writeBomLog(
    bom: Pick<Bom, 'id' | 'poId' | 'styleCode' | 'colorName'>,
    actor: string,
    eventType: PoEventType,
    opts?: {
      reason?: string;
      targetId?: string;
      targetLabel?: string;
      changes?: Record<string, any>[];
    },
  ): Promise<void> {
    const label = `${bom.styleCode || 'BOM'} / ${bom.colorName || '-'}`;
    await this.logRepo.save(
      this.logRepo.create({
        poId: bom.poId,
        actor,
        eventType,
        reason: opts?.reason,
        targetId: opts?.targetId || bom.id,
        targetLabel: opts?.targetLabel || label,
        changes: opts?.changes,
      }),
    );
  }
}
