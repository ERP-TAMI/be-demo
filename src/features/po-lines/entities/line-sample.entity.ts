import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { PoLine } from './po-line.entity.js';
import { SampleColorImage } from './sample-color-image.entity.js';

export enum SampleStatus {
  DANG_LAM = 'Đang làm',
  CAN_CHINH_SUA = 'Cần chỉnh sửa',
  DA_DUYET = 'Đã duyệt',
}

@Entity('line_samples')
export class LineSample {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PoLine, (l) => l.samples, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'line_id' })
  line: PoLine;

  @Column({ type: 'uuid', name: 'line_id' })
  lineId: string;

  @Column({ type: 'int', default: 1 })
  round: number;

  @Column({ type: 'date', nullable: true, name: 'sample_date' })
  sampleDate: string;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({
    type: 'enum',
    enum: SampleStatus,
    default: SampleStatus.DANG_LAM,
  })
  status: SampleStatus;

  @OneToMany(() => SampleColorImage, (img) => img.sample, { cascade: true })
  images: SampleColorImage[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
