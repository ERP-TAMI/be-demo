import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Style } from '../../styles/entities/style.entity';
import { Color } from '../../colors/entities/color.entity';

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
  styleId: string | null;

  @ManyToOne(() => Color, { nullable: true })
  @JoinColumn({ name: 'color_id' })
  color: Color;

  @Column({ type: 'uuid', nullable: true, name: 'color_id' })
  colorId: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true, name: 'analysis_result' })
  analysisResult: string | null;

  @Column({ type: 'jsonb', nullable: true })
  files: { name: string; url: string; size: number }[] | null;

  @Column({ type: 'jsonb', nullable: true })
  images: string[] | null;

  @Column({
    type: 'enum',
    enum: SampleStatus,
    default: SampleStatus.DRAFT,
    nullable: true,
  })
  status: SampleStatus;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'created_by' })
  createdBy: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
