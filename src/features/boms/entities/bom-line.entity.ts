import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
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
    comment: 'Định mức tiêu hao: số NPL thực tế/SP, do R&D nhập',
  })
  consumptionPerUnit: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    name: 'yield_pct',
    comment: 'Tỷ lệ dự trữ %, cố định 3% — hệ thống tự set',
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
    comment: 'consumption_per_unit * 1.03 * unit_cost (wastage 3% cố định)',
  })
  lineCostPerUnit: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
