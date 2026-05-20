import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SizeChartStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Entity('size_charts')
export class SizeChart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'jsonb', default: [] })
  sizes: string[];

  @Column({
    type: 'enum',
    enum: SizeChartStatus,
    default: SizeChartStatus.ACTIVE,
  })
  status: SizeChartStatus;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
