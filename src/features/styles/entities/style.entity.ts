import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Color } from '../../colors/entities/color.entity.js';
import { Sample } from '../../samples/entities/sample.entity.js';
import { DraftBom } from '../../draft-boms/entities/draft-bom.entity.js';
import { StyleAs3bStep } from './style-as3b-step.entity.js';
import { StyleProductionDoc } from './style-production-doc.entity.js';

export enum StyleStatus {
  DRAFT = 'Draft',
  IN_REVIEW = 'In_Review',
  APPROVED = 'Approved',
  ACTIVE = 'Active',
  ARCHIVED = 'Archived',
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

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'base_image' })
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

  @OneToMany(() => StyleProductionDoc, (doc) => doc.style)
  productionDocs: StyleProductionDoc[];
}
