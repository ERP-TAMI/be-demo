import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductionDoc } from './production-doc.entity.js';

@Entity('production_doc_size_rows')
export class ProductionDocSizeRow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProductionDoc, (d) => d.sizeRows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doc_id' })
  doc: ProductionDoc;

  @Column({ type: 'uuid', name: 'doc_id' })
  docId: string;

  @Column({ type: 'varchar', length: 255, name: 'row_name' })
  rowName: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 's_value' })
  sValue: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'm_value' })
  mValue: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'l_value' })
  lValue: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'xl_value' })
  xlValue: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'pattern_value' })
  patternValue: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'tol_plus_minus' })
  tolPlusMinus: string | null;

  @Column({ type: 'int', default: 0, name: 'order_index' })
  orderIndex: number;
}
