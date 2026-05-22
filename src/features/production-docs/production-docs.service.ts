import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ExcelJS from 'exceljs';
import axios from 'axios';
import { imageSize } from 'image-size';
import { ProductionDoc } from './entities/production-doc.entity';
import { ProductionDocSizeRow } from './entities/production-doc-size-row.entity';
import { ProductionDocSection } from './entities/production-doc-section.entity';
import { SaveProductionDocDto } from './dto/save-production-doc.dto.js';
import { LineStatus, PoLine } from '../po-lines/entities/po-line.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { StyleProductionDoc } from '../styles/entities/style-production-doc.entity';
import { Style } from '../styles/entities/style.entity';
import { Bom } from '../boms/entities/bom.entity';
import { UploadsService } from '../uploads/uploads.service.js';

@Injectable()
export class ProductionDocsService {
  constructor(
    @InjectRepository(ProductionDoc)
    private readonly docRepo: Repository<ProductionDoc>,
    @InjectRepository(ProductionDocSizeRow)
    private readonly sizeRowRepo: Repository<ProductionDocSizeRow>,
    @InjectRepository(ProductionDocSection)
    private readonly sectionRepo: Repository<ProductionDocSection>,
    @InjectRepository(PoLine)
    private readonly lineRepo: Repository<PoLine>,
    @InjectRepository(PurchaseOrder)
    private readonly poRepo: Repository<PurchaseOrder>,
    @InjectRepository(StyleProductionDoc)
    private readonly styleDocRepo: Repository<StyleProductionDoc>,
    @InjectRepository(Style)
    private readonly styleRepo: Repository<Style>,
    @InjectRepository(Bom)
    private readonly bomRepo: Repository<Bom>,
    private readonly uploadsService: UploadsService,
  ) {}

  private async assertLineNotLocked(lineId: string): Promise<PoLine> {
    const line = await this.lineRepo.findOne({ where: { id: lineId } });
    if (!line) {
      throw new NotFoundException(`PoLine #${lineId} not found`);
    }
    // Tài liệu sản xuất vẫn cho phép chỉnh sửa khi Final
    // Chỉ block khi PO đã chốt (check qua PO status nếu cần)
    return line;
  }

  async findByLineId(lineId: string): Promise<ProductionDoc | null> {
    const doc = await this.docRepo.findOne({
      where: { lineId },
      relations: ['sizeRows', 'sections'],
      order: {
        sizeRows: { orderIndex: 'ASC' },
        sections: { orderIndex: 'ASC' },
      },
    });

    return this.withFreshFinalDocUrl(doc);
  }

