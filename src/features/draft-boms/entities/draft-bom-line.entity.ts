import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DraftBom } from './draft-bom.entity.js';
import { Material } from '../../masters/entities/material.entity.js';

@Entity('draft_bom_lines')
export class DraftBomLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DraftBom, (draftBom) => draftBom.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'draft_bom_id' })
  draftBom: DraftBom;

  @Column({ type: 'uuid', name: 'draft_bom_id' })
  draftBomId: string;

  @ManyToOne(() => Material, { nullable: true })
  @JoinColumn({ name: 'master_material_id' })
  masterMaterial: Material;

  @Column({ type: 'uuid', nullable: true, name: 'master_material_id' })
  masterMaterialId: string;

  @Column({ type: 'varchar', length: 255, name: 'material_name' })
  materialName: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'material_group' })
  materialGroup: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    default: 0,
    name: 'consumption',
  })
  consumption: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    name: 'unit_cost',
  })
  unitCost: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    name: 'yield_pct',
  })
  yieldPct: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 4,
    default: 0,
    name: 'line_cost_per_unit',
  })
  lineCostPerUnit: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
