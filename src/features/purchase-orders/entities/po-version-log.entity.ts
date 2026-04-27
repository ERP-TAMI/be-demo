import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';

export enum PoEventType {
  PO_CREATED = 'PO_CREATED',
  PO_INFO_UPDATED = 'PO_INFO_UPDATED',
  LINE_ADDED = 'LINE_ADDED',
  LINE_UPDATED = 'LINE_UPDATED',
  LINE_STATUS_CHANGED = 'LINE_STATUS_CHANGED',
  LINE_FILE_ADDED = 'LINE_FILE_ADDED',
  LINE_FILE_REMOVED = 'LINE_FILE_REMOVED',
  FILE_ADDED = 'FILE_ADDED',
  FILE_VERSION_ADDED = 'FILE_VERSION_ADDED',
  FILE_REMOVED = 'FILE_REMOVED',
  SAMPLE_ADDED = 'SAMPLE_ADDED',
  BOM_CREATED = 'BOM_CREATED',
  BOM_UPDATED = 'BOM_UPDATED',
  BOM_SUBMITTED = 'BOM_SUBMITTED',
  BOM_APPROVED = 'BOM_APPROVED',
  BOM_REJECTED = 'BOM_REJECTED',
  BOM_REVISED = 'BOM_REVISED',
  PO_FINALIZED = 'PO_FINALIZED',
  FILE_ASSIGNED = 'FILE_ASSIGNED',
}

@Entity('po_version_logs')
export class PoVersionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PurchaseOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'po_id' })
  po: PurchaseOrder;

  @Column({ type: 'uuid', name: 'po_id' })
  poId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  actor: string;

  @Column({ type: 'enum', enum: PoEventType, name: 'event_type' })
  eventType: PoEventType;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'uuid', nullable: true, name: 'target_id' })
  targetId: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'target_label',
  })
  targetLabel: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Array of {field, label, before, after}',
  })
  changes: Record<string, any>[];

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp: Date;
}
