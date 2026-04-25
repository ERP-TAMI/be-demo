import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, QueryFailedError } from 'typeorm';
import { Style, StyleStatus } from './entities/style.entity.js';
import { StyleAs3bStep } from './entities/style-as3b-step.entity.js';
import { StyleVersionLog } from './entities/style-version-log.entity.js';
import { CreateStyleDto } from './dto/create-style.dto.js';
import { UpdateStyleDto } from './dto/update-style.dto.js';

@Injectable()
export class StylesService {
  constructor(
    @InjectRepository(Style)
    private readonly styleRepo: Repository<Style>,
    @InjectRepository(StyleAs3bStep)
    private readonly as3bRepo: Repository<StyleAs3bStep>,
    @InjectRepository(StyleVersionLog)
    private readonly logRepo: Repository<StyleVersionLog>,
  ) {}

  async findAll(filters?: {
    status?: StyleStatus;
    category?: string;
    search?: string;
  }): Promise<Style[]> {
    try {
      return await this.buildFindAllQuery(filters, true).getMany();
    } catch (error) {
      if (this.isMissingStyleDetailTableError(error)) {
        return this.buildFindAllQuery(filters, false).getMany();
      }
      throw error;
    }
  }

  async findOne(id: string): Promise<Style> {
    const style = await this.findOneInternal({ id });
    if (!style) throw new NotFoundException(`Style #${id} not found`);

    if (style.as3bSteps) {
      style.as3bSteps.sort((a, b) => a.orderIndex - b.orderIndex);
    }

    return style;
  }

  async findByCode(styleCode: string): Promise<Style | null> {
    return this.findOneInternal({ styleCode });
  }

  async create(dto: CreateStyleDto, actor?: string): Promise<Style> {
    const existing = await this.styleRepo.findOne({
      where: { styleCode: dto.styleCode },
    });
    if (existing) {
      throw new ConflictException(`Style code "${dto.styleCode}" already exists`);
    }

    const style = this.styleRepo.create({
      ...dto,
      status: dto.status ?? StyleStatus.DRAFT,
      createdBy: actor ?? 'system',
    });
    const saved = await this.styleRepo.save(style);

    await this.logActionSafe(
      saved.id,
      'STYLE_CREATED',
      `Created style ${saved.styleCode} - ${saved.styleName}`,
      actor ?? 'system',
    );

    return saved;
  }

  async update(id: string, dto: UpdateStyleDto, actor?: string): Promise<Style> {
    const style = await this.findOne(id);
    const oldValues: Record<string, unknown> = {};

    Object.keys(dto).forEach((key) => {
      oldValues[key] = style[key as keyof Style];
    });

    Object.assign(style, dto);
    const saved = await this.styleRepo.save(style);

    const changes = Object.keys(dto).map((key) => ({
      field: key,
      label: key,
      before: oldValues[key],
      after: dto[key as keyof UpdateStyleDto],
    }));

    await this.logActionSafe(
      id,
      'STYLE_UPDATED',
      'Updated style information',
      actor ?? 'system',
      null,
      null,
      changes,
    );

    return saved;
  }

  async archive(id: string): Promise<Style> {
    const style = await this.findOne(id);
    style.status = StyleStatus.ARCHIVED;
    const saved = await this.styleRepo.save(style);
    await this.logActionSafe(id, 'STYLE_ARCHIVED', 'Archived style', 'system');
    return saved;
  }

  async remove(id: string): Promise<void> {
    const style = await this.findOne(id);
    await this.styleRepo.remove(style);
  }

  async clone(id: string, newStyleCode: string, actor?: string): Promise<Style> {
    const original = await this.findOne(id);

    const existing = await this.styleRepo.findOne({
      where: { styleCode: newStyleCode },
    });
    if (existing) {
      throw new ConflictException(`Style code "${newStyleCode}" already exists`);
    }

    const cloned = this.styleRepo.create({
      styleCode: newStyleCode,
      styleName: `${original.styleName} (Copy)`,
      description: original.description,
      category: original.category,
      baseImage: original.baseImage,
      status: StyleStatus.DRAFT,
      createdBy: actor ?? 'system',
    });
    const saved = await this.styleRepo.save(cloned);

    if (original.as3bSteps && original.as3bSteps.length > 0) {
      const newSteps = original.as3bSteps.map((step) =>
        this.as3bRepo.create({
          styleId: saved.id,
          stageId: step.stageId,
          stepName: step.stepName,
          description: step.description,
          timePerPc: step.timePerPc,
          smv: step.smv,
          orderIndex: step.orderIndex,
        }),
      );
      await this.as3bRepo.save(newSteps);
    }

    await this.logActionSafe(
      saved.id,
      'STYLE_CREATED',
      `Cloned style ${original.styleCode} -> ${newStyleCode}`,
      actor ?? 'system',
    );

    return this.findOne(saved.id);
  }

