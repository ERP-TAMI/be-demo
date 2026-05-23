import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PoLine } from './po-line.entity';

export enum LineFileLabel {
  NPL_PDF = 'NPL PDF',
  TECH_PACK = 'Tech-pack',
  BAN_DICH = 'Bản dịch',
  HINH_MAU = 'Hình mẫu',
  TAI_LIEU_KHAC = 'Tài liệu khác',
}

@Entity('line_files')
export class LineFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PoLine, (l) => l.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'line_id' })
  line: PoLine;

  @Column({ type: 'uuid', name: 'line_id' })
  lineId: string;

  @Column({ type: 'varchar', length: 500, name: 'file_name' })
  fileName: string;

  @Column({
    type: 'enum',
    enum: LineFileLabel,
    default: LineFileLabel.TAI_LIEU_KHAC,
  })
  label: LineFileLabel;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'uuid', nullable: true, name: 'file_group_id' })
  fileGroupId: string;

  @Column({ type: 'varchar', length: 1000, name: 'file_url' })
  fileUrl: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'uploaded_at' })
  uploadedAt: Date;
}
