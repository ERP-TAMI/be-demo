import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, QueryFailedError } from 'typeorm';
import { Style, StyleStatus, StyleFileMetadata } from './entities/style.entity';
import { StyleAs3bStep } from './entities/style-as3b-step.entity';
import { StyleVersionLog } from './entities/style-version-log.entity';
import * as crypto from 'crypto';
import {
  Sample,
  SampleType,
  SampleStatus,
} from '../samples/entities/sample.entity';
import { DocFile } from '../doc-folders/entities/doc-file.entity';
import { CreateStyleDto } from './dto/create-style.dto.js';
import { UpdateStyleDto } from './dto/update-style.dto.js';
import { As3bTemplateExportService } from '../as3b-template/as3b-template-export.service.js';

@Injectable()
export class StylesService {
  constructor(
    @InjectRepository(Style)
    private readonly styleRepo: Repository<Style>,
    @InjectRepository(StyleAs3bStep)
    private readonly as3bRepo: Repository<StyleAs3bStep>,
    @InjectRepository(StyleVersionLog)
    private readonly logRepo: Repository<StyleVersionLog>,
    @InjectRepository(Sample)
    private readonly sampleRepo: Repository<Sample>,
    @InjectRepository(DocFile)
    private readonly docFileRepo: Repository<DocFile>,
    private readonly as3bTemplateExport: As3bTemplateExportService,
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
    return style;
  }

  async exportAs3bTemplate(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const style = await this.findOne(id);
    const buffer = await this.as3bTemplateExport.build({
      styleCode: style.styleCode,
      category: style.category,
      material: null,
      imageUrl: style.baseImage,
      cmBaseDays: style.as3bCmBaseDays || 30,
      steps: style.as3bSteps || [],
    });

    return {
      buffer,
      filename: `BangCongDoan_Style_${this.sanitizeFilename(style.styleCode)}.xlsx`,
    };
  }

