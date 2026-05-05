import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { StageGroupItem } from './stage-group-item.entity';

export enum StageGroupStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Entity('stage_groups')
export class StageGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'group_code' })
  groupCode: string;

  @Column({ type: 'varchar', length: 255, name: 'group_name' })
  groupName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: StageGroupStatus,
    default: StageGroupStatus.ACTIVE,
  })
  status: StageGroupStatus;

  @OneToMany(() => StageGroupItem, (item) => item.group, {
    cascade: true,
    eager: true,
  })
  items: StageGroupItem[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
