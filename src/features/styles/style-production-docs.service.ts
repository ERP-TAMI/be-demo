import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StyleProductionDoc, ProductionDocStatus } from './entities/style-production-doc.entity.js';

@Injectable()
export class StyleProductionDocsService {
  constructor(
    @InjectRepository(StyleProductionDoc)
    private readonly docRepo: Repository<StyleProductionDoc>,
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
}
