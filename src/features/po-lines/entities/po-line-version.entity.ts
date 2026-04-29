import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PoLine } from './po-line.entity';

/**
 * Lưu snapshot lịch sử thông số của PoLine.
 * Business Rule: KHÔNG BAO GIỜ ghi đè dữ liệu cũ — mỗi thay đổi tạo một version mới.
 */
@Entity('po_line_versions')
export class PoLineVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PoLine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'line_id' })
  line: PoLine;

  @Column({ type: 'uuid', name: 'line_id' })
  lineId: string;

  /** Số phiên bản tại thời điểm snapshot này được lưu */
  @Column({ type: 'int', name: 'version_no' })
  versionNo: number;

  /**
   * Toàn bộ thông số của PoLine tại thời điểm trước khi thay đổi:
   * { styleCode, productName, colorName, deadline, versionNumber, ... }
   */
  @Column({ type: 'jsonb', name: 'snapshot_data' })
  snapshotData: Record<string, any>;

  /** Lý do thay đổi — bắt buộc không được để trống */
  @Column({ type: 'text', name: 'change_reason' })
  changeReason: string;

  /** Email hoặc tên người thực hiện thay đổi */
  @Column({ type: 'varchar', length: 255, name: 'changed_by' })
  changedBy: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
