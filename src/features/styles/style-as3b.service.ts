import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { StyleAs3bStep } from './entities/style-as3b-step.entity';
import { Style } from './entities/style.entity';

@Injectable()
export class StyleAs3bService {
  constructor(
    @InjectRepository(StyleAs3bStep)
    private readonly as3bRepo: Repository<StyleAs3bStep>,
    @InjectRepository(Style)
    private readonly styleRepo: Repository<Style>,
  ) {}

  async findByStyleId(styleId: string): Promise<StyleAs3bStep[]> {
    try {
      return await this.as3bRepo.find({
        where: { styleId },
        order: { orderIndex: 'ASC' },
      });
    } catch (error) {
      if (this.isMissingAs3bTableError(error)) {
        return [];
      }
      throw error;
    }
  }

  async create(
    styleId: string,
    dto: {
      stageId?: string;
      stepName: string;
      description?: string;
      timePerPc: number;
      ssv: number;
      orderIndex?: number;
    },
  ): Promise<StyleAs3bStep> {
    const step = this.as3bRepo.create({
      styleId,
      ...dto,
    });
    return this.as3bRepo.save(step);
  }

  async createMany(
    styleId: string,
    steps: Array<{
      id?: string;
      stageId?: string;
      stepName: string;
      description?: string;
      timePerPc: number;
      ssv: number;
      orderIndex: number;
      parentRowId?: string;
      isGroup?: boolean;
      groupId?: string;
      groupItems?: any;
    }>,
  ): Promise<StyleAs3bStep[]> {
    try {
      // Delete existing steps
      await this.as3bRepo.delete({ styleId });

      // Create new steps
      const newSteps = steps.map((step, index) =>
        this.as3bRepo.create({
          styleId,
          ...step,
          orderIndex: step.orderIndex ?? index,
        }),
      );

      return this.as3bRepo.save(newSteps);
    } catch (error) {
      if (this.isMissingAs3bTableError(error)) {
        throw new ServiceUnavailableException(
          'AS3B storage is not available. Please run database migrations for style_as3b_steps.',
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    dto: {
      stageId?: string;
      stepName?: string;
      description?: string;
      timePerPc?: number;
      ssv?: number;
      orderIndex?: number;
    },
  ): Promise<StyleAs3bStep> {
    const step = await this.as3bRepo.findOne({ where: { id } });
    if (!step) {
      throw new NotFoundException(`AS3B Step #${id} not found`);
    }
    Object.assign(step, dto);
    return this.as3bRepo.save(step);
  }

  async remove(id: string): Promise<void> {
    const step = await this.as3bRepo.findOne({ where: { id } });
    if (!step) {
      throw new NotFoundException(`AS3B Step #${id} not found`);
    }
    await this.as3bRepo.remove(step);
  }

  async removeAll(styleId: string): Promise<void> {
    await this.as3bRepo.delete({ styleId });
  }

  async reorder(
    styleId: string,
    orderedIds: string[],
  ): Promise<StyleAs3bStep[]> {
    const updates = orderedIds.map((id, index) =>
      this.as3bRepo.update(id, { orderIndex: index }),
    );
    await Promise.all(updates);
    return this.findByStyleId(styleId);
  }

  private isMissingAs3bTableError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }
    const driverError = (
      error as QueryFailedError & {
        driverError?: { code?: string; message?: string };
      }
    ).driverError;
    const message = driverError?.message ?? error.message ?? '';
    return (
      driverError?.code === '42P01' && message.includes('style_as3b_steps')
    );
  }
}
