import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { LineColor } from './line-color.entity.js';

@Entity('line_color_cards')
export class LineColorCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => LineColor, (color) => color.colorCard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'line_color_id' })
  lineColor: LineColor;

  @Column({ type: 'uuid', name: 'line_color_id' })
  lineColorId: string;

  @Column({ type: 'varchar', length: 500, name: 'file_path' })
  filePath: string;

  @Column({ type: 'varchar', length: 200, name: 'file_name', nullable: true })
  fileName: string;

  @Column({ type: 'uuid', name: 'uploaded_by' })
  uploadedBy: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'uploaded_at' })
  uploadedAt: Date;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: 'active' | 'inactive';
}
