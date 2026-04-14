import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PoLine, LineStatus } from './entities/po-line.entity.js';
import { LineColor } from './entities/line-color.entity.js';
import { LineColorSize } from './entities/line-color-size.entity.js';

import { LineAs3bStep } from './entities/line-as3b-step.entity.js';
import { LineSample } from './entities/line-sample.entity.js';
import { SampleColorImage } from './entities/sample-color-image.entity.js';
import { LineMappedFile } from './entities/line-mapped-file.entity.js';
import { LineFile, LineFileLabel } from './entities/line-file.entity.js';
import { PoVersionLog, PoEventType } from '../purchase-orders/entities/po-version-log.entity.js';
import { UserRole } from '../user/entities/user.entity.js';


@Injectable()
export class PoLinesService {
  constructor(
    @InjectRepository(PoLine)
    private readonly lineRepo: Repository<PoLine>,
    @InjectRepository(LineColor)
    private readonly colorRepo: Repository<LineColor>,
    @InjectRepository(LineColorSize)
    private readonly sizeRepo: Repository<LineColorSize>,
    @InjectRepository(LineFile)
    private readonly fileRepo: Repository<LineFile>,
    @InjectRepository(LineAs3bStep)
    private readonly stepRepo: Repository<LineAs3bStep>,
    @InjectRepository(LineSample)
    private readonly sampleRepo: Repository<LineSample>,
    @InjectRepository(SampleColorImage)
    private readonly imageRepo: Repository<SampleColorImage>,
    @InjectRepository(LineMappedFile)
    private readonly mappedFileRepo: Repository<LineMappedFile>,
    @InjectRepository(LineFile)
    private readonly lineFileRepo: Repository<LineFile>,
    @InjectRepository(PoVersionLog)
    private readonly logRepo: Repository<PoVersionLog>,
  ) {}

  private async writeLineLog(
    line: PoLine,
    actor: string,
    eventType: PoEventType,
    opts?: {
      reason?: string;
      targetLabel?: string;
      changes?: Record<string, any>[];
    },
  ) {
    const log = this.logRepo.create({
      poId: line.poId,
      actor,
      eventType,
      reason: opts?.reason,
      targetId: line.id,
      targetLabel: opts?.targetLabel || `${line.styleCode} â€” ${line.productName}`,
      changes: opts?.changes,
    });
    await this.logRepo.save(log);
  }

  private validateLineReadyForReview(line: PoLine): void {
    const hasStyleCode = !!line.styleCode?.trim();
    const hasProductName = !!line.productName?.trim();
    const hasDeadline = !!line.deadline;
    const validColors = (line.colors || []).filter((color) => color.colorName?.trim());
    const totalQty = validColors.reduce(
      (sum, color) =>
        sum +
        (color.sizes || []).reduce(
          (colorSum, size) => colorSum + Number(size.quantity || 0),
          0,
        ),
      0,
    );

    if (!hasStyleCode || !hasProductName || !hasDeadline || validColors.length === 0 || totalQty <= 0) {
      throw new BadRequestException(
        'Sản phẩm chưa đủ dữ liệu đọƒ chuyển In Review. Cần có mã hàng, tên sản phẩm, màu sắc, sọ‘ lượng và deadline.',
      );
    }
  }

