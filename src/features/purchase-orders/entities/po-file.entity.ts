import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { User } from '../../user/entities/user.entity';

export enum FileLabel {
  PO_PDF = 'PO PDF',
  TECH_PACK = 'Tech-pack',
  BOM_PDF = 'BOM PDF',
  HINH_MAU = 'Hình mẫu',
  TAI_LIEU_KHAC = 'Tài liệu khác',
}

@Entity('po_files')
export class PoFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PurchaseOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'po_id' })
  po: PurchaseOrder;

  @Column({ type: 'uuid', name: 'po_id' })
  poId: string;

  @Column({ type: 'varchar', length: 500, name: 'file_name' })
  fileName: string;

  @Column({
    type: 'enum',
    enum: FileLabel,
    default: FileLabel.TAI_LIEU_KHAC,
  })
  label: FileLabel;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({
    type: 'uuid',
    nullable: true,
    name: 'file_group_id',
    comment: 'Groups versions of same file',
  })
  fileGroupId: string;

  @Column({ type: 'varchar', length: 1000, name: 'file_url' })
  fileUrl: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
    name: 'size_mb',
  })
  sizeMb: number;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: User;

  @Column({ type: 'uuid', nullable: true, name: 'uploaded_by' })
  uploadedById: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'uploaded_at' })
  uploadedAt: Date;
}
