import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Style } from '../../styles/entities/style.entity';

export enum ColorStatus {
  DRAFT = 'Draft',
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Entity('colors')
export class Color {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Style, (style) => style.colors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'style_id' })
  style: Style;

  @Column({ type: 'uuid', name: 'style_id' })
  styleId: string;

  @Column({ type: 'varchar', length: 100, name: 'color_name' })
  colorName: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'color_image' })
  colorImage: string;

  @Column({ type: 'uuid', nullable: true, name: 'linked_sample_id' })
  linkedSampleId: string;

  @Column({
    type: 'enum',
    enum: ColorStatus,
    default: ColorStatus.DRAFT,
  })
  status: ColorStatus;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
