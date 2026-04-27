import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MaterialGroup } from './material-group.entity';

export enum MaterialStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export enum StockStatus {
  OK = 'OK',
  LOW = 'Low',
  OUT = 'Out',
}

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'material_code' })
  materialCode: string;

  @Column({ type: 'varchar', length: 255, name: 'material_name' })
  materialName: string;

  @ManyToOne(() => MaterialGroup, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'material_group_id' })
  materialGroupEntity: MaterialGroup;

  @Column({ type: 'uuid', nullable: true, name: 'material_group_id' })
  materialGroupId: string;

  @Column({ type: 'varchar', length: 50 })
  unit: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    name: 'default_yield_pct',
  })
  defaultYieldPct: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    name: 'last_unit_cost',
  })
  lastUnitCost: number;

  @Column({
    type: 'enum',
    enum: MaterialStatus,
    default: MaterialStatus.ACTIVE,
  })
  status: MaterialStatus;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    name: 'current_stock',
  })
  currentStock: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 10,
    name: 'low_stock_threshold',
  })
  lowStockThreshold: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
