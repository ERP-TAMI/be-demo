import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Style } from '../../styles/entities/style.entity.js';
import { Color } from '../../colors/entities/color.entity.js';

export enum SampleType {
  TECHPACK = 'TechPack',
  SKETCH = 'Sketch',
  FIT_SAMPLE = 'FitSample',
  QUOTATION = 'Quotation',
}

export enum SampleStatus {
  DRAFT = 'Draft',
  IN_ANALYSIS = 'In_Analysis',
  ANALYZED = 'Analyzed',
  APPROVED = 'Approved',
}

@Entity('samples')
export class Sample {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true, name: 'sample_code' })
  sampleCode: string;

  @Column({
    type: 'enum',
    enum: SampleType,
    default: SampleType.TECHPACK,
    name: 'sample_type',
  })
  sampleType: SampleType;

  @ManyToOne(() => Style, (style) => style.samples, { nullable: true })
  @JoinColumn({ name: 'style_id' })
  style: Style;

  @Column({ type: 'uuid', nullable: true, name: 'style_id' })
  styleId: string;

  @ManyToOne(() => Color, { nullable: true })
  @JoinColumn({ name: 'color_id' })
  color: Color;

  @Column({ type: 'uuid', nullable: true, name: 'color_id' })
  colorId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true, name: 'analysis_result' })
  analysisResult: string;

  @Column({ type: 'jsonb', nullable: true })
  files: { name: string; url: string; size: number }[];

  @Column({ type: 'jsonb', nullable: true })
  images: string[];

  @Column({
    type: 'enum',
    enum: SampleStatus,
    default: SampleStatus.DRAFT,
  })
  status: SampleStatus;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
