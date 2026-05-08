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
  ssv: number;

  @Column({ type: 'int', default: 0, name: 'target_total' })
  targetTotal: number;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'int', default: 0, name: 'order_index' })
  orderIndex: number;

  @Column({ type: 'uuid', nullable: true, name: 'parent_row_id' })
  parentRowId: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_group' })
  isGroup: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'group_id' })
  groupId: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'group_items' })
  groupItems: any;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
