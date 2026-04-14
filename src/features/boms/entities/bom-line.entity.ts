import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Bom } from './bom.entity.js';
import { Material } from '../../masters/entities/material.entity.js';

@Entity('bom_lines')
export class BomLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Bom, (b) => b.bomLines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bom_id' })
  bom: Bom;

  @Column({ type: 'uuid', name: 'bom_id' })
  bomId: string;

  @ManyToOne(() => Material, { nullable: true, eager: false })
  @JoinColumn({ name: 'master_material_id' })
  masterMaterial: Material;

  @Column({ type: 'uuid', nullable: true, name: 'master_material_id' })
  masterMaterialId: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'material_name',
    comment: 'Denormalized for historical accuracy',
  })
  materialName: string;

  @Column({ type: 'varchar', length: 100, name: 'material_group' })
  materialGroup: string;

  @Column({ type: 'varchar', length: 50 })
  unit: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    default: 0,
    name: 'consumption_per_unit',
  })
  consumptionPerUnit: number;

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
    precision: 15,
    scale: 2,
    default: 0,
    name: 'unit_cost',
  })
  unitCost: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    name: 'line_cost_per_unit',
    comment: 'consumption * (1 + yield/100) * unit_cost',
  })
  lineCostPerUnit: number;
}
