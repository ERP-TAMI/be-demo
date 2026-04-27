import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { PoLine } from '../../po-lines/entities/po-line.entity';
import { Workshop } from '../../masters/entities/workshop.entity';
import { User } from '../../user/entities/user.entity';
import { DailyPlan } from './daily-plan.entity';

@Entity('production_plans')
export class ProductionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PoLine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'line_id' })
  line: PoLine;

  @Column({ type: 'uuid', name: 'line_id' })
  lineId: string;

  @ManyToOne(() => Workshop, { nullable: true, eager: false })
  @JoinColumn({ name: 'workshop_id' })
  workshop: Workshop;

  @Column({ type: 'uuid', nullable: true, name: 'workshop_id' })
  workshopId: string;

  @Column({ type: 'smallint' })
  month: number;

  @Column({ type: 'smallint' })
  year: number;

  @Column({ type: 'int', default: 0, name: 'planned_quantity' })
  plannedQuantity: number;

  @Column({ type: 'text', nullable: true })
  note: string;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdById: string;

  @OneToMany(() => DailyPlan, (d) => d.plan, { cascade: true })
  dailyPlans: DailyPlan[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
