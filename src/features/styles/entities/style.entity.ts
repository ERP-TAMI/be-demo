import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Color } from '../../colors/entities/color.entity';
import { Sample } from '../../samples/entities/sample.entity';
import { DraftBom } from '../../draft-boms/entities/draft-bom.entity';
import { StyleAs3bStep } from './style-as3b-step.entity';
import { StyleProductionDoc } from './style-production-doc.entity';

/**
 * Metadata for files assigned to a Style (stored as JSONB).
 * Matches frontend expectations: { id, name, url, type, size, uploadedAt }
 */
export interface StyleFileMetadata {
  id: string;
  name: string;
  url?: string;
  type?: string;
  size?: string;
  label?: string;
  uploadedAt?: Date;
}

export enum StyleStatus {
  DRAFT = 'Draft',
  APPROVED = 'Approved',
  ACTIVE = 'Active',
}

@Entity('styles')
export class Style {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true, name: 'style_code' })
  styleCode: string;

  @Column({ type: 'varchar', length: 255, name: 'style_name' })
  styleName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'text', nullable: true, name: 'base_image' })
  baseImage: string;

  @Column({ type: 'uuid', nullable: true, name: 'sample_request_id' })
  sampleRequestId: string;

  @Column({
    type: 'enum',
    enum: StyleStatus,
    default: StyleStatus.DRAFT,
  })
  status: StyleStatus;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Color, (color) => color.style)
  colors: Color[];

  @OneToMany(() => Sample, (sample) => sample.style)
  samples: Sample[];

  @OneToMany(() => DraftBom, (draftBom) => draftBom.style)
  draftDoms: DraftBom[];

  @OneToMany(() => StyleAs3bStep, (step) => step.style)
  as3bSteps: StyleAs3bStep[];

  @Column({ type: 'int', default: 30, name: 'as3b_cm_base_days' })
  as3bCmBaseDays: number;

  @OneToMany(() => StyleProductionDoc, (doc) => doc.style)
  productionDocs: StyleProductionDoc[];

  /**
   * Assigned documents metadata (stored as JSON array).
   * Each entry: { id, name, url, type, size, uploadedAt }
   */
  @Column({ type: 'jsonb', nullable: true, default: [] })
  files: StyleFileMetadata[];
}
