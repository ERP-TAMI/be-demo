import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MaterialGroup {
  VAI_CHINH = 'Vải chính',
  VAI_LOT = 'Vải lót',
  PHU_LIEU = 'Phụ liệu',
  NHAN_BAO_BI = 'Nhãn & Bao bì',
}

export enum MaterialStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'material_code' })
  materialCode: string;

  @Column({ type: 'varchar', length: 255, name: 'material_name' })
  materialName: string;

  @Column({
    type: 'enum',
    enum: MaterialGroup,
    name: 'material_group',
  })
  materialGroup: MaterialGroup;

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

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
