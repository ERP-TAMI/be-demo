import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DraftBomLine } from './draft-bom-line.entity.js';
import { Style } from '../../styles/entities/style.entity.js';
import { Color } from '../../colors/entities/color.entity.js';

export enum DraftBomStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  APPROVED = 'Approved',
}

@Entity('draft_boms')
export class DraftBom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true, name: 'draft_bom_code' })
  draftBomCode: string;

  @ManyToOne(() => Style, { nullable: true })
  @JoinColumn({ name: 'style_id' })
  style: Style;

  @Column({ type: 'uuid', nullable: true, name: 'style_id' })
  styleId: string;

  @ManyToOne(() => Color, { nullable: true })
  @JoinColumn({ name: 'color_id' })
  color: Color;

  @Column({ type: 'uuid', nullable: true, name: 'color_id' })
  colorId: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'trim_cost',
  })
  trimCost: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    name: 'quotation_price',
  })
  quotationPrice: number;

  @Column({
    type: 'enum',
    enum: DraftBomStatus,
    default: DraftBomStatus.DRAFT,
  })
  status: DraftBomStatus;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => DraftBomLine, (line) => line.draftBom, { cascade: true })
  lines: DraftBomLine[];
}
