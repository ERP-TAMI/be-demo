import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { PoLine } from './po-line.entity.js';
import { LineColorSize } from './line-color-size.entity.js';

@Entity('line_colors')
export class LineColor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PoLine, (l) => l.colors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'line_id' })
  line: PoLine;

  @Column({ type: 'uuid', name: 'line_id' })
  lineId: string;

  @Column({ type: 'varchar', length: 100, name: 'color_name' })
  colorName: string;

  @OneToMany(() => LineColorSize, (s) => s.color, { cascade: true })
  sizes: LineColorSize[];
}
