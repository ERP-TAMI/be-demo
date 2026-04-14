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
import { LineColor } from './line-color.entity.js';
import { LineFile } from './line-file.entity.js';
import { LineAs3bStep } from './line-as3b-step.entity.js';
import { LineSample } from './line-sample.entity.js';
import { LineMappedFile } from './line-mapped-file.entity.js';

export enum LineCategory {
  SHIRT = 'Shirt',
  PANTS = 'Pants',
  JACKET = 'Jacket',
  POLO = 'Polo',
  SHORTS = 'Shorts',
  DRESS = 'Dress',
  SKIRT = 'Skirt',
}

export enum LineStatus {
  DRAFT = 'Draft',
  IN_REVIEW = 'In_Review',
  SAMPLING = 'Sampling',
  FINAL = 'Final',
  CANCELLED = 'Cancelled',
}

@Entity('po_lines')
export class PoLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PurchaseOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'po_id' })
  po: PurchaseOrder;

  @Column({ type: 'uuid', name: 'po_id' })
  poId: string;

  @Column({ type: 'varchar', length: 100, name: 'style_code' })
  styleCode: string;

  @Column({ type: 'varchar', length: 255, name: 'product_name' })
  productName: string;

  @Column({
    type: 'enum',
    enum: LineCategory,
    nullable: true,
  })
  category: LineCategory;

  @Column({ type: 'text', nullable: true })
  material: string;

  @Column({ type: 'date', nullable: true })
  deadline: string;

  @Column({
    type: 'enum',
    enum: LineStatus,
    default: LineStatus.DRAFT,
  })
  status: LineStatus;

  @Column({
    type: 'enum',
    enum: LineStatus,
    nullable: true,
    name: 'previous_status',
  })
  previousStatus: LineStatus | null;

  @OneToMany(() => LineColor, (c) => c.line, { cascade: true })
  colors: LineColor[];

  @OneToMany(() => LineFile, (f) => f.line, { cascade: true })
  files: LineFile[];

  @OneToMany(() => LineAs3bStep, (s) => s.line, { cascade: true })
  as3bSteps: LineAs3bStep[];

  @OneToMany(() => LineSample, (s) => s.line, { cascade: true })
  samples: LineSample[];

  @OneToMany(() => LineMappedFile, (m) => m.line, { cascade: true })
  mappedFiles: LineMappedFile[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
