import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { MasterPoLine } from './master-po-line.entity.js';

export enum MasterPoStatus {
  DRAFT = 'Draft',
  CONFIRMED = 'Confirmed',
  PARTIALLY_SHIPPED = 'Partially_Shipped',
  SHIPPED = 'Shipped',
}

@Entity('master_pos')
export class MasterPo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true, name: 'master_po_code' })
  masterPoCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'container_name' })
  containerName: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'shipping_month' })
  shippingMonth: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'estimated_ship_date' })
  estimatedShipDate: Date;

  @Column({ type: 'int', default: 0, name: 'total_quantity' })
  totalQuantity: number;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    name: 'total_trim_cost',
  })
  totalTrimCost: number;

  @Column({
    type: 'enum',
    enum: MasterPoStatus,
    default: MasterPoStatus.DRAFT,
  })
  status: MasterPoStatus;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => MasterPoLine, (line) => line.masterPo)
  linkedLines: MasterPoLine[];
}
