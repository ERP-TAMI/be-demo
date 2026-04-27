import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DraftBom, DraftBomStatus } from './entities/draft-bom.entity';
import { DraftBomLine } from './entities/draft-bom-line.entity';
import {
  CreateDraftBomDto,
  UpdateDraftBomDto,
  DraftBomLineDto,
} from './dto/create-draft-bom.dto.js';

@Injectable()
export class DraftBomsService {
  constructor(
    @InjectRepository(DraftBom)
    private readonly draftBomRepo: Repository<DraftBom>,
    @InjectRepository(DraftBomLine)
    private readonly lineRepo: Repository<DraftBomLine>,
  ) {}

  async findAll(filters?: {
    styleId?: string;
    colorId?: string;
    status?: DraftBomStatus;
  }): Promise<DraftBom[]> {
    const query = this.draftBomRepo.createQueryBuilder('bom');

    if (filters?.styleId) {
      query.andWhere('bom.styleId = :styleId', { styleId: filters.styleId });
    }

    if (filters?.colorId) {
      query.andWhere('bom.colorId = :colorId', { colorId: filters.colorId });
    }

    if (filters?.status) {
      query.andWhere('bom.status = :status', { status: filters.status });
    }

    return query
      .leftJoinAndSelect('bom.lines', 'lines')
      .orderBy('bom.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<DraftBom> {
    const bom = await this.draftBomRepo.findOne({
      where: { id },
      relations: ['lines', 'lines.masterMaterial'],
    });
    if (!bom) throw new NotFoundException(`Draft BOM #${id} not found`);
    return bom;
  }

  async create(dto: CreateDraftBomDto, actor?: string): Promise<DraftBom> {
    const existing = await this.draftBomRepo.findOne({
      where: { draftBomCode: dto.draftBomCode },
    });
    if (existing) {
      throw new ConflictException(
        `Draft BOM code "${dto.draftBomCode}" already exists`,
      );
    }

    const { lines: rawLines, ...rest } = dto;
    const lines = Array.isArray(rawLines) ? rawLines : [];

    const bom = this.draftBomRepo.create({
      ...rest,
      status: DraftBomStatus.DRAFT,
      createdBy: actor ?? 'system',
    });
    const savedBom = await this.draftBomRepo.save(bom);

    if (lines.length > 0) {
      for (const line of lines) {
        await this.addLine(savedBom.id, line, actor);
      }
      await this.recomputeTotal(savedBom.id);
    }

    return this.findOne(savedBom.id);
  }

  async update(id: string, dto: UpdateDraftBomDto): Promise<DraftBom> {
    const bom = await this.findOne(id);
    Object.assign(bom, dto);
    return this.draftBomRepo.save(bom);
  }

  async submit(id: string): Promise<DraftBom> {
    const bom = await this.findOne(id);
    bom.status = DraftBomStatus.SUBMITTED;
    return this.draftBomRepo.save(bom);
  }

  async approve(id: string): Promise<DraftBom> {
    const bom = await this.findOne(id);
    bom.status = DraftBomStatus.APPROVED;
    return this.draftBomRepo.save(bom);
  }

  async addLine(
    bomId: string,
    dto: DraftBomLineDto,
    actor?: string,
  ): Promise<DraftBomLine> {
    const line = this.lineRepo.create({
      ...dto,
      draftBomId: bomId,
      lineCostPerUnit:
        Number(dto.unitCost ?? 0) *
        (1 + Number(dto.yieldPct ?? 0) / 100),
    });
    const saved = await this.lineRepo.save(line);
    await this.recomputeTotal(bomId);
    return saved;
  }

  async updateLine(
    bomId: string,
    lineId: string,
    dto: Partial<DraftBomLineDto>,
  ): Promise<DraftBomLine> {
    const line = await this.lineRepo.findOne({ where: { id: lineId, draftBomId: bomId } });
    if (!line) {
      throw new NotFoundException(`Line #${lineId} not found in BOM #${bomId}`);
    }

    const patched = { ...line, ...dto };
    patched.lineCostPerUnit =
      Number(patched.unitCost ?? 0) *
      (1 + Number(patched.yieldPct ?? 0) / 100);

    const saved = await this.lineRepo.save(patched);
    await this.recomputeTotal(bomId);
    return saved;
  }

  async removeLine(bomId: string, lineId: string): Promise<void> {
    const line = await this.lineRepo.findOne({ where: { id: lineId, draftBomId: bomId } });
    if (!line) {
      throw new NotFoundException(`Line #${lineId} not found in BOM #${bomId}`);
    }
    await this.lineRepo.remove(line);
    await this.recomputeTotal(bomId);
  }

  private async recomputeTotal(bomId: string): Promise<void> {
    const lines = await this.lineRepo.find({ where: { draftBomId: bomId } });
    const total = lines.reduce((sum, l) => sum + Number(l.lineCostPerUnit), 0);
    await this.draftBomRepo.update(bomId, { trimCost: total });
  }

  async remove(id: string): Promise<void> {
    const bom = await this.findOne(id);
    await this.draftBomRepo.remove(bom);
  }

  async createFromStyle(
    styleId: string,
    colorId?: string,
    actor?: string,
  ): Promise<DraftBom> {
    const draftBomCode = `DBOM-${Date.now()}`;

    const bom = this.draftBomRepo.create({
      draftBomCode,
      styleId,
      colorId,
      version: 1,
      status: DraftBomStatus.DRAFT,
      createdBy: actor ?? 'system',
    });
    const saved = await this.draftBomRepo.save(bom);

    return this.findOne(saved.id);
  }

  async createNewVersion(
    originalId: string,
    actor?: string,
  ): Promise<DraftBom> {
    const original = await this.findOne(originalId);

    const newBomCode = `DBOM-${Date.now()}`;
    const bom = this.draftBomRepo.create({
      draftBomCode: newBomCode,
      styleId: original.styleId,
      colorId: original.colorId,
      version: original.version + 1,
      status: DraftBomStatus.DRAFT,
      createdBy: actor ?? 'system',
    });
    const saved = await this.draftBomRepo.save(bom);

    for (const line of original.lines || []) {
      await this.lineRepo.save(
        this.lineRepo.create({
          draftBomId: saved.id,
          masterMaterialId: line.masterMaterialId,
          materialName: line.materialName,
          materialGroup: line.materialGroup,
          unit: line.unit,
          consumption: line.consumption,
          unitCost: line.unitCost,
          yieldPct: line.yieldPct,
          lineCostPerUnit: line.lineCostPerUnit,
        }),
      );
    }

    await this.recomputeTotal(saved.id);
    return this.findOne(saved.id);
  }
}
