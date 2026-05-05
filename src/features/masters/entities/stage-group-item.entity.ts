import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StageGroup } from './stage-group.entity';

@Entity('stage_group_items')
export class StageGroupItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'group_id' })
  groupId: string;

  @ManyToOne(() => StageGroup, (group) => group.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: StageGroup;

  @Column({ type: 'varchar', length: 255, name: 'stage_name' })
  stageName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 8, scale: 3, default: 10 })
  ssv: number; // Standard Second Value

  @Column({ type: 'int', name: 'order_index', default: 0 })
  orderIndex: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
