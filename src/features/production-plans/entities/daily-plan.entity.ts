import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ProductionPlan } from './production-plan.entity.js';

@Entity('daily_plans')
@Unique(['planId', 'day'])
export class DailyPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProductionPlan, (p) => p.dailyPlans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan: ProductionPlan;

  @Column({ type: 'uuid', name: 'plan_id' })
  planId: string;

  @Column({ type: 'smallint' })
  day: number; // 1-31

  @Column({ type: 'int', default: 0, name: 'planned_qty' })
  plannedQty: number;

  @Column({ type: 'int', default: 0, name: 'actual_qty' })
  actualQty: number;
}
