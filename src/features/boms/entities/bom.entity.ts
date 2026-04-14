import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity.js';
import { PoLine } from '../../po-lines/entities/po-line.entity.js';
import { User } from '../../user/entities/user.entity.js';
import { BomLine } from './bom-line.entity.js';

export enum BomStatus {
  DRAFT = 'Draft',
  WAIT_RD = 'Wait_RD',
  WAIT_PRICE = 'Wait_Price',
  WAIT_TP_APPROVE = 'Wait_TP_Approve',
  WAIT_SA_APPROVE = 'Wait_SA_Approve',
  APPROVED = 'Approved',
  LOCKED = 'Locked',
}

@Entity('boms')
export class Bom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PurchaseOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'po_id' })
  po: PurchaseOrder;

  @Column({ type: 'uuid', name: 'po_id' })
  poId: string;

  @ManyToOne(() => PoLine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'line_id' })
  line: PoLine;

  @Column({ type: 'uuid', name: 'line_id' })
  lineId: string;

  @Column({ type: 'uuid', nullable: true, name: 'color_id' })
  colorId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'color_name' })
  colorName: string;

  @Column({ type: 'varchar', length: 100, name: 'style_code' })
  styleCode: string;

  @Column({ type: 'varchar', length: 255, name: 'product_name' })
  productName: string;

  @Column({ type: 'int', default: 0, name: 'po_quantity' })
  poQuantity: number;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({
    type: 'enum',
    enum: BomStatus,
    default: BomStatus.DRAFT,
  })
  status: BomStatus;

  @Column({ type: 'text', nullable: true, name: 'change_reason' })
  changeReason: string;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'submitted_by' })
  submittedBy: User;

  @Column({ type: 'uuid', nullable: true, name: 'submitted_by' })
  submittedById: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'submitted_at' })
  submittedAt: Date;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'approved_by' })
  approvedBy: User;

  @Column({ type: 'uuid', nullable: true, name: 'approved_by' })
  approvedById: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'approved_at' })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'reject_reason' })
  rejectReason: string;

  @Column({ type: 'text', nullable: true, name: 'rd_comment' })
  rdComment: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    name: 'total_cost_per_unit',
  })
  totalCostPerUnit: number;

  @Column({ type: 'date', nullable: true })
  deadline: string;

  @OneToMany(() => BomLine, (bl) => bl.bom, { cascade: true })
  bomLines: BomLine[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
