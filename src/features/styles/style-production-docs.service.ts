import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ExcelJS from 'exceljs';
import axios from 'axios';
import { StyleProductionDoc, ProductionDocStatus } from './entities/style-production-doc.entity';
import { Style } from './entities/style.entity';

@Injectable()
export class StyleProductionDocsService {
  constructor(
    @InjectRepository(StyleProductionDoc)
    private readonly docRepo: Repository<StyleProductionDoc>,
    @InjectRepository(Style)
    private readonly styleRepo: Repository<Style>,
  ) {}

  async findByStyleId(styleId: string): Promise<StyleProductionDoc[]> {
    return this.docRepo.find({
      where: { styleId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<StyleProductionDoc> {
    const doc = await this.docRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException(`Production Doc #${id} not found`);
    return doc;
  }

  async create(
    styleId: string,
    dto: {
      name: string;
      description?: string;
      createdBy?: string;
    },
  ): Promise<StyleProductionDoc> {
    const doc = this.docRepo.create({
      styleId,
      name: dto.name,
      description: dto.description || '',
      status: ProductionDocStatus.DRAFT,
      createdBy: dto.createdBy || 'system',
    });
    return this.docRepo.save(doc);
  }

  async update(
    id: string,
    dto: Partial<{
      name: string;
      description: string;
      status: ProductionDocStatus;
      section1Description: string;
      section1ImageUrl: string;
      section2Accessories: string;
      section3Notes: string;
      section4CustomerFeedback: string;
      sizeData: any;
      sections: { title: string; content: string; imageUrls: string[]; orderIndex: number }[];
      attachments: { name: string; url: string; size: number }[];
    }>,
  ): Promise<StyleProductionDoc> {
    const doc = await this.findOne(id);
    Object.assign(doc, dto);
    return this.docRepo.save(doc);
  }

  async remove(id: string): Promise<void> {
    const doc = await this.findOne(id);
    await this.docRepo.remove(doc);
  }

  async updateStatus(id: string, status: ProductionDocStatus): Promise<StyleProductionDoc> {
    const doc = await this.findOne(id);
    doc.status = status;
    return this.docRepo.save(doc);
  }

  async exportExcel(styleId: string): Promise<Buffer> {
    const style = await this.styleRepo.findOne({ where: { id: styleId } });
    if (!style) throw new NotFoundException('Style not found');

    const docs = await this.docRepo.find({
      where: { styleId },
      order: { createdAt: 'DESC' },
    });
    const doc = docs[0];
    if (!doc) throw new NotFoundException('Chưa có tài liệu sản xuất cho style này');

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Tài liệu SX');

    ws.columns = [
      { width: 5 },   // A
      { width: 36 },  // B
      { width: 12 },  // C - S
      { width: 12 },  // D - M
      { width: 12 },  // E - L
      { width: 12 },  // F - XL
      { width: 12 },  // G - Pattern
      { width: 10 },  // H - TOL+/-
    ];

    // ── Shared styles ──────────────────────────────────────────────────────────
    const THIN: Partial<ExcelJS.Borders> = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    const MEDIUM: Partial<ExcelJS.Borders> = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } };
    const DARK_BG: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
    const YELLOW_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
    const META_FONT: Partial<ExcelJS.Font> = { name: 'Times New Roman', bold: true, size: 14 };
    const SECTION_TITLE_FONT: Partial<ExcelJS.Font> = { name: 'Times New Roman', bold: true, underline: true, color: { argb: 'FFFF0000' }, size: 14 };
    const BODY_FONT: Partial<ExcelJS.Font> = { name: 'Times New Roman', size: 12 };
    const TABLE_FONT: Partial<ExcelJS.Font> = { name: 'Times New Roman', size: 11 };
    const EXPORT_DATE_FONT: Partial<ExcelJS.Font> = { name: 'Times New Roman', bold: true, italic: true, underline: true, color: { argb: 'FFFF0000' }, size: 14 };

    const applyStyle = (cell: ExcelJS.Cell, style: Partial<ExcelJS.Style>) => {
      if (style.fill) cell.fill = style.fill;
      if (style.font) cell.font = style.font;
      if (style.alignment) cell.alignment = style.alignment;
      if (style.border) cell.border = style.border;
    };

    const mergeCellsWithoutStyle = (top: number, left: number, bottom: number, right: number) => {
      const worksheet = ws as ExcelJS.Worksheet & { mergeCellsWithoutStyle?: (t: number, l: number, b: number, r: number) => void };
      if (worksheet.mergeCellsWithoutStyle) worksheet.mergeCellsWithoutStyle(top, left, bottom, right);
      else ws.mergeCells(top, left, bottom, right);
    };

    const setRangeBorder = (top: number, left: number, bottom: number, right: number, sides: { top?: boolean; right?: boolean; bottom?: boolean; left?: boolean }, style: ExcelJS.BorderStyle = 'medium') => {
      const border = { style };
      if (sides.top) for (let c = left; c <= right; c++) { const cell = ws.getCell(top, c); cell.border = { ...cell.border, top: border }; }
      if (sides.right) for (let r = top; r <= bottom; r++) { const cell = ws.getCell(r, right); cell.border = { ...cell.border, right: border }; }
      if (sides.bottom) for (let c = left; c <= right; c++) { const cell = ws.getCell(bottom, c); cell.border = { ...cell.border, bottom: border }; }
      if (sides.left) for (let r = top; r <= bottom; r++) { const cell = ws.getCell(r, left); cell.border = { ...cell.border, left: border }; }
    };

    const mergedColumnWidth = (startCol: number, endCol: number) => {
      let width = 0;
      for (let c = startCol; c <= endCol; c++) width += ws.getColumn(c).width ?? 8.43;
      return width;
    };

    const splitTextForOverflowRows = (text: string | null | undefined, startCol: number, endCol: number) => {
      const width = mergedColumnWidth(startCol, endCol);
      const charsPerLine = Math.max(24, Math.floor(width * 1.25));
      const sourceLines = (text || '').split(/\r?\n/);
      const rows: string[] = [];
      for (const sourceLine of sourceLines) {
        const words = sourceLine.split(/(\s+)/).filter(Boolean);
        let current = '';
        for (const word of words) {
          if (current.length + word.length <= charsPerLine) { current += word; continue; }
          if (current.trim()) rows.push(current.trimEnd());
          current = word.trimStart();
          while (current.length > charsPerLine) { rows.push(current.slice(0, charsPerLine)); current = current.slice(charsPerLine); }
        }
        rows.push(current.trimEnd());
      }
      return rows.length ? rows : [''];
    };

    const exportDate = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: 'numeric', month: 'numeric', year: 'numeric' }).format(new Date());

    let row = 1;

    // ── Company header ─────────────────────────────────────────────────────────
    ws.mergeCells(1, 1, 1, 8);
    const r1 = ws.getRow(1).getCell(1);
    applyStyle(r1, { fill: DARK_BG, alignment: { horizontal: 'center', vertical: 'middle' } });
    r1.value = { richText: [{ font: { bold: true, size: 13, color: { argb: 'FFFFFFFF' } }, text: 'CÔNG TY TNHH DỆT MAY THƯƠNG MẠI ' }, { font: { bold: true, size: 15, color: { argb: 'FFFF0000' } }, text: 'TẤN   MINH' }] };
    ws.getRow(1).height = 28;

    ws.mergeCells(2, 1, 2, 8);
    const r2 = ws.getRow(2).getCell(1);
    applyStyle(r2, { fill: DARK_BG, font: { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }, alignment: { horizontal: 'center', vertical: 'middle' } });
    r2.value = 'TAN MINH TEXTILE SEWING TRADING CO.,LTD';
    ws.getRow(2).height = 18;

    // ── Style info row ────────────────────────────────────────────────────────
    [
      `STYLE: ${style.styleCode ?? '—'}`,
      `TÊN: ${style.styleName ?? '—'}`,
      `LOẠI: ${style.category ?? '—'}`,
      `TRẠNG THÁI: ${style.status ?? '—'}`,
    ].forEach((val, i) => {
      const c = i * 2 + 1;
      mergeCellsWithoutStyle(3, c, 3, c + 1);
      const cell = ws.getRow(3).getCell(c);
      cell.value = val;
      applyStyle(cell, { font: META_FONT, alignment: { horizontal: 'center', vertical: 'top', wrapText: true } });
      setRangeBorder(3, c, 3, c + 1, { top: true, right: true, bottom: true, left: true });
    });
    ws.getRow(3).height = 24;
    row = 4;

    // ── Helpers ───────────────────────────────────────────────────────────────
    const secTitle = (text: string, colEnd = 8) => {
      mergeCellsWithoutStyle(row, 1, row, colEnd);
      const cell = ws.getRow(row).getCell(1);
      cell.value = text;
      applyStyle(cell, { font: SECTION_TITLE_FONT, alignment: { vertical: 'middle' } });
      setRangeBorder(row, 1, row, colEnd, { top: true, right: true });
      ws.getRow(row).height = 20;
      row++;
    };

    const textBlock = (text: string | null | undefined, minRows = 2) => {
      const content = (text ?? '').trim();
      const lines = content ? splitTextForOverflowRows(content, 1, 8) : [];
      const numRows = Math.max(lines.length, minRows);
      for (let i = 0; i < numRows; i++) {
        const cell = ws.getRow(row + i).getCell(1);
        cell.value = lines[i] ?? '';
        applyStyle(cell, { font: BODY_FONT, alignment: { vertical: 'middle', wrapText: false } });
        setRangeBorder(row + i, 1, row + i, 8, { right: true, left: true, bottom: i === numRows - 1 });
        ws.getRow(row + i).height = 20;
      }
      row += numRows;
    };

    // ── Section 1 + 2 ─────────────────────────────────────────────────────────
    secTitle('1. MÔ TẢ HÌNH DÁNG:', 2);
    row--;
    mergeCellsWithoutStyle(row, 3, row, 8);
    const s2TitleCell = ws.getRow(row).getCell(3);
    s2TitleCell.value = '2. PHỤ LIỆU:';
    applyStyle(s2TitleCell, { font: SECTION_TITLE_FONT, alignment: { vertical: 'middle' } });
    setRangeBorder(row, 3, row, 8, { top: true, right: true });
    row++;

    const IMG_ROWS = 12;
    const phuLieuText = (doc.section2Accessories ?? '').trim();
    const phuLieuLines = phuLieuText ? splitTextForOverflowRows(phuLieuText, 3, 8) : [];
    const areaRows = Math.max(IMG_ROWS, phuLieuLines.length);
    const areaStart = row;

    mergeCellsWithoutStyle(areaStart, 1, areaStart + areaRows - 1, 2);
    applyStyle(ws.getRow(areaStart).getCell(1), { alignment: { horizontal: 'center', vertical: 'middle' } });
    setRangeBorder(areaStart, 1, areaStart + areaRows - 1, 2, { top: true, right: true, bottom: true, left: true }, 'thin');

    for (let i = 0; i < areaRows; i++) {
      const cell = ws.getRow(areaStart + i).getCell(3);
      cell.value = phuLieuLines[i] ?? '';
      applyStyle(cell, { font: BODY_FONT, alignment: { vertical: 'middle', wrapText: false } });
      setRangeBorder(areaStart + i, 3, areaStart + i, 8, { right: true, left: true, bottom: i === areaRows - 1 });
      ws.getRow(areaStart + i).height = 20;
    }
    const areaEnd = areaStart + areaRows - 1;

    if (doc.section1ImageUrl) {
      try {
        const resp = await axios.get<ArrayBuffer>(doc.section1ImageUrl, { responseType: 'arraybuffer' });
        const buf = Buffer.from(resp.data);
        const ext = (doc.section1ImageUrl.split('?')[0].split('.').pop() ?? 'jpeg').toLowerCase();
        const imgType: 'png' | 'jpeg' = ext === 'png' ? 'png' : 'jpeg';
        const imgId = wb.addImage({ buffer: buf as any, extension: imgType });
        ws.addImage(imgId, { tl: { col: 0, row: areaStart - 1 } as any, br: { col: 2, row: areaEnd } as any });
      } catch { /* skip on fetch error */ }
    }
    row = areaEnd + 1;

    // ── Section 3 ─────────────────────────────────────────────────────────────
    secTitle('3. LƯU Ý TRẢI CẮT:');
    textBlock(doc.section3Notes);

    // ── Section 4 ─────────────────────────────────────────────────────────────
    secTitle('4. COMMENT GÓP Ý KHÁCH HÀNG:');
    textBlock(doc.section4CustomerFeedback);

    // ── Section 5: Full Size (Images) ──────────────────────────────────────────
    secTitle('5. THÔNG SỐ FULL SIZE:');

    const sizeImages = [...(doc.sizeData ?? [])]
      .filter(item => item.imageUrl)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

    if (sizeImages.length > 0) {
      for (const sizeItem of sizeImages) {
        if (!sizeItem.imageUrl) continue;
        try {
          const resp = await axios.get<ArrayBuffer>(sizeItem.imageUrl, { responseType: 'arraybuffer' });
          const buf = Buffer.from(resp.data);
          const ext = (sizeItem.imageUrl.split('?')[0].split('.').pop() ?? 'jpeg').toLowerCase();
          const imgType: 'png' | 'jpeg' = ext === 'png' ? 'png' : 'jpeg';
          const imgId = wb.addImage({ buffer: buf as any, extension: imgType });
          const IMG_H = 15;
          mergeCellsWithoutStyle(row, 1, row + IMG_H - 1, 8);
          applyStyle(ws.getRow(row).getCell(1), { alignment: { horizontal: 'center', vertical: 'middle' } });
          setRangeBorder(row, 1, row + IMG_H - 1, 8, { top: true, right: true, bottom: true, left: true }, 'thin');
          for (let k = 0; k < IMG_H; k++) ws.getRow(row + k).height = 14;
          ws.addImage(imgId, { tl: { col: 0, row: row - 1 } as any, br: { col: 8, row: row + IMG_H - 1 } as any });
          row += IMG_H;
        } catch { /* skip */ }
      }
    } else {
      // Empty state
      textBlock('', 2);
    }

    // ── Dynamic sections ──────────────────────────────────────────────────────
    const sections = [...(doc.sections ?? [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      secTitle(`${i + 6}. ${(sec.title ?? '').toUpperCase()}:`);
      textBlock(sec.content);

      if (sec.imageUrls?.length) {
        for (const imgUrl of sec.imageUrls) {
          if (!imgUrl) continue;
          try {
            const resp = await axios.get<ArrayBuffer>(imgUrl, { responseType: 'arraybuffer' });
            const buf = Buffer.from(resp.data);
            const ext = (imgUrl.split('?')[0].split('.').pop() ?? 'jpeg').toLowerCase();
            const imgType: 'png' | 'jpeg' = ext === 'png' ? 'png' : 'jpeg';
            const imgId = wb.addImage({ buffer: buf as any, extension: imgType });
            const IMG_H = 12;
            mergeCellsWithoutStyle(row, 1, row + IMG_H - 1, 8);
            applyStyle(ws.getRow(row).getCell(1), { alignment: { horizontal: 'center', vertical: 'middle' } });
            setRangeBorder(row, 1, row + IMG_H - 1, 8, { top: true, right: true, bottom: true, left: true }, 'thin');
            for (let k = 0; k < IMG_H; k++) ws.getRow(row + k).height = 14;
            ws.addImage(imgId, { tl: { col: 0, row: row - 1 } as any, br: { col: 8, row: row + IMG_H - 1 } as any });
            row += IMG_H;
          } catch { /* skip */ }
        }
      }
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    mergeCellsWithoutStyle(row, 1, row, 8);
    const exportedAtCell = ws.getRow(row).getCell(1);
    exportedAtCell.value = `TM ${exportDate}`;
    applyStyle(exportedAtCell, { font: EXPORT_DATE_FONT, alignment: { horizontal: 'center', vertical: 'middle' } });
    setRangeBorder(row, 1, row, 8, { top: true, right: true, bottom: true, left: true });
    ws.getRow(row).height = 20;

    const result = await wb.xlsx.writeBuffer();
    return Buffer.from(result);
  }
}
