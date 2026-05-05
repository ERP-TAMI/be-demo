import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Color, ColorStatus } from './entities/color.entity';
import { CreateColorDto } from './dto/create-color.dto.js';
import { UpdateColorDto } from './dto/update-color.dto.js';

@Injectable()
export class ColorsService {
  constructor(
    @InjectRepository(Color)
    private readonly colorRepo: Repository<Color>,
  ) {}

  async findAll(filters?: {
    styleId?: string;
    status?: ColorStatus;
  }): Promise<Color[]> {
    const query = this.colorRepo.createQueryBuilder('color');

    if (filters?.styleId) {
      query.andWhere('color.styleId = :styleId', { styleId: filters.styleId });
    }

    if (filters?.status) {
      query.andWhere('color.status = :status', { status: filters.status });
    }

    return query.orderBy('color.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Color> {
    const color = await this.colorRepo.findOne({
      where: { id },
      relations: ['style'],
    });
    if (!color) throw new NotFoundException(`Color #${id} not found`);
    return color;
  }

  async create(
    styleId: string,
    dto: CreateColorDto,
    actor?: string,
  ): Promise<Color> {
    const color = this.colorRepo.create({
      ...dto,
      styleId,
      status: ColorStatus.DRAFT,
      createdBy: actor ?? 'system',
    });
    return this.colorRepo.save(color);
  }

  async update(id: string, dto: UpdateColorDto): Promise<Color> {
    const color = await this.findOne(id);
    Object.assign(color, dto);
    return this.colorRepo.save(color);
  }

  async activate(id: string): Promise<Color> {
    const color = await this.findOne(id);
    color.status = ColorStatus.ACTIVE;
    return this.colorRepo.save(color);
  }

  async deactivate(id: string): Promise<Color> {
    const color = await this.findOne(id);
    color.status = ColorStatus.INACTIVE;
    return this.colorRepo.save(color);
  }

  async remove(id: string): Promise<void> {
    const color = await this.findOne(id);
    await this.colorRepo.remove(color);
  }

  async clone(
    colorId: string,
    newColorName: string,
    targetStyleId?: string,
  ): Promise<Color> {
    const original = await this.findOne(colorId);

    const cloned = this.colorRepo.create({
      colorName: newColorName,
      colorImage: original.colorImage,
      styleId: targetStyleId ?? original.styleId,
      status: ColorStatus.DRAFT,
    });
    return this.colorRepo.save(cloned);
  }

  async linkToSample(colorId: string, sampleId: string): Promise<Color> {
    const color = await this.findOne(colorId);
    color.linkedSampleId = sampleId;
    return this.colorRepo.save(color);
  }
}
