import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LineSample } from './line-sample.entity';

@Entity('sample_color_images')
export class SampleColorImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LineSample, (s) => s.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sample_id' })
  sample: LineSample;

  @Column({ type: 'uuid', name: 'sample_id' })
  sampleId: string;

  @Column({ type: 'uuid', nullable: true, name: 'color_id' })
  colorId: string;

  @Column({ type: 'varchar', length: 100, name: 'color_name' })
  colorName: string;

  @Column({ type: 'varchar', length: 1000, name: 'image_url' })
  imageUrl: string;
}