  // â”€â”€â”€ Lines CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private assertTransitionRole(
    beforeStatus: LineStatus,
    nextStatus: LineStatus,
    actorRole?: UserRole,
  ): void {
    if (!actorRole) {
      throw new ForbiddenException('Không xác định được vai trò người thực hiọ‡n');
    }

    if (beforeStatus === LineStatus.CANCELLED || nextStatus === LineStatus.CANCELLED) {
      if (actorRole !== UserRole.TPKH) {
        throw new ForbiddenException('Chọ‰ TPKH mới được hủy hoặc khôi phục sản phẩm');
      }
      return;
    }

    if (beforeStatus === LineStatus.DRAFT && nextStatus === LineStatus.IN_REVIEW && actorRole !== UserRole.RD) {
      throw new ForbiddenException('Chọ‰ R&D mới được chuyển sản phẩm sang In Review');
    }

    if (beforeStatus === LineStatus.IN_REVIEW && nextStatus === LineStatus.SAMPLING && actorRole !== UserRole.NVKH) {
      throw new ForbiddenException('Chọ‰ NVKH mới được chuyển sản phẩm sang Sampling');
    }

    if (beforeStatus === LineStatus.SAMPLING && nextStatus === LineStatus.FINAL && actorRole !== UserRole.TPKH) {
      throw new ForbiddenException('Chọ‰ TPKH mới được chọ‘t Final');
    }
  }

  async findByPo(poId: string): Promise<PoLine[]> {
    return this.lineRepo.find({
      where: { poId },
      relations: ['colors', 'colors.sizes'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<PoLine> {
    const line = await this.lineRepo.findOne({
      where: { id },
      relations: [
        'colors',
        'colors.sizes',
        'files',
        'as3bSteps',
        'samples',
        'samples.images',
        'mappedFiles',
        'mappedFiles.poFile',
        'colors',
        'colors.sizes',
        'files',
      ],
    });
    if (!line) throw new NotFoundException(`Line #${id} not found`);
    return line;
  }

  async create(poId: string, dto: Partial<PoLine>, actor = 'system'): Promise<PoLine> {
    const line = this.lineRepo.create({
      ...dto,
      poId,
      status: LineStatus.DRAFT,
    });
    const saved = await this.lineRepo.save(line);
    await this.writeLineLog(saved, actor, PoEventType.LINE_ADDED, {
      reason: `Tạo sản phẩm ${saved.styleCode} â€” ${saved.productName}`,
    });
    return saved;
  }

  async update(id: string, dto: Partial<PoLine>, actor = 'system'): Promise<PoLine> {
    const line = await this.findOne(id);
    const changes = Object.entries(dto).map(([field, after]) => ({
      field,
      label: field,
      before: (line as Record<string, any>)[field],
      after,
    }));
    Object.assign(line, dto);
    const saved = await this.lineRepo.save(line);
    if (changes.length > 0) {
      await this.writeLineLog(saved, actor, PoEventType.LINE_UPDATED, {
        reason: `Cập nhật sản phẩm ${saved.styleCode} â€” ${saved.productName}`,
        changes,
      });
    }
    return saved;
  }

  async updateStatus(
    id: string,
    status: LineStatus,
    opts?: { actor?: string; actorRole?: UserRole; reason?: string },
  ): Promise<PoLine> {
    const line = await this.findOne(id);
    const beforeStatus = line.status;
    const actor = opts?.actor ?? 'system';
    const validTransitions: Record<LineStatus, LineStatus[]> = {
      [LineStatus.DRAFT]: [LineStatus.IN_REVIEW, LineStatus.CANCELLED],
      [LineStatus.IN_REVIEW]: [LineStatus.SAMPLING, LineStatus.CANCELLED],
      [LineStatus.SAMPLING]: [
        LineStatus.FINAL,
        LineStatus.CANCELLED,
      ],
      [LineStatus.FINAL]: [],
      [LineStatus.CANCELLED]: [],
    };

    if (line.status === LineStatus.CANCELLED) {
      if (!line.previousStatus || status !== line.previousStatus) {
        throw new BadRequestException('Chọ‰ có thọƒ khôi phục sản phẩm về trạng thái trÆ°ớc khi hủy');
      }
    } else if (!validTransitions[line.status].includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${line.status} to ${status}`,
      );
    }

    this.assertTransitionRole(beforeStatus, status, opts?.actorRole);

    if (beforeStatus === LineStatus.DRAFT && status === LineStatus.IN_REVIEW) {
      this.validateLineReadyForReview(line);
    }

    if (status === LineStatus.CANCELLED && !opts?.reason?.trim()) {
      throw new BadRequestException('Lý do hủy là bắt buọ™c');
    }

    if (status === LineStatus.CANCELLED) {
      line.previousStatus = beforeStatus;
    } else if (beforeStatus === LineStatus.CANCELLED) {
      line.previousStatus = null;
    }

    line.status = status;
    const saved = await this.lineRepo.save(line);
    await this.writeLineLog(saved, actor, PoEventType.LINE_STATUS_CHANGED, {
      reason: opts?.reason?.trim() || `Line status changed ${saved.styleCode}: ${beforeStatus} -> ${status}`,
      changes: [
        {
          field: 'status',
          label: 'Trạng thái',
          before: beforeStatus,
          after: status,
        },
      ],
    });
    return saved;
  }

  async remove(id: string): Promise<void> {
    const line = await this.findOne(id);
    await this.lineRepo.remove(line);
  }

  // â”€â”€â”€ Colors & Sizes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async addColor(lineId: string, colorName: string): Promise<LineColor> {
    await this.findOne(lineId);
    const color = this.colorRepo.create({ lineId, colorName });
    return this.colorRepo.save(color);
  }

  async addSize(
    colorId: string,
    sizeLabel: string,
    quantity: number,
  ): Promise<LineColorSize> {
    const size = this.sizeRepo.create({ colorId, sizeLabel, quantity });
    return this.sizeRepo.save(size);
  }

  async removeColor(colorId: string): Promise<void> {
    const color = await this.colorRepo.findOne({ where: { id: colorId } });
    if (!color) throw new NotFoundException(`Color #${colorId} not found`);
    await this.colorRepo.remove(color);
  }

  // â”€â”€â”€ Line Files â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async addLineFile(
    lineId: string,
    dto: { fileKey: string; originalName: string; label?: string; version?: number; fileGroupId?: string },
    actor = 'system',
  ): Promise<LineFile> {
    const line = await this.findOne(lineId);
    const file = this.lineFileRepo.create({
      lineId,
      fileUrl: dto.fileKey,
      fileName: dto.originalName,
      label: (dto.label as LineFileLabel) || LineFileLabel.TAI_LIEU_KHAC,
      version: dto.version || 1,
      fileGroupId: dto.fileGroupId || undefined,
    });
    const saved = await this.lineFileRepo.save(file);
    await this.writeLineLog(line, actor, PoEventType.LINE_FILE_ADDED, {
      reason: `Thêm file ${saved.label}: ${saved.fileName}`,
      targetLabel: saved.fileName,
    });
    return saved;
  }

  async removeLineFile(fileId: string, actor = 'system'): Promise<void> {
    const file = await this.lineFileRepo.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException(`LineFile #${fileId} not found`);
    const line = await this.findOne(file.lineId);
    await this.lineFileRepo.remove(file);
    await this.writeLineLog(line, actor, PoEventType.LINE_FILE_REMOVED, {
      reason: `Xóa file ${file.label}: ${file.fileName}`,
      targetLabel: file.fileName,
    });
  }

  // â”€â”€â”€ AS3B Steps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async findAs3bSteps(lineId: string): Promise<LineAs3bStep[]> {
    return this.stepRepo.find({
      where: { lineId },
      order: { orderIndex: 'ASC' },
    });
  }

  async addStep(
    lineId: string,
    dto: Partial<LineAs3bStep>,
    actor = 'system',
  ): Promise<LineAs3bStep> {
    const line = await this.findOne(lineId);
    const step = this.stepRepo.create({ ...dto, lineId });
    const saved = await this.stepRepo.save(step);
    await this.writeLineLog(line, actor, PoEventType.LINE_UPDATED, {
      reason: `Thêm công đoạn ${saved.stepName}`,
    });
    return saved;
  }

  async removeStep(stepId: string, actor = 'system'): Promise<void> {
    const step = await this.stepRepo.findOne({ where: { id: stepId } });
    if (!step) throw new NotFoundException(`Step #${stepId} not found`);
    const line = await this.findOne(step.lineId);
    await this.stepRepo.remove(step);
    await this.writeLineLog(line, actor, PoEventType.LINE_UPDATED, {
      reason: `Xóa công đoạn ${step.stepName}`,
    });
  }

  // â”€â”€â”€ Samples â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async findSamples(lineId: string): Promise<LineSample[]> {
    return this.sampleRepo.find({
      where: { lineId },
      relations: ['images'],
      order: { round: 'ASC' },
    });
  }

  async addSample(
    lineId: string,
    dto: Partial<LineSample> & { images?: { colorName: string; colorId?: string; imageUrl: string }[] },
    actor = 'system',
  ): Promise<LineSample> {
    const line = await this.findOne(lineId);
    const { images, ...sampleDto } = dto;
    const sample = this.sampleRepo.create({ ...sampleDto, lineId });
    const saved = await this.sampleRepo.save(sample);

    // Lưu ảnh sau khi có sampleId
    if (images && images.length > 0) {
      const imgEntities = images.map(img =>
        this.imageRepo.create({
          sampleId: saved.id,
          colorName: img.colorName || '',
          colorId: img.colorId || undefined,
          imageUrl: img.imageUrl,
        }),
      );
      await this.imageRepo.save(imgEntities);
    }

    // Trả về sample kèm images
    const finalSample = await this.sampleRepo.findOne({
      where: { id: saved.id },
      relations: ['images'],
    });
    await this.writeLineLog(line, actor, PoEventType.SAMPLE_ADDED, {
      reason: `Thêm đợt mẫu ${saved.round}${saved.feedback ? ` â€” ${saved.feedback}` : ''}`,
      targetLabel: `Đợt mẫu ${saved.round}`,
    });
    return finalSample as LineSample;
  }

  async updateSample(
    sampleId: string,
    dto: Partial<LineSample>,
    actor = 'system',
  ): Promise<LineSample> {
    const sample = await this.sampleRepo.findOne({ where: { id: sampleId } });
    if (!sample) throw new NotFoundException(`Sample #${sampleId} not found`);
    const line = await this.findOne(sample.lineId);
    const changes = Object.entries(dto).map(([field, after]) => ({
      field,
      label: field,
      before: (sample as Record<string, any>)[field],
      after,
    }));
    Object.assign(sample, dto);
    const saved = await this.sampleRepo.save(sample);
    if (changes.length > 0) {
      await this.writeLineLog(line, actor, PoEventType.LINE_UPDATED, {
        reason: `Cập nhật đợt mẫu ${saved.round}`,
        targetLabel: `Đợt mẫu ${saved.round}`,
        changes,
      });
    }
    return saved;
  }

  // â”€â”€â”€ File Mappings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async assignFileToLines(
    poId: string,
    fileId: string,
    lineIds: string[],
    actor = 'system',
  ): Promise<void> {
    // 1. Remove existing mappings for this file (optional, depending on logic, but here we sync)
    // Actually, usually we just add or sync. Let's sync for the given lineIds.
    // For drag and drop, we just want to ADD to a specific line.
    
    // If we want a simple "Add" (best for Drag & Drop):
    for (const lineId of lineIds) {
      const exists = await this.mappedFileRepo.findOne({
        where: { poFileId: fileId, lineId },
      });
      if (!exists) {
        const mapping = this.mappedFileRepo.create({ poFileId: fileId, lineId });
        await this.mappedFileRepo.save(mapping);
        const line = await this.findOne(lineId);
        await this.writeLineLog(line, actor, PoEventType.FILE_ASSIGNED, {
          reason: `Gán tài liệu PO vào sản phẩm`,
        });
      }
    }
  }
}


