import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionPlan } from './entities/production-plan.entity.js';
import { DailyPlan } from './entities/daily-plan.entity.js';

@Injectable()
export class ProductionPlansService {
  constructor(
    @InjectRepository(ProductionPlan)
    private readonly planRepo: Repository<ProductionPlan>,
    @InjectRepository(DailyPlan)
    private readonly dailyRepo: Repository<DailyPlan>,
  ) {}

  async findAll(filters?: {
    lineId?: string;
    workshopId?: string;
    month?: number;
    year?: number;
  }): Promise<ProductionPlan[]> {
    const qb = this.planRepo
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.dailyPlans', 'daily')
      .orderBy('plan.year', 'DESC')
      .addOrderBy('plan.month', 'DESC');

    if (filters?.lineId)
      qb.andWhere('plan.line_id = :lineId', { lineId: filters.lineId });
    if (filters?.workshopId)
      qb.andWhere('plan.workshop_id = :workshopId', {
        workshopId: filters.workshopId,
      });
    if (filters?.month)
      qb.andWhere('plan.month = :month', { month: filters.month });
    if (filters?.year) qb.andWhere('plan.year = :year', { year: filters.year });

    return qb.getMany();
  }

  async findOne(id: string): Promise<ProductionPlan> {
    const plan = await this.planRepo.findOne({
      where: { id },
      relations: ['dailyPlans'],
    });
    if (!plan) throw new NotFoundException(`Plan #${id} not found`);
    return plan;
  }

  async create(
    dto: Partial<ProductionPlan>,
    actorId?: string,
  ): Promise<ProductionPlan> {
    const plan = this.planRepo.create({ ...dto, createdById: actorId });
    return this.planRepo.save(plan);
  }

  async update(
    id: string,
    dto: Partial<ProductionPlan>,
  ): Promise<ProductionPlan> {
    const plan = await this.findOne(id);
    Object.assign(plan, dto);
    return this.planRepo.save(plan);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);
    await this.planRepo.remove(plan);
  }

  async upsertDailyPlan(
    planId: string,
    day: number,
    plannedQty: number,
    actualQty?: number,
  ): Promise<DailyPlan> {
    await this.findOne(planId);
    let daily = await this.dailyRepo.findOne({ where: { planId, day } });
    if (!daily) {
      daily = this.dailyRepo.create({ planId, day });
    }
    daily.plannedQty = plannedQty;
    if (actualQty !== undefined) daily.actualQty = actualQty;
    return this.dailyRepo.save(daily);
  }

  async bulkUpsertDailyPlans(
    planId: string,
    days: Array<{ day: number; plannedQty: number; actualQty?: number }>,
  ): Promise<DailyPlan[]> {
    await this.findOne(planId);
    return Promise.all(
      days.map((d) =>
        this.upsertDailyPlan(planId, d.day, d.plannedQty, d.actualQty),
      ),
    );
  }
}