  async uploadFinal(
    lineId: string,
    file: Express.Multer.File,
  ): Promise<{ finalDocUrl: string; finalDocName: string }> {
    let doc = await this.docRepo.findOne({ where: { lineId } });

    if (!doc) {
      const line = await this.lineRepo.findOne({ where: { id: lineId } });
      if (!line) throw new NotFoundException('Không tìm thấy sản phẩm PO line');
      doc = this.docRepo.create({ lineId });
    }

    const result = await this.uploadsService.uploadFile(
      'final-docs',
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    doc.finalDocKey = result.fileKey;
    doc.finalDocName = result.fileName;
    doc.finalDocUrl = result.fileUrl;
    await this.docRepo.save(doc);

    return {
      finalDocUrl: result.fileUrl,
      finalDocName: result.fileName,
    };
  }

  async getFinalDownload(
    lineId: string,
  ): Promise<{ finalDocUrl: string; finalDocName: string | null }> {
    const doc = await this.docRepo.findOne({ where: { lineId } });
    if (!doc?.finalDocKey) {
      throw new NotFoundException('Chưa có file TLKT final');
    }

    return {
      finalDocUrl: await this.uploadsService.getPresignedUrl(doc.finalDocKey),
      finalDocName: doc.finalDocName,
    };
  }

  private async withFreshFinalDocUrl(
    doc: ProductionDoc | null,
  ): Promise<ProductionDoc | null> {
    if (doc?.finalDocKey) {
      try {
        doc.finalDocUrl = await this.uploadsService.getPresignedUrl(
          doc.finalDocKey,
        );
      } catch {
        doc.finalDocUrl = null;
      }
    }
    return doc;
  }

  async upsert(
    lineId: string,
    dto: SaveProductionDocDto,
  ): Promise<ProductionDoc | null> {
    await this.assertLineNotLocked(lineId);

    let doc = await this.docRepo.findOne({ where: { lineId } });

    if (!doc) {
      doc = this.docRepo.create({ lineId });
    }

    doc.section1MoTa = dto.section1MoTa ?? doc.section1MoTa;
    doc.section1ImageUrl = dto.section1ImageUrl ?? doc.section1ImageUrl;
    doc.section2PhuLieu = dto.section2PhuLieu ?? doc.section2PhuLieu;
    doc.section3LuuYTraiCat =
      dto.section3LuuYTraiCat ?? doc.section3LuuYTraiCat;
    doc.section4CommentKhachHang =
      dto.section4CommentKhachHang ?? doc.section4CommentKhachHang;

    await this.docRepo.save(doc);

    if (dto.sizeRows !== undefined) {
      await this.sizeRowRepo.delete({ docId: doc.id });
      if (dto.sizeRows.length > 0) {
        const rows = dto.sizeRows.map((r, i) => {
          const { id, ...rest } = r;
          return this.sizeRowRepo.create({
            ...rest,
            rowName: r.rowName ?? '',
            docId: doc.id,
            orderIndex: r.orderIndex ?? i,
          });
        });
        await this.sizeRowRepo.save(rows);
      }
    }

    if (dto.sections !== undefined) {
      await this.sectionRepo.delete({ docId: doc.id });
      if (dto.sections.length > 0) {
        const sections = dto.sections.map((s, i) => {
          const { id, imageGroups, imageUrls, ...rest } = s;
          const normalizedImageGroups = this.normalizeImageGroups(
            imageGroups,
            imageUrls,
          );
          return this.sectionRepo.create({
            ...rest,
            imageUrls:
              imageUrls ??
              normalizedImageGroups.flatMap((group) => group.imageUrls),
            imageGroups: normalizedImageGroups,
            docId: doc.id,
            orderIndex: s.orderIndex ?? i,
          });
        });
        await this.sectionRepo.save(sections);
      }
    }

    return this.findByLineId(lineId);
  }

  /**
   * Clone production doc data from the parent Style into this PoLine's doc.
   * Safe to call for existing lines that were created before the auto-clone fix.
   */
  async syncFromStyle(lineId: string): Promise<ProductionDoc | null> {
    const line = await this.assertLineNotLocked(lineId);
    if (!line?.styleId) return null;

    const styleDoc = await this.styleDocRepo.findOne({
      where: { styleId: line.styleId },
    });
    if (!styleDoc) return null;

    // Upsert the base doc
    let doc = await this.docRepo.findOne({ where: { lineId } });
    if (!doc) doc = this.docRepo.create({ lineId });

    doc.section1ImageUrl = styleDoc.section1ImageUrl ?? doc.section1ImageUrl;
    doc.section1MoTa = styleDoc.section1Description ?? doc.section1MoTa;
    doc.section2PhuLieu = styleDoc.section2Accessories ?? doc.section2PhuLieu;
    doc.section3LuuYTraiCat = styleDoc.section3Notes ?? doc.section3LuuYTraiCat;
    doc.section4CommentKhachHang =
      styleDoc.section4CustomerFeedback ?? doc.section4CommentKhachHang;
    await this.docRepo.save(doc);

    // Sync sizeRows from sizeData
    await this.sizeRowRepo.delete({ docId: doc.id });
    if (
      styleDoc.sizeData &&
      Array.isArray(styleDoc.sizeData) &&
      styleDoc.sizeData.length > 0
    ) {
      const rows = styleDoc.sizeData.map((r, i) =>
        this.sizeRowRepo.create({
          docId: doc.id,
          rowName: r.rowName ?? '',
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

    // Sync sections
    await this.sectionRepo.delete({ docId: doc.id });
    if (
      styleDoc.sections &&
      Array.isArray(styleDoc.sections) &&
      styleDoc.sections.length > 0
    ) {
      const sections = (styleDoc.sections as any[]).map((s, i) =>
        this.sectionRepo.create({
          docId: doc.id,
          title: s.title,
          content: s.content,
          imageUrls: s.imageUrls,
          imageGroups: this.normalizeImageGroups(s.imageGroups, s.imageUrls),
          orderIndex: s.orderIndex ?? i,
        }),
      );
      await this.sectionRepo.save(sections);
    }

    return this.findByLineId(lineId);
  }

  /**
   * Resync Section 1 (image) and Section 2 (material codes)
   * directly from PO Line's own data (structureImage + BOM by lineId).
   */
  async resyncSection12FromBom(lineId: string): Promise<ProductionDoc | null> {
    const line = await this.assertLineNotLocked(lineId);

    // Get BOM material codes for this specific PO Line
    const boms = await this.bomRepo
      .createQueryBuilder('bom')
      .leftJoinAndSelect('bom.bomLines', 'bl')
      .leftJoinAndSelect('bl.masterMaterial', 'mat')
      .where('bom.lineId = :lineId', { lineId })
      .andWhere('bom.status IN (:...statuses)', { statuses: ['Approved', 'Locked'] })
      .getMany();

    const codes = new Set<string>();
    for (const bom of boms) {
      for (const bomLine of bom.bomLines ?? []) {
        const name = bomLine.materialName;
        if (name) codes.add(name);
      }
    }
    const materialNames = [...codes].sort();

    // Get structure image: PO Line's own structureImage or fallback to Style baseImage
    let imageUrl: string | null = (line as any).structureImage || null;
    if (!imageUrl && line.styleId) {
      const style = await this.styleRepo.findOne({ where: { id: line.styleId } });
      imageUrl = style?.baseImage || null;
    }

    // Upsert the PO Line production doc
    let doc = await this.docRepo.findOne({ where: { lineId } });
    if (!doc) doc = this.docRepo.create({ lineId });

    // Section 1: image from PO Line or Style
    if (imageUrl) {
      doc.section1ImageUrl = imageUrl;
    }

    // Section 2: from BOM material names of this PO Line
    if (materialNames.length > 0) {
      doc.section2PhuLieu = materialNames.join('\n');
    }

    await this.docRepo.save(doc);
    return this.findByLineId(lineId);
  }

  private normalizeImageGroups(
    imageGroups:
      | {
          heading?: string | null;
          headingColor?: 'red' | 'black';
          imageUrls?: string[];
          orderIndex?: number;
        }[]
      | undefined
      | null,
    fallbackImageUrls?: string[] | null,
  ): {
    heading: string | null;
    headingColor: 'red' | 'black';
    imageUrls: string[];
    orderIndex: number;
  }[] {
    const groups =
      imageGroups && imageGroups.length > 0
        ? imageGroups
        : fallbackImageUrls?.length
          ? Array.from(
              { length: Math.ceil(fallbackImageUrls.length / 2) },
              (_unused, index) => ({
                heading: null,
                headingColor: 'red' as const,
                imageUrls: fallbackImageUrls.slice(index * 2, index * 2 + 2),
                orderIndex: index,
              }),
            )
          : [];

    return groups
      .map((group, index) => ({
        heading: group.heading?.trim() || null,
        headingColor: group.headingColor === 'black' ? ('black' as const) : ('red' as const),
        imageUrls: (group.imageUrls ?? []).filter(Boolean).slice(0, 2),
        orderIndex: group.orderIndex ?? index,
      }))
      .filter((group) => group.heading || group.imageUrls.length > 0);
  }

  async exportExcel(lineId: string): Promise<Buffer> {
    const [doc, poLine] = await Promise.all([
      this.findByLineId(lineId),
      this.lineRepo.findOne({ where: { id: lineId } }),
    ]);
    if (!doc)
      throw new NotFoundException('Chưa có tài liệu sản xuất cho sản phẩm này');

    const po = poLine
      ? await this.poRepo.findOne({ where: { id: poLine.poId } })
      : null;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Tài liệu SX');

    ws.columns = [
      { width: 5 }, // A
      { width: 36 }, // B
      { width: 12 }, // C - S
      { width: 12 }, // D - M
      { width: 12 }, // E - L
      { width: 12 }, // F - XL
      { width: 12 }, // G - Pattern
      { width: 25 }, // H - TOL+/- / right padding for long TLKT text
    ];

    // ── Shared styles ──────────────────────────────────────────────────────────
    const THIN: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    };
    const MEDIUM: Partial<ExcelJS.Borders> = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'medium' },
      right: { style: 'medium' },
    };
    const DARK_BG: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F2937' },
    };
    const YELLOW_FILL: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' },
    };
    const META_FONT: Partial<ExcelJS.Font> = {
      name: 'Times New Roman',
      bold: true,
      size: 14,
    };
    const SECTION_TITLE_FONT: Partial<ExcelJS.Font> = {
      name: 'Times New Roman',
      bold: true,
      underline: true,
      color: { argb: 'FFFF0000' },
      size: 14,
    };
    const BODY_FONT: Partial<ExcelJS.Font> = {
      name: 'Times New Roman',
      size: 12,
      bold: false,
    };
    const TABLE_FONT: Partial<ExcelJS.Font> = {
      name: 'Times New Roman',
      size: 11,
      bold: false,
    };
    const EXPORT_DATE_FONT: Partial<ExcelJS.Font> = {
      name: 'Times New Roman',
      bold: true,
      italic: true,
      underline: true,
      color: { argb: 'FFFF0000' },
      size: 14,
    };

    // ExcelJS merge cells share style by reference. Replacing `cell.style` after
    // merge breaks that reference, so set individual style properties instead.
    const applyStyle = (cell: ExcelJS.Cell, style: Partial<ExcelJS.Style>) => {
      if (style.fill) cell.fill = style.fill;
      if (style.font) cell.font = style.font;
      if (style.alignment) cell.alignment = style.alignment;
      if (style.border) cell.border = style.border;
    };
    const mergeCellsWithoutStyle = (
      top: number,
      left: number,
      bottom: number,
      right: number,
    ) => {
      const worksheet = ws as ExcelJS.Worksheet & {
        mergeCellsWithoutStyle?: (
          top: number,
          left: number,
          bottom: number,
          right: number,
        ) => void;
      };

      if (worksheet.mergeCellsWithoutStyle) {
        worksheet.mergeCellsWithoutStyle(top, left, bottom, right);
      } else {
        ws.mergeCells(top, left, bottom, right);
      }
    };
    const setRangeBorder = (
      top: number,
      left: number,
      bottom: number,
      right: number,
      sides: {
        top?: boolean;
        right?: boolean;
        bottom?: boolean;
        left?: boolean;
      },
      style: ExcelJS.BorderStyle = 'medium',
    ) => {
      const border = { style };
      if (sides.top) {
        for (let c = left; c <= right; c++) {
          const cell = ws.getCell(top, c);
          cell.border = { ...cell.border, top: border };
        }
      }
      if (sides.right) {
        for (let r = top; r <= bottom; r++) {
          const cell = ws.getCell(r, right);
          cell.border = { ...cell.border, right: border };
        }
      }
      if (sides.bottom) {
        for (let c = left; c <= right; c++) {
          const cell = ws.getCell(bottom, c);
          cell.border = { ...cell.border, bottom: border };
        }
      }
      if (sides.left) {
        for (let r = top; r <= bottom; r++) {
          const cell = ws.getCell(r, left);
          cell.border = { ...cell.border, left: border };
        }
      }
    };
    const clearRangeBottomBorder = (
      rowIndex: number,
      left: number,
      right: number,
    ) => {
      for (let c = left; c <= right; c++) {
        const cell = ws.getCell(rowIndex, c);
        const border = { ...cell.border };
        delete border.bottom;
        cell.border = border;
      }
    };
    const mergedColumnWidth = (startCol: number, endCol: number) => {
      let width = 0;
      for (let c = startCol; c <= endCol; c++) {
        width += ws.getColumn(c).width ?? 8.43;
      }
      return width;
    };
    const splitTextForOverflowRows = (
      text: string | null | undefined,
      startCol: number,
      endCol: number,
    ) => {
      const width = mergedColumnWidth(startCol, endCol);
      const charsPerLine = Math.max(24, Math.floor(width * 1.25));
      const sourceLines = (text || '').split(/\r?\n/);
      const rows: string[] = [];

      for (const sourceLine of sourceLines) {
        const words = sourceLine.split(/(\s+)/).filter(Boolean);
        let current = '';

        for (const word of words) {
          if (current.length + word.length <= charsPerLine) {
            current += word;
            continue;
          }

          if (current.trim()) rows.push(current.trimEnd());
          current = word.trimStart();

          while (current.length > charsPerLine) {
            rows.push(current.slice(0, charsPerLine));
            current = current.slice(charsPerLine);
          }
        }

        rows.push(current.trimEnd());
      }

      return rows.length ? rows : [''];
    };
    const exportDate = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).format(new Date());

