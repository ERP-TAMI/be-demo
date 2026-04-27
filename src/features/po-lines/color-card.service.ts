import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LineColor } from './entities/line-color.entity';
import { LineColorCard } from './entities/line-color-card.entity';
import { LineStatus, PoLine } from './entities/po-line.entity';
import {
  PoStatus,
  PurchaseOrder,
} from '../purchase-orders/entities/purchase-order.entity';
import { UploadsService } from '../uploads/uploads.service.js';
import { UserRole } from '../user/entities/user.entity';

const UPLOAD_ROLES: UserRole[] = [UserRole.TPKH, UserRole.NVKH, UserRole.RD];
const COLOR_CARD_FOLDER = 'color-cards';

export interface ColorCardDto {
  id: string;
  lineColorId: string;
  filePath: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: Date;
  status: 'active' | 'inactive';
  previewUrl: string;
}

@Injectable()
export class ColorCardService {
  private readonly logger = new Logger(ColorCardService.name);

  constructor(
    @InjectRepository(LineColor)
    private readonly colorRepo: Repository<LineColor>,
    @InjectRepository(LineColorCard)
    private readonly cardRepo: Repository<LineColorCard>,
    @InjectRepository(PoLine)
    private readonly lineRepo: Repository<PoLine>,
    @InjectRepository(PurchaseOrder)
    private readonly poRepo: Repository<PurchaseOrder>,
    private readonly uploadsService: UploadsService,
  ) {}

  private async resolveColor(
    poId: string,
    colorId: string,
  ): Promise<{ color: LineColor; line: PoLine; po: PurchaseOrder }> {
    const color = await this.colorRepo.findOne({ where: { id: colorId } });
    if (!color) {
      throw new NotFoundException(`LineColor #${colorId} not found`);
    }

    const line = await this.lineRepo.findOne({ where: { id: color.lineId } });
    if (!line) {
      throw new NotFoundException(`PoLine not found for color #${colorId}`);
    }

    if (line.poId !== poId) {
      throw new ForbiddenException('Color card does not belong to this PO.');
    }

    const po = await this.poRepo.findOne({ where: { id: line.poId } });
    if (!po) {
      throw new NotFoundException(`PurchaseOrder not found for line #${line.id}`);
    }

    return { color, line, po };
  }

  private assertCanUpload(
    line: PoLine,
    po: PurchaseOrder,
    actorRole: UserRole,
  ): void {
    if (!UPLOAD_ROLES.includes(actorRole)) {
      throw new ForbiddenException(
        `Role "${actorRole}" cannot upload color cards.`,
      );
    }

    if (
      line.status === LineStatus.FINAL ||
      line.status === LineStatus.CANCELLED
    ) {
      throw new ForbiddenException(
        `Cannot upload color card when line is "${line.status}".`,
      );
    }

    if (po.status === PoStatus.PO_FINAL) {
      throw new ForbiddenException(
        'Cannot upload color card when PO is Final.',
      );
    }
  }

  private mockAuditLog(opts: {
    action: 'CREATE' | 'UPDATE';
    colorId: string;
    oldFilePath?: string;
    newFilePath: string;
    reason?: string;
    actor: string;
  }): void {
    this.logger.log(
      `[AUDIT] action=${opts.action} colorId=${opts.colorId} ` +
        `actor=${opts.actor} old=${opts.oldFilePath ?? 'N/A'} ` +
        `new=${opts.newFilePath}` +
        (opts.reason ? ` reason="${opts.reason}"` : ''),
    );
  }

  async upsertColorCard(opts: {
    poId: string;
    colorId: string;
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    actorId: string;
    actorRole: UserRole;
    reason?: string;
  }): Promise<ColorCardDto> {
    this.logger.log(
      `[upsertColorCard] START colorId=${opts.colorId} actor=${opts.actorId}`,
    );

    const { color, line, po } = await this.resolveColor(opts.poId, opts.colorId);
    this.assertCanUpload(line, po, opts.actorRole);

    const existing = await this.cardRepo.findOne({
      where: { lineColorId: color.id },
    });

    if (existing && !opts.reason?.trim()) {
      throw new BadRequestException('Replacement reason is required.');
    }

    // Upload after validation so rejected replaces do not leave orphaned files.
    const uploadResult = await this.uploadsService.uploadFile(
      COLOR_CARD_FOLDER,
      opts.originalName,
      opts.buffer,
      opts.mimeType,
    );

    let card: LineColorCard;

    if (existing) {
      const oldFilePath = existing.filePath;
      existing.filePath = uploadResult.fileKey;
      existing.fileName = opts.originalName;
      existing.uploadedBy = opts.actorId;
      existing.uploadedAt = new Date();
      card = await this.cardRepo.save(existing);

      this.mockAuditLog({
        action: 'UPDATE',
        colorId: opts.colorId,
        oldFilePath,
        newFilePath: uploadResult.fileKey,
        reason: opts.reason?.trim(),
        actor: opts.actorId,
      });

      this.logger.log(
        `[upsertColorCard] REPLACED colorId=${opts.colorId} newKey=${uploadResult.fileKey}`,
      );
    } else {
      card = this.cardRepo.create({
        lineColorId: color.id,
        filePath: uploadResult.fileKey,
        fileName: opts.originalName,
        uploadedBy: opts.actorId,
        status: 'active',
      });
      card = await this.cardRepo.save(card);

      this.mockAuditLog({
        action: 'CREATE',
        colorId: opts.colorId,
        newFilePath: uploadResult.fileKey,
        actor: opts.actorId,
      });

      this.logger.log(
        `[upsertColorCard] CREATED colorId=${opts.colorId} key=${uploadResult.fileKey}`,
      );
    }

    return this.toDto(card, uploadResult.fileUrl);
  }

  async getColorCard(
    poId: string,
    colorId: string,
  ): Promise<ColorCardDto | null> {
    this.logger.log(`[getColorCard] colorId=${colorId}`);
    await this.resolveColor(poId, colorId);

    const card = await this.cardRepo.findOne({
      where: { lineColorId: colorId },
    });

    if (!card) return null;

    const previewUrl = await this.uploadsService.getPresignedUrl(card.filePath);
    return this.toDto(card, previewUrl);
  }

  private toDto(card: LineColorCard, previewUrl: string): ColorCardDto {
    return {
      id: card.id,
      lineColorId: card.lineColorId,
      filePath: card.filePath,
      fileName: card.fileName,
      uploadedBy: card.uploadedBy,
      uploadedAt: card.uploadedAt,
      status: card.status,
      previewUrl,
    };
  }
}
