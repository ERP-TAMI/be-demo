import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PurchaseOrder, PoStatus } from './entities/purchase-order.entity';
import { PoFile, FileLabel } from './entities/po-file.entity';
import { PoVersionLog, PoEventType } from './entities/po-version-log.entity';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from './dto/purchase-order.dto.js';
import { UploadsService } from '../uploads/uploads.service.js';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly poRepo: Repository<PurchaseOrder>,
    @InjectRepository(PoFile)
    private readonly poFileRepo: Repository<PoFile>,
    @InjectRepository(PoVersionLog)
    private readonly logRepo: Repository<PoVersionLog>,
    private readonly uploadsService: UploadsService,
  ) {}

  // ─── Helper: Write Audit Log ─────────────────────────────────────────────────

  private async writeLog(
    poId: string,
    actor: string,
    eventType: PoEventType,
    opts?: {
      reason?: string;
      targetId?: string;
      targetLabel?: string;
      changes?: Record<string, any>[];
    },
  ) {
    const log = this.logRepo.create({
      poId,
      actor,
      eventType,
      reason: opts?.reason,
      targetId: opts?.targetId,
      targetLabel: opts?.targetLabel,
      changes: opts?.changes,
    });
    await this.logRepo.save(log);
  }

  private async mapFiles(files: PoFile[]): Promise<PoFile[]> {
    if (!files) return [];
    await Promise.all(
      files.map(async (f) => {
        if (f.fileUrl && !f.fileUrl.startsWith('http')) {
          f.fileUrl = await this.uploadsService.getPresignedUrl(f.fileUrl);
        }
      }),
    );
    return files;
  }

  private async mapLineAssets(po: PurchaseOrder): Promise<void> {
    if (!po?.lines?.length) return;

    await Promise.all(
      po.lines.map(async (line) => {
        await Promise.all(
          (line.files || []).map(async (file) => {
            if (file.fileUrl && !file.fileUrl.startsWith('http')) {
              file.fileUrl = await this.uploadsService.getPresignedUrl(
                file.fileUrl,
              );
            }
          }),
        );

        await Promise.all(
          (line.samples || []).flatMap((sample) =>
            (sample.images || []).map(async (image) => {
              if (image.imageUrl && !image.imageUrl.startsWith('http')) {
                image.imageUrl = await this.uploadsService.getPresignedUrl(
                  image.imageUrl,
                );
              }
            }),
          ),
        );

        await Promise.all(
          (line.mappedFiles || []).map(async (mappedFile) => {
            if (
              mappedFile.poFile?.fileUrl &&
              !mappedFile.poFile.fileUrl.startsWith('http')
            ) {
              mappedFile.poFile.fileUrl =
                await this.uploadsService.getPresignedUrl(
                  mappedFile.poFile.fileUrl,
                );
            }
          }),
        );
      }),
    );
  }

  private async mapPo(po: PurchaseOrder): Promise<PurchaseOrder> {
    if (po && po.files) {
      await this.mapFiles(po.files);
    }
    await this.mapLineAssets(po);
    return po;
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  async findAll(): Promise<PurchaseOrder[]> {
    const pos = await this.poRepo.find({
      order: { createdAt: 'DESC' },
      relations: [
        'lines',
        'lines.style',
        'files',
        'lines.colors',
        'lines.colors.sizes',
        'lines.files',
        'lines.mappedFiles',
        'lines.mappedFiles.poFile',
        'lines.as3bSteps',
        'lines.samples',
        'lines.samples.images',
      ],
      relationLoadStrategy: 'query',
    });
    return Promise.all(pos.map((po) => this.mapPo(po)));
  }

  async findOne(id: string): Promise<PurchaseOrder> {
    const po = await this.poRepo.findOne({
      where: { id },
      relations: [
        'lines',
        'lines.style',
        'files',
        'lines.colors',
        'lines.colors.sizes',
        'lines.files',
        'lines.mappedFiles',
        'lines.mappedFiles.poFile',
        'lines.samples',
        'lines.samples.images',
        'lines.as3bSteps',
      ],
      relationLoadStrategy: 'query',
    });
    if (!po) throw new NotFoundException(`PurchaseOrder #${id} not found`);
    return this.mapPo(po);
  }

  async findFiles(poId: string): Promise<PoFile[]> {
    await this.findOne(poId);
    return this.poFileRepo.find({
      where: { poId },
      order: { uploadedAt: 'DESC' },
    });
  }

  async findLogs(poId: string): Promise<PoVersionLog[]> {
    await this.findOne(poId);
    return this.logRepo.find({
      where: { poId },
      order: { timestamp: 'DESC' },
    });
  }

  async create(
    dto: CreatePurchaseOrderDto,
    actorEmail: string,
  ): Promise<PurchaseOrder> {
    const existing = await this.poRepo.findOne({
      where: { poCode: dto.poCode },
    });
    if (existing) {
      throw new ConflictException(`PO code "${dto.poCode}" already exists`);
    }
    const po = this.poRepo.create({ ...dto, status: PoStatus.PENDING_RD });
    const saved = await this.poRepo.save(po);

    await this.writeLog(saved.id, actorEmail, PoEventType.PO_CREATED);

    return this.findOne(saved.id);
  }

  async update(
    id: string,
    dto: UpdatePurchaseOrderDto,
    actorEmail: string,
  ): Promise<PurchaseOrder> {
    const po = await this.findOne(id);
    const changes: Record<string, any>[] = [];

    for (const [k, value] of Object.entries(dto)) {
      const key = k as keyof UpdatePurchaseOrderDto;
      if (po[key] !== value) {
        changes.push({
          field: key,
          before: po[key] as unknown,
          after: value as unknown,
        });
      }
    }

    Object.assign(po, dto);
    const saved = await this.poRepo.save(po);

    if (changes.length > 0) {
      await this.writeLog(id, actorEmail, PoEventType.PO_INFO_UPDATED, {
        changes,
      });
    }

    return this.findOne(saved.id);
  }

  async addFile(
    poId: string,
    actorEmail: string,
    data: { fileKey: string; originalName: string; label?: string },
  ): Promise<PoFile> {
    await this.findOne(poId);
    const poFile = this.poFileRepo.create({
      poId,
      fileUrl: data.fileKey,
      fileName: data.originalName,
      label: (data.label as FileLabel) || FileLabel.TAI_LIEU_KHAC,
    });

    const saved = await this.poFileRepo.save(poFile);
    await this.writeLog(poId, actorEmail, PoEventType.FILE_ADDED, {
      targetId: saved.id,
      targetLabel: saved.fileName,
    });

    // Map URL for the single added file
    if (saved.fileUrl && !saved.fileUrl.startsWith('http')) {
      saved.fileUrl = await this.uploadsService.getPresignedUrl(saved.fileUrl);
    }

    return saved;
  }

  async removeFile(
    poId: string,
    fileId: string,
    actorEmail: string,
  ): Promise<void> {
    const file = await this.poFileRepo.findOne({ where: { id: fileId, poId } });
    if (!file)
      throw new NotFoundException(`File #${fileId} not found on PO #${poId}`);

    await this.poFileRepo.remove(file);
    await this.writeLog(poId, actorEmail, PoEventType.FILE_REMOVED, {
      targetId: file.id,
      targetLabel: file.fileName,
    });
  }

  async finalizePo(id: string, actorEmail: string): Promise<PurchaseOrder> {
    const po = await this.findOne(id);
    if (po.status === PoStatus.PO_FINAL) {
      throw new BadRequestException('PO is already finalized');
    }
    po.status = PoStatus.PO_FINAL;
    po.finalizedAt = new Date();
    const saved = await this.poRepo.save(po);

    await this.writeLog(id, actorEmail, PoEventType.PO_FINALIZED);

    return this.findOne(saved.id);
  }

  async updateStatus(
    id: string,
    status: PoStatus,
    actorEmail: string,
  ): Promise<PurchaseOrder> {
    const po = await this.findOne(id);
    const validTransitions: Partial<Record<PoStatus, PoStatus[]>> = {
      [PoStatus.DRAFT]: [PoStatus.PENDING_RD, PoStatus.CANCELLED],
      [PoStatus.PENDING_RD]: [PoStatus.IN_PROGRESS, PoStatus.CANCELLED],
      [PoStatus.IN_PROGRESS]: [PoStatus.PO_FINAL, PoStatus.CANCELLED],
    };
    const allowed = validTransitions[po.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Không thể chuyển từ ${po.status} sang ${status}`,
      );
    }
    po.status = status;
    if (status === PoStatus.PO_FINAL) {
      po.finalizedAt = new Date();
    }
    await this.poRepo.save(po);
    await this.writeLog(id, actorEmail, PoEventType.PO_FINALIZED, {
      changes: [{ field: 'status', before: po.status, after: status }],
    });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const po = await this.findOne(id);
    if (po.status === PoStatus.PO_FINAL) {
      throw new BadRequestException('Cannot delete a finalized PO');
    }
    await this.poRepo.remove(po);
  }
}