    let row = 1;

    // ── Company header (rows 1-3) ──────────────────────────────────────────────
    // Row 1: company name — set style BEFORE value to preserve rich text fonts
    ws.mergeCells(1, 1, 1, 8);
    const r1 = ws.getRow(1).getCell(1);
    applyStyle(r1, {
      fill: DARK_BG,
      alignment: { horizontal: 'center', vertical: 'middle' },
    });
    r1.value = {
      richText: [
        {
          font: { bold: true, size: 13, color: { argb: 'FFFFFFFF' } },
          text: 'CÔNG TY TNHH DỆT MAY THƯƠNG MẠI ',
        },
        {
          font: { bold: true, size: 15, color: { argb: 'FFFF0000' } },
          text: 'TẤN   MINH',
        },
      ],
    };
    ws.getRow(1).height = 28;

    // Row 2: English name
    ws.mergeCells(2, 1, 2, 8);
    const r2 = ws.getRow(2).getCell(1);
    applyStyle(r2, {
      fill: DARK_BG,
      font: { bold: true, size: 10, color: { argb: 'FFFFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    });
    r2.value = 'TAN MINH TEXTILE SEWING TRADING CO.,LTD';
    ws.getRow(2).height = 18;

    // Row 3: STYLE / PO / Main / Collection — 4 groups of 2 columns
    [
      `STYLE: ${poLine?.styleCode ?? '—'}`,
      `PO: ${po?.poCode ?? '—'}`,
      `Main: ${po?.customer ?? '—'}`,
      `Collection: ${po?.customerPoCode ?? '—'}`,
    ].forEach((val, i) => {
      const c = i * 2 + 1;
      mergeCellsWithoutStyle(3, c, 3, c + 1);
      const cell = ws.getRow(3).getCell(c);
      cell.value = val;
      applyStyle(cell, {
        font: META_FONT,
        alignment: { horizontal: 'center', vertical: 'top', wrapText: true },
      });
      setRangeBorder(3, c, 3, c + 1, {
        top: true,
        right: true,
        bottom: true,
        left: true,
      });
    });
    ws.getRow(3).height = 24;

    row = 4;

    // ── Helpers ────────────────────────────────────────────────────────────────

    // Section title only needs a strong top rule. Content blocks draw their own
    // side/bottom outline so the title row does not look boxed-in.
    const secTitle = (text: string, colEnd = 8) => {
      mergeCellsWithoutStyle(row, 1, row, colEnd);
      const cell = ws.getRow(row).getCell(1);
      cell.value = text;
      applyStyle(cell, {
        font: SECTION_TITLE_FONT,
        alignment: { vertical: 'middle' },
      });
      setRangeBorder(row, 1, row, colEnd, { top: true, right: true });
      ws.getRow(row).height = 20;
      row++;
    };

    // Each \n-delimited line → its own row, THIN on all sides.
    // Adjacent thin+thin borders render as a single thin line in Excel — never doubles.
    const textBlock = (text: string | null | undefined, minRows = 2) => {
      const content = (text ?? '').trim();
      const lines = content ? splitTextForOverflowRows(content, 1, 8) : [];
      const numRows = Math.max(lines.length, minRows);
      for (let i = 0; i < numRows; i++) {
        const cell = ws.getRow(row + i).getCell(1);
        cell.value = lines[i] ?? '';
        applyStyle(cell, {
          font: BODY_FONT,
          alignment: { vertical: 'middle', wrapText: false },
        });
        setRangeBorder(row + i, 1, row + i, 8, {
          right: true,
          left: true,
          bottom: i === numRows - 1,
        });
        ws.getRow(row + i).height = 20;
      }
      row += numRows;
    };

    // ── Section 1 + 2 side-by-side ─────────────────────────────────────────────
    // Image: A:B (1 header group = STYLE). Phụ liệu: C:H (3 header groups = PO/Main/Collection).
    secTitle('1. MÔ TẢ HÌNH DÁNG:', 2);
    row--; // same row, add section 2 title C:H
    mergeCellsWithoutStyle(row, 3, row, 8);
    const s2TitleCell = ws.getRow(row).getCell(3);
    s2TitleCell.value = '2. PHỤ LIỆU:';
    applyStyle(s2TitleCell, {
      font: SECTION_TITLE_FONT,
      alignment: { vertical: 'middle' },
    });
    setRangeBorder(row, 3, row, 8, { top: true, right: true });
    row++;

    // Content area
    const IMG_ROWS = 12;
    const phuLieuText = (doc.section2PhuLieu ?? '').trim();
    const phuLieuLines = phuLieuText
      ? splitTextForOverflowRows(phuLieuText, 3, 8)
      : [];
    const areaRows = Math.max(IMG_ROWS, phuLieuLines.length);
    const areaStart = row;

    // Left: image A:B
    mergeCellsWithoutStyle(areaStart, 1, areaStart + areaRows - 1, 2);
    applyStyle(ws.getRow(areaStart).getCell(1), {
      alignment: { horizontal: 'center', vertical: 'middle' },
    });
    setRangeBorder(
      areaStart,
      1,
      areaStart + areaRows - 1,
      2,
      { top: true, right: true, bottom: true, left: true },
      'thin',
    );

    // Right: phụ liệu C:H — each line its own row, THIN all sides
    for (let i = 0; i < areaRows; i++) {
      const cell = ws.getRow(areaStart + i).getCell(3);
      cell.value = phuLieuLines[i] ?? '';
      applyStyle(cell, {
        font: BODY_FONT,
        alignment: { vertical: 'middle', wrapText: false },
      });
      setRangeBorder(areaStart + i, 3, areaStart + i, 8, {
        right: true,
        left: true,
        bottom: i === areaRows - 1,
      });
      ws.getRow(areaStart + i).height = 20;
    }

    const areaEnd = areaStart + areaRows - 1;

    // Embed sketch image inside A:B block
    if (doc.section1ImageUrl) {
      try {
        const resp = await axios.get<ArrayBuffer>(doc.section1ImageUrl, {
          responseType: 'arraybuffer',
        });
        const buf = Buffer.from(resp.data);
        const ext = (
          doc.section1ImageUrl.split('?')[0].split('.').pop() ?? 'jpeg'
        ).toLowerCase();
        const imgType: 'png' | 'jpeg' = ext === 'png' ? 'png' : 'jpeg';
        const imgId = wb.addImage({ buffer: buf as any, extension: imgType });
        ws.addImage(imgId, {
          tl: { col: 0, row: areaStart - 1 } as any,
          br: { col: 2, row: areaEnd } as any,
        });
      } catch {
        /* skip on fetch error */
      }
    }

    row = areaEnd + 1;

    // ── Section 3 ─────────────────────────────────────────────────────────────
    secTitle('3. LƯU Ý TRẢI CẮT:');
    textBlock(doc.section3LuuYTraiCat);

    // ── Section 4 ─────────────────────────────────────────────────────────────
    secTitle('4. COMMENT GÓP Ý KHÁCH HÀNG:');
    textBlock(doc.section4CommentKhachHang);

    // ── Section 5: Thông số Full Size ─────────────────────────────────────────
    secTitle('5. THÔNG SỐ FULL SIZE:');

    const sizeImages = [...(doc.sizeRows ?? [])]
      .filter((sr) => sr.imageUrl)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    // ExcelJS bug #650: fractional col positioning uses DEFAULT col width (8.43 chars),
    // not actual column widths. Default = 640000 EMU = 67.2px at 96 DPI.
    // Row height: 1 row Excel ~= 15pt = 20px at 96 DPI
    const DEFAULT_ROW_PX = 20;
    const IMAGE_TOP_PADDING_PX = 8;
    const DYNAMIC_IMAGE_TARGET_HEIGHT_PX = 150;
    // Frame width fallback (8 columns with standard widths)
    const COLUMN_WIDTHS = [5, 36, 12, 12, 12, 12, 12, 25];
    // Keep image layout on the original TLKT visual grid. Column H is wider only
    // for long text, but should not pull right-side image groups off balance.
    const IMAGE_LAYOUT_COLUMN_WIDTHS = [5, 36, 12, 12, 12, 12, 12, 10];
    const FRAME_W_PX = IMAGE_LAYOUT_COLUMN_WIDTHS.reduce(
      (s, w) => s + w * 7,
      0,
    );
    const getSlotWidthPx = (
      startColZeroBased: number,
      endColZeroBased: number,
    ) =>
      IMAGE_LAYOUT_COLUMN_WIDTHS.slice(
        startColZeroBased,
        endColZeroBased,
      ).reduce((sum, width) => sum + width * 7, 0);
    const allocateGroupBounds = (
      groups: { imageUrls: string[] }[],
    ): { start: number; end: number }[] => {
      if (groups.length === 1) return [{ start: 0, end: 8 }];

      const leftCount = groups[0].imageUrls.filter(Boolean).slice(0, 2).length;
      const rightCount = groups[1].imageUrls.filter(Boolean).slice(0, 2).length;
      const splitCol =
        leftCount === rightCount ? 4 : leftCount > rightCount ? 6 : 2;

      return [
        { start: 0, end: splitCol },
        { start: splitCol, end: 8 },
      ];
    };
    const splitGroupIntoImageSlots = (
      start: number,
      end: number,
      imageCount: number,
    ): { start: number; end: number }[] => {
      if (imageCount <= 1) return [{ start, end }];

      const mid = start + Math.floor((end - start) / 2);
      return [
        { start, end: mid },
        { start: mid, end },
      ];
    };

    if (sizeImages.length > 0) {
      for (const sr of sizeImages) {
        try {
          const resp = await axios.get<ArrayBuffer>(sr.imageUrl!, {
            responseType: 'arraybuffer',
          });
          const buf = Buffer.from(resp.data);
          const dims = imageSize(buf);
          const origW = dims.width ?? FRAME_W_PX;
          const origH = dims.height ?? 280;
          // Scale down to fit frame width; never upscale
          // Cap at 80% of frame width so image always fits with padding on all sides
          const scale = Math.min(1, (FRAME_W_PX * 0.8) / origW);
          const scaledW = Math.round(origW * scale);
          const scaledH = Math.round(origH * scale);
          // Calculate rows needed to fit image height
          const rowsNeeded = Math.ceil(scaledH / DEFAULT_ROW_PX);
          const rowHeight = scaledH / rowsNeeded; // pt per row

          const fileExt = (
            sr.imageUrl!.split('?')[0].split('.').pop() ?? 'jpeg'
          ).toLowerCase();
          const imgType: 'png' | 'jpeg' = fileExt === 'png' ? 'png' : 'jpeg';
          const imgId = wb.addImage({ buffer: buf as any, extension: imgType });

          console.log('[IMG-DEBUG]', {
            rowStart: row,
            rowEnd: row + rowsNeeded - 1,
            rowsNeeded,
            scaledH,
            rowHeight: rowHeight.toFixed(2),
          });

          for (let k = 0; k < rowsNeeded; k++)
            ws.getRow(row + k).height = rowHeight;
          setRangeBorder(
            row,
            1,
            row + rowsNeeded - 1,
            8,
            { top: true, right: true, bottom: true, left: true },
            'medium',
          );
          ws.addImage(imgId, {
            tl: { col: 0, row: row - 1 } as any,
            ext: { width: scaledW, height: scaledH },
          } as any);
          row += rowsNeeded;
        } catch {
          /* skip on fetch error */
        }
      }
    } else {
      textBlock('', 2);
    }

    // ── Dynamic sections (6+) ─────────────────────────────────────────────────
    const dynamicSections = [...(doc.sections ?? [])].sort(
      (a, b) => a.orderIndex - b.orderIndex,
    );
    for (let i = 0; i < dynamicSections.length; i++) {
      const sec = dynamicSections[i];
      secTitle(`${i + 6}. ${(sec.title ?? '').toUpperCase()}:`);
      textBlock(sec.content);

      // Images for this section
      const imageGroups = this.normalizeImageGroups(
        sec.imageGroups,
        sec.imageUrls,
      ).sort((a, b) => a.orderIndex - b.orderIndex);
      if (imageGroups.length > 0) {
        clearRangeBottomBorder(row - 1, 1, 8);
      }

      for (
        let groupStart = 0;
        groupStart < imageGroups.length;
        groupStart += 2
      ) {
        const groupPair = imageGroups.slice(groupStart, groupStart + 2);
        const groupBounds = allocateGroupBounds(groupPair);
        const hasHeading = groupPair.some((group) => group.heading);

        if (hasHeading) {
          groupPair.forEach((group, groupIndex) => {
            const headingSlot = groupBounds[groupIndex];
            mergeCellsWithoutStyle(
              row,
              headingSlot.start + 1,
              row,
              headingSlot.end,
            );
            const headingCell = ws.getRow(row).getCell(headingSlot.start + 1);
            headingCell.value = group.heading
              ? group.heading.toUpperCase()
              : '';
            applyStyle(headingCell, {
              font: {
                ...TABLE_FONT,
                bold: true,
                underline: true,
                color: {
                  argb: group.headingColor === 'red' ? 'FFFF0000' : 'FF000000',
                },
              },
              alignment: { horizontal: 'center', vertical: 'middle' },
            });
          });
          setRangeBorder(row, 1, row, 8, { left: true, right: true }, 'medium');
          ws.getRow(row).height = 20;
          row++;
        }

        const scaledImages: {
          buffer: Buffer;
          extension: 'png' | 'jpeg';
          tlCol: number;
          scaledW: number;
          scaledH: number;
        }[] = [];

        for (let groupIndex = 0; groupIndex < groupPair.length; groupIndex++) {
          const group = groupPair[groupIndex];
          const validImageUrls = group.imageUrls.filter(Boolean).slice(0, 2);
          const imageSlots = splitGroupIntoImageSlots(
            groupBounds[groupIndex].start,
            groupBounds[groupIndex].end,
            validImageUrls.length,
          );

          for (
            let imageIndex = 0;
            imageIndex < validImageUrls.length;
            imageIndex++
          ) {
            const imgUrl = validImageUrls[imageIndex];
            try {
              const resp = await axios.get<ArrayBuffer>(imgUrl, {
                responseType: 'arraybuffer',
              });
              const buf = Buffer.from(resp.data);
              const ext = (
                imgUrl.split('?')[0].split('.').pop() ?? 'jpeg'
              ).toLowerCase();
              const dims2 = imageSize(buf);
              const origW = dims2.width ?? FRAME_W_PX;
              const origH = dims2.height ?? 280;
              const slot = imageSlots[imageIndex];
              const maxWidth = Math.max(
                1,
                getSlotWidthPx(slot.start, slot.end) - 8,
              );
              const scale = Math.min(
                1,
                maxWidth / origW,
                DYNAMIC_IMAGE_TARGET_HEIGHT_PX / origH,
              );

              scaledImages.push({
                buffer: buf,
                extension: ext === 'png' ? 'png' : 'jpeg',
                tlCol:
                  slot.start +
                  Math.max(0, (maxWidth - Math.round(origW * scale)) / 2) /
                    67.2,
                scaledW: Math.round(origW * scale),
                scaledH: Math.round(origH * scale),
              });
            } catch {
              /* skip */
            }
          }
        }

        if (scaledImages.length === 0) continue;

        const rowMaxHeight =
          Math.max(...scaledImages.map((image) => image.scaledH)) +
          IMAGE_TOP_PADDING_PX;
        const rowsNeeded = Math.max(
          1,
          Math.ceil(rowMaxHeight / DEFAULT_ROW_PX),
        );
        const rowHeight = rowMaxHeight / rowsNeeded;

        for (let k = 0; k < rowsNeeded; k++) {
          ws.getRow(row + k).height = rowHeight;
        }
        setRangeBorder(
          row,
          1,
          row + rowsNeeded - 1,
          8,
          { right: true, bottom: true, left: true },
          'medium',
        );

        for (const image of scaledImages) {
          const imgId = wb.addImage({
            buffer: image.buffer as any,
            extension: image.extension,
          });
          ws.addImage(imgId, {
            tl: {
              col: image.tlCol,
              row: row - 1 + IMAGE_TOP_PADDING_PX / DEFAULT_ROW_PX,
            } as any,
            ext: { width: image.scaledW, height: image.scaledH },
          } as any);
        }

        row += rowsNeeded;
      }
    }

    mergeCellsWithoutStyle(row, 1, row, 8);
    const exportedAtCell = ws.getRow(row).getCell(1);
    exportedAtCell.value = `TM ${exportDate}`;
    applyStyle(exportedAtCell, {
      font: EXPORT_DATE_FONT,
      alignment: { horizontal: 'center', vertical: 'middle' },
    });
    setRangeBorder(row, 1, row, 8, {
      top: true,
      right: true,
      bottom: true,
      left: true,
    });
    ws.getRow(row).height = 20;

    const result = await wb.xlsx.writeBuffer();
    return Buffer.from(result);
  }
}
