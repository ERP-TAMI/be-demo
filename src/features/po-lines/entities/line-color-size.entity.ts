import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LineColor } from './line-color.entity.js';

@Entity('line_color_sizes')
export class LineColorSize {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LineColor, (c) => c.sizes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'color_id' })
  color: LineColor;

  @Column({ type: 'uuid', name: 'color_id' })
  colorId: string;

  @Column({ type: 'varchar', length: 20, name: 'size_label' })
  sizeLabel: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;
}
