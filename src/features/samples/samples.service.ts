import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sample, SampleStatus, SampleType } from './entities/sample.entity';
import { CreateSampleDto, UpdateSampleDto } from './dto/create-sample.dto.js';

@Injectable()
export class SamplesService {
  constructor(
    @InjectRepository(Sample)
    private readonly sampleRepo: Repository<Sample>,
  ) {}

  async findAll(filters?: {
    sampleType?: SampleType;
    status?: SampleStatus;
    styleId?: string;
    search?: string;
  }): Promise<Sample[]> {
    const query = this.sampleRepo.createQueryBuilder('sample');

    if (filters?.sampleType) {
      query.andWhere('sample.sampleType = :sampleType', {
        sampleType: filters.sampleType,
      });
    }

    if (filters?.status) {
      query.andWhere('sample.status = :status', { status: filters.status });
    }

    if (filters?.styleId) {
      query.andWhere('sample.styleId = :styleId', { styleId: filters.styleId });
    }

    if (filters?.search) {
      query.andWhere(
        '(sample.sampleCode ILIKE :search OR sample.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    return query
      .leftJoinAndSelect('sample.style', 'style')
      .leftJoinAndSelect('sample.color', 'color')
      .orderBy('sample.createdAt', 'DESC')
      .getMany();
  }

  async findByStyleId(styleId: string): Promise<Sample | null> {
    return this.sampleRepo.findOne({ where: { styleId } });
  }

  async findOne(id: string): Promise<Sample> {
    const sample = await this.sampleRepo.findOne({
      where: { id },
      relations: ['style', 'color'],
    });
    if (!sample) throw new NotFoundException(`Sample #${id} not found`);
    return sample;
  }

  async findByCode(sampleCode: string): Promise<Sample | null> {
    return this.sampleRepo.findOne({
      where: { sampleCode },
      relations: ['style', 'color'],
    });
  }

  async create(dto: CreateSampleDto, actor?: string): Promise<Sample> {
    const existing = await this.sampleRepo.findOne({
      where: { sampleCode: dto.sampleCode },
    });
    if (existing) {
      throw new ConflictException(
        `Sample code "${dto.sampleCode}" already exists`,
      );
    }

    const sample = new Sample();
    sample.sampleCode = dto.sampleCode;
    sample.sampleType = dto.sampleType || SampleType.TECHPACK;
    sample.styleId = dto.styleId || null;
    sample.colorId = dto.colorId || null;
    sample.description = dto.description || null;
    sample.files = dto.files || null;
    sample.images = dto.images || null;
    sample.status = SampleStatus.DRAFT;
    sample.createdBy = actor ?? 'system';
    return this.sampleRepo.save(sample);
  }

  async update(id: string, dto: UpdateSampleDto): Promise<Sample> {
    const sample = await this.findOne(id);
    Object.assign(sample, dto);
    return this.sampleRepo.save(sample);
  }

  async analyze(id: string, analysisResult: string): Promise<Sample> {
    const sample = await this.findOne(id);
    sample.status = SampleStatus.IN_ANALYSIS;
    sample.analysisResult = analysisResult;
    return this.sampleRepo.save(sample);
  }

  async markAnalyzed(id: string): Promise<Sample> {
    const sample = await this.findOne(id);
    sample.status = SampleStatus.ANALYZED;
    return this.sampleRepo.save(sample);
  }

  async approve(id: string): Promise<Sample> {
    const sample = await this.findOne(id);
    if (sample.status !== SampleStatus.ANALYZED) {
      throw new ConflictException('Sample must be analyzed before approval');
    }
    sample.status = SampleStatus.APPROVED;
    return this.sampleRepo.save(sample);
  }

  async addFiles(
    id: string,
    files: { name: string; url: string; size: number }[],
  ): Promise<Sample> {
    const sample = await this.findOne(id);
    sample.files = [...(sample.files || []), ...files];
    return this.sampleRepo.save(sample);
  }

  async addImages(id: string, images: string[]): Promise<Sample> {
    const sample = await this.findOne(id);
    sample.images = [...(sample.images || []), ...images];
    return this.sampleRepo.save(sample);
  }

  async remove(id: string): Promise<void> {
    const sample = await this.findOne(id);
    await this.sampleRepo.remove(sample);
  }

  async linkToStyle(id: string, styleId: string): Promise<Sample> {
    const sample = await this.findOne(id);
    sample.styleId = styleId;
    return this.sampleRepo.save(sample);
  }

  async linkToColor(id: string, colorId: string): Promise<Sample> {
    const sample = await this.findOne(id);
    sample.colorId = colorId;
    return this.sampleRepo.save(sample);
  }
}