  async getColors(styleId: string): Promise<Style['colors']> {
    const style = await this.findOne(styleId);
    return style.colors;
  }

  async createFromDocuments(
    dto: { styleCode: string; styleName: string; category?: string; description?: string; documentIds?: string[] },
    actor?: string,
  ): Promise<Style> {
    const existing = await this.styleRepo.findOne({
      where: { styleCode: dto.styleCode },
    });
    if (existing) {
      return this.findOne(existing.id);
    }

    const style = this.styleRepo.create({
      styleCode: dto.styleCode,
      styleName: dto.styleName,
      category: dto.category,
      description: dto.description,
      status: StyleStatus.DRAFT,
      createdBy: actor ?? 'system',
    });
    const saved = await this.styleRepo.save(style);

    if (dto.documentIds && dto.documentIds.length > 0) {
      await this.assignDocuments(saved.id, dto.documentIds);
    }

    await this.logActionSafe(
      saved.id,
      'STYLE_CREATED',
      `Created style from documents: ${saved.styleCode} - ${saved.styleName}`,
      actor ?? 'system',
    );

    return saved;
  }

  async assignDocuments(styleId: string, documentIds: string[]): Promise<Style> {
    const style = await this.findOne(styleId);
    void documentIds;
    return style;
  }

  async getLogs(styleId: string): Promise<StyleVersionLog[]> {
    try {
      return await this.logRepo.find({
        where: { styleId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      if (this.isMissingTableError(error, ['style_version_logs'])) {
        return [];
      }
      throw error;
    }
  }

  async logAction(
    styleId: string,
    type: string,
    reason: string,
    actor: string,
    targetId?: string | null,
    targetLabel?: string | null,
    changes?: { field: string; label: string; before: any; after: any }[],
  ): Promise<StyleVersionLog> {
    const logData: DeepPartial<StyleVersionLog> = {
      styleId,
      type,
      reason,
      actor,
      targetId: targetId ?? undefined,
      targetLabel: targetLabel ?? undefined,
      changes: changes ?? [],
    };
    const log = this.logRepo.create(logData);
    return this.logRepo.save(log) as Promise<StyleVersionLog>;
  }

  private buildFindAllQuery(
    filters: { status?: StyleStatus; category?: string; search?: string } | undefined,
    includeOptionalRelations: boolean,
  ) {
    const query = this.styleRepo.createQueryBuilder('style');

    if (filters?.status) {
      query.andWhere('style.status = :status', { status: filters.status });
    }

    if (filters?.category) {
      query.andWhere('style.category = :category', { category: filters.category });
    }

    if (filters?.search) {
      query.andWhere(
        '(style.styleCode ILIKE :search OR style.styleName ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    query.leftJoinAndSelect('style.colors', 'colors').leftJoinAndSelect('style.samples', 'samples');

    if (includeOptionalRelations) {
      query
        .leftJoinAndSelect('style.as3bSteps', 'as3bSteps')
        .leftJoinAndSelect('style.productionDocs', 'productionDocs');
    }

    return query.orderBy('style.createdAt', 'DESC');
  }

  private async findOneInternal(where: { id?: string; styleCode?: string }): Promise<Style | null> {
    try {
      return await this.styleRepo.findOne({
        where,
        relations: ['colors', 'samples', 'as3bSteps', 'productionDocs'],
      });
    } catch (error) {
      if (this.isMissingStyleDetailTableError(error)) {
        return this.styleRepo.findOne({
          where,
          relations: ['colors', 'samples'],
        });
      }
      throw error;
    }
  }

  async logActionIfAvailable(
    styleId: string,
    type: string,
    reason: string,
    actor: string,
    targetId?: string | null,
    targetLabel?: string | null,
    changes?: { field: string; label: string; before: any; after: any }[],
  ): Promise<void> {
    await this.logActionSafe(styleId, type, reason, actor, targetId, targetLabel, changes);
  }

  private async logActionSafe(
    styleId: string,
    type: string,
    reason: string,
    actor: string,
    targetId?: string | null,
    targetLabel?: string | null,
    changes?: { field: string; label: string; before: any; after: any }[],
  ): Promise<void> {
    try {
      await this.logAction(styleId, type, reason, actor, targetId, targetLabel, changes);
    } catch (error) {
      if (!this.isMissingTableError(error, ['style_version_logs'])) {
        throw error;
      }
    }
  }

  private isMissingStyleDetailTableError(error: unknown): boolean {
    return this.isMissingTableError(error, ['style_as3b_steps', 'style_production_docs']);
  }

  private isMissingTableError(error: unknown, tableNames: string[]): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = (error as QueryFailedError & { driverError?: { code?: string; message?: string } }).driverError;
    const message = driverError?.message ?? error.message ?? '';

    return driverError?.code === '42P01' && tableNames.some((tableName) => message.includes(tableName));
  }
}