  private sanitizeFilename(value: string): string {
    return String(value || 'AS3B')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '_')
      .replace(/\s+/g, '_');
  }

  async findByCode(styleCode: string): Promise<Style | null> {
    return this.findOneInternal({ styleCode });
  }

  async create(dto: CreateStyleDto, actor?: string): Promise<Style> {
    const existing = await this.styleRepo.findOne({
      where: { styleCode: dto.styleCode },
    });
    if (existing) {
      throw new ConflictException(
        `Style code "${dto.styleCode}" already exists`,
      );
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

  async update(
    id: string,
    dto: UpdateStyleDto,
    actor?: string,
  ): Promise<Style> {
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
    style.status = StyleStatus.DRAFT;
    const saved = await this.styleRepo.save(style);
    await this.logActionSafe(
      id,
      'STYLE_RESET',
      'Reset style to draft',
      'system',
    );
    return saved;
  }

  async remove(id: string): Promise<void> {
    const style = await this.findOne(id);
    await this.styleRepo.remove(style);
  }

  async clone(
    id: string,
    newStyleCode: string,
    actor?: string,
  ): Promise<Style> {
    const original = await this.findOne(id);

    const existing = await this.styleRepo.findOne({
      where: { styleCode: newStyleCode },
    });
    if (existing) {
      throw new ConflictException(
        `Style code "${newStyleCode}" already exists`,
      );
    }

    const cloned = this.styleRepo.create({
      styleCode: newStyleCode,
      styleName: `${original.styleName} (Copy)`,
      description: original.description,
      category: original.category,
      baseImage: original.baseImage,
      as3bCmBaseDays: original.as3bCmBaseDays || 30,
      status: StyleStatus.DRAFT,
      createdBy: actor ?? 'system',
    });
    const saved = await this.styleRepo.save(cloned);

    if (original.as3bSteps && original.as3bSteps.length > 0) {
      const idMap = new Map(
        original.as3bSteps.map((step) => [step.id, crypto.randomUUID()]),
      );
      const newSteps = original.as3bSteps.map((step) =>
        this.as3bRepo.create({
          id: idMap.get(step.id),
          styleId: saved.id,
          stageId: step.stageId,
          stepName: step.stepName,
          description: step.description,
          timePerPc: step.timePerPc,
          ssv: step.ssv,
          targetTotal: step.targetTotal,
          note: step.note,
          orderIndex: step.orderIndex,
          parentRowId: step.parentRowId ? idMap.get(step.parentRowId) : null,
          isGroup: step.isGroup,
          groupId: step.groupId,
          groupItems: step.groupItems,
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
    dto: {
      styleCode: string;
      styleName: string;
      category?: string;
      description?: string;
      documentIds?: string[];
    },
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

  async assignDocuments(
    styleId: string,
    documentIds: string[],
  ): Promise<Style> {
    const style = await this.findOne(styleId);

    if (!documentIds || documentIds.length === 0) {
      return style;
    }

    // Fetch the doc files by their IDs
    const docFiles = await this.docFileRepo.findByIds(documentIds);

    // Extract file metadata for storage in the Style's files column
    const fileMetadata: StyleFileMetadata[] = docFiles.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      size: f.size,
      url: f.url,
      label: 'Tài liệu khác',
      uploadedAt: f.uploadedAt,
    }));

    // Append to existing files (avoid duplicates by id)
    const existingFileIds = new Set((style.files || []).map((f) => f.id));
    const newFiles = fileMetadata.filter((f) => !existingFileIds.has(f.id));

    style.files = [...(style.files || []), ...newFiles];
    await this.styleRepo.save(style);

    await this.logActionSafe(
      styleId,
      'STYLE_DOCUMENTS_ASSIGNED',
      `Assigned ${docFiles.length} document(s) to style`,
      'system',
    );

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
    return this.logRepo.save(log);
  }

  private buildFindAllQuery(
    filters:
      | { status?: StyleStatus; category?: string; search?: string }
      | undefined,
    includeOptionalRelations: boolean,
  ) {
    const query = this.styleRepo.createQueryBuilder('style');

    if (filters?.status) {
      query.andWhere('style.status = :status', { status: filters.status });
    }

    if (filters?.category) {
      query.andWhere('style.category = :category', {
        category: filters.category,
      });
    }

    if (filters?.search) {
      query.andWhere(
        '(style.styleCode ILIKE :search OR style.styleName ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    query
      .leftJoinAndSelect('style.colors', 'colors')
      .leftJoinAndSelect('style.samples', 'samples');

    if (includeOptionalRelations) {
      query
        .leftJoinAndSelect('style.as3bSteps', 'as3bSteps')
        .leftJoinAndSelect('style.productionDocs', 'productionDocs');
    }

    query.orderBy('style.createdAt', 'DESC');

    if (includeOptionalRelations) {
      query.addOrderBy('as3bSteps.orderIndex', 'ASC');
    }

    return query;
  }

  private async findOneInternal(where: {
    id?: string;
    styleCode?: string;
  }): Promise<Style | null> {
    try {
      const style = await this.styleRepo.findOne({
        where,
        relations: ['colors', 'samples', 'as3bSteps', 'productionDocs'],
      });
      if (style?.as3bSteps) {
        style.as3bSteps.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      }
      return style;
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
    await this.logActionSafe(
      styleId,
      type,
      reason,
      actor,
      targetId,
      targetLabel,
      changes,
    );
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
      await this.logAction(
        styleId,
        type,
        reason,
        actor,
        targetId,
        targetLabel,
        changes,
      );
    } catch (error) {
      if (!this.isMissingTableError(error, ['style_version_logs'])) {
        throw error;
      }
    }
  }

  private isMissingStyleDetailTableError(error: unknown): boolean {
    return this.isMissingTableError(error, [
      'style_as3b_steps',
      'style_production_docs',
    ]);
  }

  private isMissingTableError(error: unknown, tableNames: string[]): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = (
      error as QueryFailedError & {
        driverError?: { code?: string; message?: string };
      }
    ).driverError;
    const message = driverError?.message ?? error.message ?? '';

    return (
      driverError?.code === '42P01' &&
      tableNames.some((tableName) => message.includes(tableName))
    );
  }

  async getSampleForStyle(styleId: string): Promise<Sample | null> {
    const style = await this.findOne(styleId);
    const samples = await this.sampleRepo.find({
      where: { styleId: style.id },
    });
    if (!samples.length) return null;
    return samples[0];
  }

  async createOrReplaceSampleVersion(
    styleId: string,
    body: {
      description?: string;
      images?: string[];
      dateTime?: string;
      internalNote?: string;
    },
    actor?: string,
  ): Promise<Sample> {
    const style = await this.findOne(styleId);
    const existingSamples = await this.sampleRepo.find({
      where: { styleId: style.id },
    });
    const existing = existingSamples[0] ?? null;

    if (existing) {
      // Tạo sample MỚI để lưu version hiện tại (giữ lại sample cũ trong lịch sử)
      const newSample = this.sampleRepo.create({
        sampleCode: `SMP-${style.styleCode}-${Date.now()}`,
        sampleType: SampleType.TECHPACK,
        styleId: style.id,
        description: body.description || null,
        images: body.images || null,
        status: SampleStatus.DRAFT,
        createdBy: actor ?? 'system',
      });
      const saved = await this.sampleRepo.save(newSample);

      await this.logActionSafe(
        styleId,
        'SAMPLE_CREATED',
        `Tạo version mới từ sample cũ (${existing.sampleCode})`,
        actor ?? 'system',
      );
      return saved;
    }

    const sample = this.sampleRepo.create({
      sampleCode: `SMP-${style.styleCode}-${Date.now()}`,
      sampleType: SampleType.TECHPACK,
      styleId: style.id,
      description: body.description || null,
      images: body.images || null,
      status: SampleStatus.DRAFT,
      createdBy: actor ?? 'system',
    });
    const saved = await this.sampleRepo.save(sample);

    await this.logActionSafe(
      styleId,
      'SAMPLE_CREATED',
      `Tạo mẫu đầu tiên`,
      actor ?? 'system',
    );
    return saved;
  }
}
