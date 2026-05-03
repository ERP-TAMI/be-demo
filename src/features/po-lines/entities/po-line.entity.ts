import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';
import { Color } from '../../colors/entities/color.entity';
import { Style } from '../../styles/entities/style.entity';
import { LineColor } from './line-color.entity';
import { LineFile } from './line-file.entity';
import { LineAs3bStep } from './line-as3b-step.entity';
import { LineSample } from './line-sample.entity';
import { LineMappedFile } from './line-mapped-file.entity';
import { PoLineVersion } from './po-line-version.entity';

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

  /** FK → styles (nullable - cho phép tạo line không cần style) */
  @Column({ type: 'uuid', nullable: true, name: 'style_id' })
  styleId: string | null;

  /** Style cha — kế thừa thông số kỹ thuật, AS3B, tên, category */
  @ManyToOne(() => Style, { nullable: true, eager: false })
  @JoinColumn({ name: 'style_id' })
  style: Style | null;

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

  /**
   * Màu sắc cụ thể của PO_Line này.
   * Business Rule: 1 PO_Line = 1 Màu duy nhất (Style + Color).
   */
  @ManyToOne(() => Color, { nullable: true, eager: false })
  @JoinColumn({ name: 'color_id' })
  color: Color;

  @Column({ type: 'uuid', nullable: true, name: 'color_id' })
  colorId: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'color_name' })
  colorName: string;

  /**
   * Phiên bản hiện tại của PO_Line.
   * Tự động tăng mỗi khi có thay đổi thông số — xem po_line_versions để tra lịch sử.
   */
  @Column({ type: 'int', default: 1, name: 'version_number' })
  versionNumber: number;

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

  /**
   * @deprecated Dữ liệu màu cũ (multi-color per line).
   * Kể từ phiên bản này, màu được lưu trực tiếp trong colorId/colorName.
   * Giữ lại để backward compat với dữ liệu cũ.
   */
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

  /** Lịch sử phiên bản — mỗi lần cập nhật thông số tạo một snapshot mới */
  @OneToMany(() => PoLineVersion, (v) => v.line, { cascade: false })
  versions: PoLineVersion[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
