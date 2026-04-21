import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ExcelJS from 'exceljs';
import axios from 'axios';
import { ProductionDoc } from './entities/production-doc.entity.js';
import { ProductionDocSizeRow } from './entities/production-doc-size-row.entity.js';
import { ProductionDocSection } from './entities/production-doc-section.entity.js';
import { SaveProductionDocDto } from './dto/save-production-doc.dto.js';
import { PoLine } from '../po-lines/entities/po-line.entity.js';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity.js';

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
  ) {}

  async findByLineId(lineId: string): Promise<ProductionDoc | null> {
    return this.docRepo.findOne({
      where: { lineId },
      relations: ['sizeRows', 'sections'],
      order: {
        sizeRows: { orderIndex: 'ASC' },
        sections: { orderIndex: 'ASC' },
      },
    });
  }

  async upsert(
    lineId: string,
    dto: SaveProductionDocDto,
  ): Promise<ProductionDoc | null> {
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
        const rows = dto.sizeRows.map((r, i) =>
          this.sizeRowRepo.create({
            ...r,
            docId: doc.id,
            orderIndex: r.orderIndex ?? i,
          }),
        );
        await this.sizeRowRepo.save(rows);
      }
    }

    if (dto.sections !== undefined) {
      await this.sectionRepo.delete({ docId: doc.id });
      if (dto.sections.length > 0) {
        const sections = dto.sections.map((s, i) =>
          this.sectionRepo.create({
            ...s,
            docId: doc.id,
            orderIndex: s.orderIndex ?? i,
          }),
        );
        await this.sectionRepo.save(sections);
      }
    }

    return this.findByLineId(lineId);
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
      { width: 10 }, // H - TOL+/-
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

    // Table header row
    const hdrRow = ws.getRow(row++);
    hdrRow.height = 18;
    ['', 'Tên chỉ số', 'S', 'M', 'L', 'XL', 'Pattern', 'TOL+/-'].forEach(
      (v, i) => {
        const cell = hdrRow.getCell(i + 1);
        cell.value = v;
        applyStyle(cell, {
          font: { ...TABLE_FONT, bold: true },
          alignment: {
            horizontal: i >= 2 ? 'center' : 'left',
            vertical: 'middle',
          },
          border: MEDIUM,
        });
        if (i === 3) cell.fill = YELLOW_FILL;
      },
    );

    // Data rows
    const sizeRows = [...(doc.sizeRows ?? [])].sort(
      (a, b) => a.orderIndex - b.orderIndex,
    );
    for (let rowIndex = 0; rowIndex < sizeRows.length; rowIndex++) {
      const sr = sizeRows[rowIndex];
      const dr = ws.getRow(row++);
      dr.height = 16;
      [
        sr.orderIndex + 1,
        sr.rowName,
        sr.sValue ?? '',
        sr.mValue ?? '',
        sr.lValue ?? '',
        sr.xlValue ?? '',
        sr.patternValue ?? '',
        sr.tolPlusMinus ?? '',
      ].forEach((v, i) => {
        const cell = dr.getCell(i + 1);
        cell.value = v as ExcelJS.CellValue;
        applyStyle(cell, {
          font: TABLE_FONT,
          alignment: {
            horizontal: i >= 2 ? 'center' : 'left',
            vertical: 'middle',
            wrapText: true,
          },
          border: {
            ...THIN,
            ...(i === 0 ? { left: { style: 'medium' as const } } : {}),
            ...(i === 7 ? { right: { style: 'medium' as const } } : {}),
            ...(rowIndex === sizeRows.length - 1
              ? { bottom: { style: 'medium' as const } }
              : {}),
          },
        });
        if (i === 3) cell.fill = YELLOW_FILL;
      });
      dr.height = 16;
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
      if (sec.imageUrls?.length) {
        for (const imgUrl of sec.imageUrls) {
          if (!imgUrl) continue;
          try {
            const resp = await axios.get<ArrayBuffer>(imgUrl, {
              responseType: 'arraybuffer',
            });
            const buf = Buffer.from(resp.data);
            const ext = (
              imgUrl.split('?')[0].split('.').pop() ?? 'jpeg'
            ).toLowerCase();
            const imgType: 'png' | 'jpeg' = ext === 'png' ? 'png' : 'jpeg';
            const imgId = wb.addImage({
              buffer: buf as any,
              extension: imgType,
            });
            const IMG_H = 12;
            mergeCellsWithoutStyle(row, 1, row + IMG_H - 1, 8);
            applyStyle(ws.getRow(row).getCell(1), {
              alignment: { horizontal: 'center', vertical: 'middle' },
            });
            setRangeBorder(
              row,
              1,
              row + IMG_H - 1,
              8,
              { top: true, right: true, bottom: true, left: true },
              'thin',
            );
            for (let k = 0; k < IMG_H; k++) ws.getRow(row + k).height = 14;
            ws.addImage(imgId, {
              tl: { col: 0, row: row - 1 } as any,
              br: { col: 8, row: row + IMG_H - 1 } as any,
            });
            row += IMG_H;
          } catch {
            /* skip */
          }
        }
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
