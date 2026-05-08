import * as crypto from 'crypto';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PoLine, LineStatus, LineCategory } from './entities/po-line.entity';
import { PoLineVersion } from './entities/po-line-version.entity';
import { LineColor } from './entities/line-color.entity';
import { LineColorSize } from './entities/line-color-size.entity';
import { LineAs3bStep } from './entities/line-as3b-step.entity';
import {
  LineSample,
  SampleStatus as LineSampleStatus,
} from './entities/line-sample.entity';
import { SampleColorImage } from './entities/sample-color-image.entity';
import { LineMappedFile } from './entities/line-mapped-file.entity';
import { LineFile, LineFileLabel } from './entities/line-file.entity';
import {
  PoVersionLog,
  PoEventType,
} from '../purchase-orders/entities/po-version-log.entity';
import {
  PurchaseOrder,
  PoStatus,
} from '../purchase-orders/entities/purchase-order.entity';
import { StyleAs3bStep } from '../styles/entities/style-as3b-step.entity';
import { Style, StyleStatus } from '../styles/entities/style.entity';
import { Bom, BomStatus } from '../boms/entities/bom.entity';
import { UserRole } from '../user/entities/user.entity';
import { StyleProductionDoc } from '../styles/entities/style-production-doc.entity.js';
import { ProductionDoc } from '../production-docs/entities/production-doc.entity.js';
import { ProductionDocSizeRow } from '../production-docs/entities/production-doc-size-row.entity.js';
import { ProductionDocSection } from '../production-docs/entities/production-doc-section.entity.js';
import { Sample } from '../samples/entities/sample.entity.js';

@Injectable()
export class PoLinesService {
  constructor(
    @InjectRepository(PoLine)
    private readonly lineRepo: Repository<PoLine>,
    @InjectRepository(PoLineVersion)
    private readonly versionRepo: Repository<PoLineVersion>,
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
    @InjectRepository(PurchaseOrder)
    private readonly poRepo: Repository<PurchaseOrder>,
    @InjectRepository(StyleAs3bStep)
    private readonly styleAs3bRepo: Repository<StyleAs3bStep>,
    @InjectRepository(Style)
    private readonly styleRepo: Repository<Style>,
    @InjectRepository(Bom)
    private readonly bomRepo: Repository<Bom>,
    @InjectRepository(StyleProductionDoc)
    private readonly styleDocRepo: Repository<StyleProductionDoc>,
    @InjectRepository(Sample)
    private readonly styleSampleRepo: Repository<Sample>,
    @InjectRepository(ProductionDoc)
    private readonly docRepo: Repository<ProductionDoc>,
    @InjectRepository(ProductionDocSizeRow)
    private readonly sizeRowRepo: Repository<ProductionDocSizeRow>,
    @InjectRepository(ProductionDocSection)
    private readonly sectionRepo: Repository<ProductionDocSection>,
  ) {}

