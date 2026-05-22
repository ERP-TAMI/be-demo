import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SizeChart, SizeChartStatus } from './entities/size-chart.entity';
import { CreateSizeChartDto, UpdateSizeChartDto } from './dto/size-chart.dto.js';

@Injectable()
export class SizeChartsService {
  constructor(
    @InjectRepository(SizeChart)
    private readonly sizeChartRepo: Repository<SizeChart>,
  ) {}

  async findAll(): Promise<SizeChart[]> {
    return this.sizeChartRepo.find({ order: { name: 'ASC' } });
  }

  async create(dto: CreateSizeChartDto): Promise<SizeChart> {
    const entity = this.sizeChartRepo.create(dto);
    return this.sizeChartRepo.save(entity);
  }

  async update(id: string, dto: UpdateSizeChartDto): Promise<SizeChart> {
    const entity = await this.sizeChartRepo.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException(`SizeChart with id "${id}" not found`);
    }
    Object.assign(entity, dto);
    return this.sizeChartRepo.save(entity);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.sizeChartRepo.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException(`SizeChart with id "${id}" not found`);
    }
    await this.sizeChartRepo.remove(entity);
  }

  async toggleStatus(id: string): Promise<SizeChart> {
    const entity = await this.sizeChartRepo.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException(`SizeChart with id "${id}" not found`);
    }
    entity.status =
      entity.status === SizeChartStatus.ACTIVE
        ? SizeChartStatus.INACTIVE
        : SizeChartStatus.ACTIVE;
    return this.sizeChartRepo.save(entity);
  }
}
