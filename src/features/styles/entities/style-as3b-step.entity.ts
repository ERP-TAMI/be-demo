import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Style } from './style.entity';

@Entity('style_as3b_steps')
export class StyleAs3bStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Style, (s) => s.as3bSteps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'style_id' })
  style: Style;

  @Column({ type: 'uuid', name: 'style_id' })
  styleId: string;

  @Column({ type: 'uuid', nullable: true, name: 'stage_id' })
  stageId: string;

  @Column({ type: 'varchar', length: 255, name: 'step_name' })
  stepName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 3,
    default: 0,
    name: 'time_per_pc',
  })
  timePerPc: number;

  @Column({ type: 'decimal', precision: 8, scale: 3, default: 0 })
  smv: number;

  @Column({ type: 'int', default: 0, name: 'order_index' })
  orderIndex: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