  private assertLineNotLocked(line: PoLine): void {
    if (line.status === LineStatus.FINAL) {
      throw new ForbiddenException(
        'Sản phẩm đã chốt (Final). Vui lòng yêu cầu TPKH mở khóa để chỉnh sửa.',
      );
    }
  }

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
      targetLabel:
        opts?.targetLabel || `${line.styleCode} — ${line.productName}`,
      changes: opts?.changes,
    });
    await this.logRepo.save(log);
  }

  private validateLineReadyForReview(line: PoLine): void {
    const hasStyleCode = !!line.styleCode?.trim();
    const hasProductName = !!line.productName?.trim();
    const hasDeadline = !!line.deadline;
    const validColors = (line.colors || []).filter((color) =>
      color.colorName?.trim(),
    );
    const totalQty = validColors.reduce(
      (sum, color) =>
        sum +
        (color.sizes || []).reduce(
          (colorSum, size) => colorSum + Number(size.quantity || 0),
          0,
        ),
      0,
    );

    if (
      !hasStyleCode ||
      !hasProductName ||
      !hasDeadline ||
      validColors.length === 0 ||
      totalQty <= 0
    ) {
      throw new BadRequestException(
        'Sản phẩm chưa đủ dữ liệu để chuyển In Review. Cần có mã hàng, tên sản phẩm, màu sắc, số lượng và deadline.',
      );
    }
  }

  // ─── Lines CRUD ───────────────────────────────────────────────────────────

  private assertTransitionRole(
    beforeStatus: LineStatus,
    nextStatus: LineStatus,
    actorRole?: UserRole,
  ): void {
    if (!actorRole) {
      throw new ForbiddenException(
        'Không xác định được vai trò người thực hiện',
      );
    }

    if (
      beforeStatus === LineStatus.CANCELLED ||
      nextStatus === LineStatus.CANCELLED
    ) {
      if (actorRole !== UserRole.TPKH) {
        throw new ForbiddenException(
          'Chỉ TPKH mới được hủy hoặc khôi phục sản phẩm',
        );
      }
      return;
    }

    if (
      beforeStatus === LineStatus.DRAFT &&
      nextStatus === LineStatus.IN_REVIEW &&
      actorRole !== UserRole.RD
    ) {
      throw new ForbiddenException(
        'Chỉ R&D mới được chuyển sản phẩm sang In Review',
      );
    }

    // Cho phép RD, NVKH, TPKH chuyển thẳng Draft → Sampling
    if (
      beforeStatus === LineStatus.DRAFT &&
      nextStatus === LineStatus.SAMPLING &&
      actorRole !== UserRole.RD &&
      actorRole !== UserRole.NVKH &&
      actorRole !== UserRole.TPKH
    ) {
      throw new ForbiddenException(
        'Chỉ R&D, NVKH, TPKH mới được chuyển sản phẩm sang Sampling',
      );
    }

    if (
      beforeStatus === LineStatus.IN_REVIEW &&
      nextStatus === LineStatus.SAMPLING &&
      actorRole !== UserRole.NVKH &&
      actorRole !== UserRole.TPKH
    ) {
      throw new ForbiddenException(
        'Chỉ NVKH hoặc TPKH mới được chuyển sản phẩm sang Sampling',
      );
    }

    if (
      beforeStatus === LineStatus.SAMPLING &&
      nextStatus === LineStatus.FINAL &&
      actorRole !== UserRole.TPKH
    ) {
      throw new ForbiddenException('Chỉ TPKH mới được chốt Final');
    }
  }

  async findByPo(poId: string): Promise<PoLine[]> {
    return this.lineRepo.find({
      where: { poId },
      relations: ['colors', 'colors.sizes', 'style'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<PoLine> {
    const line = await this.lineRepo.findOne({
      where: { id },
      relations: [
        'style', // Style cha — hiển thị thông tin kế thừa
        'colors',
        'colors.sizes',
        'files',
        'as3bSteps',
        'samples',
        'samples.images',
        'mappedFiles',
        'mappedFiles.poFile',
      ],
    });
    if (!line) throw new NotFoundException(`Line #${id} not found`);
    
    if (line.as3bSteps) {
      line.as3bSteps.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    }
    
    return line;
  }

  async create(
    poId: string,
    dto: Partial<PoLine>,
    actor = 'system',
  ): Promise<PoLine> {
    // ── Validate & kế thừa từ Style cha (nếu có) ──────────────────────────────
    let inheritedStyleCode = dto.styleCode || '';
    let inheritedProductName = dto.productName || '';
    let inheritedCategory: any = dto.category;

    let styleEntity: Style | null = null;
    if (dto.styleId) {
      styleEntity = await this.styleRepo.findOne({
        where: { id: dto.styleId },
      });
      const style = styleEntity;
      if (style) {
        // Kế thừa thông tin từ Style cha
        inheritedStyleCode = dto.styleCode || style.styleCode;
        inheritedProductName = dto.productName || style.styleName;
        inheritedCategory = style.category ?? dto.category;
        if (style.status !== StyleStatus.ACTIVE) {
          throw new BadRequestException(
            `Style "${style.styleCode}" chưa được Active. Chỉ có thể tạo sản phẩm từ Style đã Active.`,
          );
        }
      }
    }

    try {
      // Normalize category case (e.g. "JACKET" -> "Jacket") to avoid enum violation
      let finalCategory: LineCategory | undefined = undefined;
      if (inheritedCategory && typeof inheritedCategory === 'string') {
        const match = Object.values(LineCategory).find(
          (v) => v.toLowerCase() === inheritedCategory.trim().toLowerCase(),
        );
        finalCategory = match || undefined;
      }

      const line = this.lineRepo.create({
        ...dto,
        poId,
        styleCode: inheritedStyleCode,
        productName: inheritedProductName,
        category: finalCategory,
        status: LineStatus.SAMPLING, // Tự động vào trạng thái đang thực hiện khi mapping
        versionNumber: 1,
        as3bCmBaseDays: styleEntity?.as3bCmBaseDays || 30,
      });
      const saved = await this.lineRepo.save(line);
      await this.writeLineLog(saved, actor, PoEventType.LINE_ADDED, {
        reason: `Khởi tạo sản phẩm từ Style ${inheritedStyleCode} - ${inheritedProductName}`,
      });

      // Auto-transition PO: Pending_RD -> In_Progress khi them line dau tien
      const po = await this.poRepo.findOne({ where: { id: poId } });
      if (po && po.status === PoStatus.PENDING_RD) {
        po.status = PoStatus.IN_PROGRESS;
        await this.poRepo.save(po);
      }

      // ── Kế thừa AS3B từ Style ──────────────────────────────────────────────
      const styleSteps = await this.styleAs3bRepo.find({
        where: { styleId: dto.styleId! },
        order: { orderIndex: 'ASC' },
      });
      if (styleSteps.length > 0) {
        const idMap = new Map<string, string>();
        // First pass: generate new IDs
        styleSteps.forEach(s => {
          idMap.set(s.id, crypto.randomUUID());
        });
        
        const lineSteps = styleSteps.map((s) =>
          this.stepRepo.create({
            id: idMap.get(s.id),
            lineId: saved.id,
            stageId: s.stageId,
            stepName: s.stepName,
            description: s.description,
            timePerPc: s.timePerPc,
            ssv: s.ssv,
            targetTotal: s.targetTotal,
            note: s.note,
            orderIndex: s.orderIndex,
            parentRowId: s.parentRowId ? idMap.get(s.parentRowId) : null,
            isGroup: s.isGroup,
            groupId: s.groupId,
            groupItems: s.groupItems,
          }),
        );
        await this.stepRepo.save(lineSteps);
        await this.writeLineLog(saved, actor, PoEventType.LINE_UPDATED, {
          reason: `Kế thừa AS3B từ Style ${inheritedStyleCode} (${styleSteps.length} công đoạn)`,
        });
      }

      // ── Kế thừa Tài liệu sản xuất từ Style ───────────────────────────────
      const styleDoc = await this.styleDocRepo.findOne({
        where: { styleId: dto.styleId! },
      });
      if (styleDoc) {
        const prodDoc = this.docRepo.create({
          lineId: saved.id,
          section1MoTa: styleDoc.section1Description,
          section1ImageUrl: styleDoc.section1ImageUrl,
          section2PhuLieu: styleDoc.section2Accessories,
          section3LuuYTraiCat: styleDoc.section3Notes,
          section4CommentKhachHang: styleDoc.section4CustomerFeedback,
        });
        const savedProdDoc = await this.docRepo.save(prodDoc);

        // Clone sizeData from Style → PoLine sizeRows.
        // Style stores images-only ({imageUrl, orderIndex}); now that the PO Line
        // editor is also image-based, copy every entry regardless of rowName.
        if (
          styleDoc.sizeData &&
          Array.isArray(styleDoc.sizeData) &&
          styleDoc.sizeData.length > 0
        ) {
          const rows = styleDoc.sizeData.map((r: any, i: number) =>
            this.sizeRowRepo.create({
              docId: savedProdDoc.id,
              rowName: r.rowName ?? '', // default '' — NOT NULL constraint is satisfied
              imageUrl: r.imageUrl ?? null,
              sValue: r.sValue ?? null,
              mValue: r.mValue ?? null,
              lValue: r.lValue ?? null,
              xlValue: r.xlValue ?? null,
              patternValue: r.patternValue ?? null,
              tolPlusMinus: r.tolPlusMinus ?? null,
              orderIndex: r.orderIndex ?? i,
            }),
          );
          await this.sizeRowRepo.save(rows);
        }

        // Map sections
        if (styleDoc.sections && Array.isArray(styleDoc.sections)) {
          const sections = styleDoc.sections.map((s: any, i: number) =>
            this.sectionRepo.create({
              docId: savedProdDoc.id,
              title: s.title,
              content: s.content,
              imageUrls: s.imageUrls,
              imageGroups: Array.isArray(s.imageGroups)
                ? s.imageGroups.map((group: any) => ({
                    ...group,
                    imageUrls: (group.imageUrls ?? []).slice(0, 2),
                  }))
                : s.imageUrls?.length
                  ? Array.from(
                      { length: Math.ceil(s.imageUrls.length / 2) },
                      (_unused, groupIndex) => ({
                        heading: null,
                        headingColor: 'red',
                        imageUrls: s.imageUrls.slice(
                          groupIndex * 2,
                          groupIndex * 2 + 2,
                        ),
                        orderIndex: groupIndex,
                      }),
                    )
                  : [],
              orderIndex: s.orderIndex ?? i,
            }),
          );
          await this.sectionRepo.save(sections);
        }
        await this.writeLineLog(saved, actor, PoEventType.LINE_UPDATED, {
          reason: `Kế thừa Tài liệu sản xuất từ Style ${inheritedStyleCode}`,
        });
      }

      // ── Kế thừa Mẫu từ Style ───────────────────────────────────────────────
      const styleSamples = await this.styleSampleRepo.find({
        where: { styleId: dto.styleId! },
        order: { createdAt: 'ASC' },
      });
      if (styleSamples && styleSamples.length > 0) {
        const savedLineSamples: LineSample[] = [];
        let roundCounter = 1;
        let totalSamplesCopied = 0;

        for (let i = 0; i < styleSamples.length; i++) {
          const s = styleSamples[i];

          // Copy current (latest) sample
          let statusEnum = LineSampleStatus.DANG_LAM;
          if (s.status === 'Approved') statusEnum = LineSampleStatus.DA_DUYET;
          else if (s.status === 'In_Analysis')
            statusEnum = LineSampleStatus.CAN_CHINH_SUA;

          const ls = this.sampleRepo.create({
            lineId: saved.id,
            round: roundCounter++,
            sampleDate: new Date().toISOString().slice(0, 10),
            feedback: s.analysisResult || s.description || '',
            status: statusEnum,
          });
          const savedLs = await this.sampleRepo.save(ls);
          savedLineSamples.push(savedLs);
          totalSamplesCopied++;

          if (s.images && Array.isArray(s.images) && s.images.length > 0) {
            const imgsToSave = s.images.map((imgUrl) =>
              this.imageRepo.create({
                sampleId: savedLs.id,
                colorName: 'Ảnh mẫu từ Style',
                imageUrl: imgUrl,
              }),
            );
            await this.imageRepo.save(imgsToSave);
          }
        }
        await this.writeLineLog(saved, actor, PoEventType.LINE_UPDATED, {
          reason: `Kế thừa ${totalSamplesCopied} version mẫu từ Style ${inheritedStyleCode}`,
        });
      }

      // Đã loại bỏ luồng "Kế thừa Files từ Style" vì file sẽ được map động (mappedSource: "Từ Style Cha")
      // nhằm tránh trùng lặp 2 luồng tài liệu.

      return saved;
    } catch (e) {
      throw new BadRequestException(`Lỗi tạo PO Line: ${e.message}`);
    }
  }

  async update(
    id: string,
    dto: Partial<PoLine> & { reason?: string },
    actor = 'system',
  ): Promise<PoLine> {
    const { reason, ...lineDto } = dto;

    // Business Rule: Bắt buộc phải có lý do thay đổi
    if (!reason?.trim()) {
      throw new BadRequestException(
        'Lý do cập nhật là bắt buộc (trường reason không được để trống)',
      );
    }

    const line = await this.findOne(id);
    this.assertLineNotLocked(line);

    // Business Rule: KHÔNG GHI ĐÈ — lưu snapshot trước khi thay đổi
    const snapshot: Record<string, any> = {
      styleCode: line.styleCode,
      productName: line.productName,
      colorId: line.colorId,
      colorName: line.colorName,
      deadline: line.deadline,
      material: line.material,
      category: line.category,
      versionNumber: line.versionNumber,
      status: line.status,
    };
    const lineVersion = this.versionRepo.create({
      lineId: line.id,
      versionNo: line.versionNumber,
      snapshotData: snapshot,
      changeReason: reason.trim(),
      changedBy: actor,
    });
    await this.versionRepo.save(lineVersion);

    // Tăng version_number lên 1
    line.versionNumber = (line.versionNumber ?? 1) + 1;

    // User-editable fields: respect user input, do NOT overwrite with parent style values
    const editableFields = [
      'styleCode',
      'productName',
      'category',
      'colorId',
      'colorName',
      'deadline',
      'material',
    ];
    const changes = Object.entries(lineDto).map(([field, after]) => ({
      field,
      label: field,
      before: (line as Record<string, any>)[field],
      after,
    }));
    Object.entries(lineDto).forEach(([field, value]) => {
      if (editableFields.includes(field)) {
        line[field] = value;
      }
    });
    const saved = await this.lineRepo.save(line);

    if (changes.length > 0) {
      await this.writeLineLog(saved, actor, PoEventType.LINE_UPDATED, {
        reason,
        changes,
      });
    }
    return saved;
  }

  // ─── Lock / Unlock (chỉ TPKH) ────────────────────────────────────────────

  /**
   * Chốt SP Final (Lock):
   * 1. Khoá thông số PoLine (status → Final)
   * 2. BOM được tạo thủ công ở màn BOM
   * Business Rule: Chỉ TPKH được thực hiện.
   */
  async lockLine(
    id: string,
    actor = 'system',
  ): Promise<{ line: PoLine; bom: Bom | null }> {
    const line = await this.findOne(id);

    if (line.status === LineStatus.FINAL) {
      throw new BadRequestException('Sản phẩm đã được chốt Final rồi');
    }
    if (line.status === LineStatus.CANCELLED) {
      throw new BadRequestException('Không thể chốt sản phẩm đã bị hủy');
    }

    // Set status = Final
    line.status = LineStatus.FINAL;
    const savedLine = await this.lineRepo.save(line);

    await this.writeLineLog(savedLine, actor, PoEventType.LINE_STATUS_CHANGED, {
      reason: `TPKH chốt Final — BOM sẽ được tạo thủ công ở màn BOM`,
      changes: [
        {
          field: 'status',
          label: 'Trạng thái',
          before: line.status,
          after: LineStatus.FINAL,
        },
      ],
    });

    return { line: savedLine, bom: null };
  }

  /**
   * Mở khoá SP (Unlock) — chỉ TPKH.
   * Đưa PoLine về trạng thái Sampling để có thể chỉnh sửa lại.
   */
  async unlockLine(id: string, actor = 'system'): Promise<PoLine> {
    const line = await this.findOne(id);

    if (line.status !== LineStatus.FINAL) {
      throw new BadRequestException(
        'Chỉ có thể mở khoá sản phẩm đang ở trạng thái Final',
      );
    }

    line.previousStatus = LineStatus.FINAL;
    line.status = LineStatus.SAMPLING;
    const saved = await this.lineRepo.save(line);

    await this.writeLineLog(saved, actor, PoEventType.LINE_STATUS_CHANGED, {
      reason: `TPKH mở khoá sản phẩm để chỉnh sửa`,
      changes: [
        {
          field: 'status',
          label: 'Trạng thái',
          before: LineStatus.FINAL,
          after: LineStatus.SAMPLING,
        },
      ],
    });

    return saved;
  }

  /** Lấy lịch sử phiên bản của một PoLine */
  async findVersionHistory(lineId: string): Promise<PoLineVersion[]> {
    return this.versionRepo.find({
      where: { lineId },
      order: { versionNo: 'DESC' },
    });
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
      [LineStatus.DRAFT]: [
        LineStatus.IN_REVIEW,
        LineStatus.SAMPLING,
        LineStatus.CANCELLED,
      ],
      [LineStatus.IN_REVIEW]: [LineStatus.SAMPLING, LineStatus.CANCELLED],
      [LineStatus.SAMPLING]: [LineStatus.FINAL, LineStatus.CANCELLED],
      [LineStatus.FINAL]: [],
      [LineStatus.CANCELLED]: [],
    };

    if (line.status === LineStatus.CANCELLED) {
      if (!line.previousStatus || status !== line.previousStatus) {
        throw new BadRequestException(
          'Chỉ có thể khôi phục sản phẩm về trạng thái trước khi hủy',
        );
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
      throw new BadRequestException('Lý do hủy là bắt buộc');
    }

    if (status === LineStatus.CANCELLED) {
      line.previousStatus = beforeStatus;
    } else if (beforeStatus === LineStatus.CANCELLED) {
      line.previousStatus = null;
    }

    line.status = status;
    const saved = await this.lineRepo.save(line);
    await this.writeLineLog(saved, actor, PoEventType.LINE_STATUS_CHANGED, {
      reason:
        opts?.reason?.trim() ||
        `Line status changed ${saved.styleCode}: ${beforeStatus} -> ${status}`,
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

  // ─── Colors & Sizes ───────────────────────────────────────────────────

  async addColor(lineId: string, colorName: string): Promise<LineColor> {
    const line = await this.findOne(lineId);
    this.assertLineNotLocked(line);
    const color = this.colorRepo.create({ lineId, colorName });
    return this.colorRepo.save(color);
  }

  async addSize(
    colorId: string,
    sizeLabel: string,
    quantity: number,
  ): Promise<LineColorSize> {
    const color = await this.colorRepo.findOne({ where: { id: colorId } });
    if (!color) throw new NotFoundException(`Color #${colorId} not found`);
    const line = await this.findOne(color.lineId);
    this.assertLineNotLocked(line);
    const size = this.sizeRepo.create({ colorId, sizeLabel, quantity });
    return this.sizeRepo.save(size);
  }

  async removeColor(colorId: string): Promise<void> {
    const color = await this.colorRepo.findOne({ where: { id: colorId } });
    if (!color) throw new NotFoundException(`Color #${colorId} not found`);
    const line = await this.findOne(color.lineId);
    this.assertLineNotLocked(line);
    await this.colorRepo.remove(color);
  }

  /**
   * Thay thế toàn bộ danh sách màu + sizes của một PO Line.
   * Dùng cho trường hợp quản lý nhiều màu chung trong 1 PO Line (tách BOM sau).
   * - Màu có id hợp lệ → update tên & sizes
   * - Màu không có id hoặc id mới → insert
   * - Màu cũ không còn trong payload → delete
   */
  async replaceColors(
    lineId: string,
    colorsPayload: Array<{
      id?: string;
      colorName: string;
      sizes: Array<{ sizeLabel: string; quantity: number }>;
    }>,
    actor = 'system',
  ): Promise<LineColor[]> {
    const line = await this.findOne(lineId);
    this.assertLineNotLocked(line);

    const UUID_RE =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validUUID = (v?: string) => v && UUID_RE.test(v) ? v : undefined;

    const existingColors = await this.colorRepo.find({
      where: { lineId },
      relations: ['sizes'],
    });

    const payloadIds = new Set(
      colorsPayload.map((c) => validUUID(c.id)).filter(Boolean),
    );

    // Xóa các màu không còn trong payload
    const toDelete = existingColors.filter((c) => !payloadIds.has(c.id));
    if (toDelete.length > 0) {
      await this.colorRepo.remove(toDelete);
    }

    const result: LineColor[] = [];

    for (const colorDto of colorsPayload) {
      const existingId = validUUID(colorDto.id);
      let color = existingId
        ? existingColors.find((c) => c.id === existingId) ?? null
        : null;

      if (color) {
        // Update tên màu
        color.colorName = colorDto.colorName;
        color = await this.colorRepo.save(color);
        // Xóa hết sizes cũ
        await this.sizeRepo.delete({ colorId: color.id });
      } else {
        // Insert màu mới
        color = await this.colorRepo.save(
          this.colorRepo.create({ lineId, colorName: colorDto.colorName }),
        );
      }

      // Insert sizes mới
      if (colorDto.sizes && colorDto.sizes.length > 0) {
        const sizes = colorDto.sizes.map((s) =>
          this.sizeRepo.create({
            colorId: color!.id,
            sizeLabel: s.sizeLabel,
            quantity: Number(s.quantity) || 0,
          }),
        );
        await this.sizeRepo.save(sizes);
      }

      result.push(color);
    }

    await this.writeLineLog(line, actor, PoEventType.LINE_UPDATED, {
      reason: `Cập nhật ${colorsPayload.length} màu sắc`,
    });

    return result;
  }

  // ─── Line Files ─────────────────────────────────────────────────────────

  async addLineFile(
    lineId: string,
    dto: {
      fileKey: string;
      originalName: string;
      label?: string;
      version?: number;
      fileGroupId?: string;
    },
    actor = 'system',
  ): Promise<LineFile> {
    const line = await this.findOne(lineId);
    this.assertLineNotLocked(line);
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
    this.assertLineNotLocked(line);
    await this.lineFileRepo.remove(file);
    await this.writeLineLog(line, actor, PoEventType.LINE_FILE_REMOVED, {
      reason: `Xóa file ${file.label}: ${file.fileName}`,
      targetLabel: file.fileName,
    });
  }

  // ─── AS3B Steps ────────────────────────────────────────────────────────

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
    this.assertLineNotLocked(line);
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
    this.assertLineNotLocked(line);
    await this.stepRepo.remove(step);
    await this.writeLineLog(line, actor, PoEventType.LINE_UPDATED, {
      reason: `Xóa công đoạn ${step.stepName}`,
    });
  }

  async syncAs3bSteps(
    lineId: string,
    stepsDto: Partial<LineAs3bStep>[],
    actor = 'system',
    as3bCmBaseDays?: number,
  ): Promise<LineAs3bStep[]> {
    const line = await this.findOne(lineId);
    this.assertLineNotLocked(line);

    if (as3bCmBaseDays) {
      await this.lineRepo.update(lineId, { as3bCmBaseDays });
    }

    // Xóa các bước cũ
    await this.stepRepo.delete({ lineId });

    // Thêm các bước mới
    const steps = stepsDto.map((dto, idx) =>
      this.stepRepo.create({
        ...dto,
        lineId,
        orderIndex: dto.orderIndex ?? idx + 1,
      }),
    );
    const saved = await this.stepRepo.save(steps);

    await this.writeLineLog(line, actor, PoEventType.LINE_UPDATED, {
      reason: `Cập nhật bảng thông số kỹ thuật (AS3B) — ${saved.length} công đoạn`,
    });

    return saved;
  }

  // ─── Samples ────────────────────────────────────────────────────────────

  async findSamples(lineId: string): Promise<LineSample[]> {
    return this.sampleRepo.find({
      where: { lineId },
      relations: ['images'],
      order: { round: 'ASC' },
    });
  }

  async addSample(
    lineId: string,
    dto: Partial<LineSample> & {
      images?: { colorName: string; colorId?: string; imageUrl: string }[];
    },
    actor = 'system',
  ): Promise<LineSample> {
    const line = await this.findOne(lineId);
    this.assertLineNotLocked(line);
    const { images, ...sampleDto } = dto;
    const sample = this.sampleRepo.create({ ...sampleDto, lineId });
    const saved = await this.sampleRepo.save(sample);

    // Lưu ảnh sau khi có sampleId
    if (images && images.length > 0) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const imgEntities = images.map((img) =>
        this.imageRepo.create({
          sampleId: saved.id,
          colorName: img.colorName || '',
          colorId:
            img.colorId && uuidRegex.test(img.colorId)
              ? img.colorId
              : undefined,
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
      reason: `Thêm đợt mẫu ${saved.round}${saved.feedback ? ` — ${saved.feedback}` : ''}`,
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
    this.assertLineNotLocked(line);
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

  // ─── File Mappings ─────────────────────────────────────────────────────

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
      const line = await this.findOne(lineId);
      this.assertLineNotLocked(line);

      const exists = await this.mappedFileRepo.findOne({
        where: { poFileId: fileId, lineId },
      });
      if (!exists) {
        const mapping = this.mappedFileRepo.create({
          poFileId: fileId,
          lineId,
        });
        await this.mappedFileRepo.save(mapping);
        await this.writeLineLog(line, actor, PoEventType.FILE_ASSIGNED, {
          reason: `Gán tài liệu PO vào sản phẩm`,
        });
      }
    }
  }
}
