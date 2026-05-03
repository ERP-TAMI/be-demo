import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductionDoc } from './production-doc.entity';

@Entity('production_doc_sections')
export class ProductionDocSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProductionDoc, (d) => d.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doc_id' })
  doc: ProductionDoc;

  @Column({ type: 'uuid', name: 'doc_id' })
  docId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'simple-array', nullable: true, name: 'image_urls' })
  imageUrls: string[] | null;

  @Column({ type: 'jsonb', nullable: true, name: 'image_groups' })
  imageGroups:
    | {
        heading: string | null;
        headingColor: 'red' | 'black';
        imageUrls: string[];
        orderIndex: number;
      }[]
    | null;

  @Column({ type: 'int', default: 0, name: 'order_index' })
  orderIndex: number;
}
