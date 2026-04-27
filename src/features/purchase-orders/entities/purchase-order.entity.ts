import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { PoLine } from '../../po-lines/entities/po-line.entity';
import { PoFile } from './po-file.entity';

export enum PoStatus {
  DRAFT = 'Draft',
  PENDING_RD = 'Pending_RD',
  IN_PROGRESS = 'In_Progress',
  PO_FINAL = 'PO_Final',
  CANCELLED = 'Cancelled',
}

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'po_code' })
  poCode: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'customer_po_code',
  })
  customerPoCode: string;

  @Column({ type: 'varchar', length: 255 })
  customer: string;

  @Column({ type: 'date', nullable: true, name: 'received_date' })
  receivedDate: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({
    type: 'enum',
    enum: PoStatus,
    default: PoStatus.DRAFT,
  })
  status: PoStatus;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdById: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'finalized_at' })
  finalizedAt: Date;

  @OneToMany(() => PoLine, (line) => line.po, { cascade: true })
  lines: PoLine[];

  @OneToMany(() => PoFile, (file) => file.po, { cascade: true })
  files: PoFile[];
}
