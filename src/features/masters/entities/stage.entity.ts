import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum StageStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Entity('stages')
export class Stage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'stage_code' })
  stageCode: string;

  @Column({ type: 'varchar', length: 255, name: 'stage_name' })
  stageName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 8, scale: 3, default: 0 })
  smv: number; // Standard Minute Value

  @Column({
    type: 'enum',
    enum: StageStatus,
    default: StageStatus.ACTIVE,
  })
  status: StageStatus;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
