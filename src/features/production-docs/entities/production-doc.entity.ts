import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { PoLine } from '../../po-lines/entities/po-line.entity';
import { ProductionDocSizeRow } from './production-doc-size-row.entity';
import { ProductionDocSection } from './production-doc-section.entity';

@Entity('production_docs')
export class ProductionDoc {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PoLine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'line_id' })
  line: PoLine;

  @Column({ type: 'uuid', name: 'line_id' })
  lineId: string;

  @Column({ type: 'text', nullable: true, name: 'section1_mo_ta' })
  section1MoTa: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true, name: 'section1_image_url' })
  section1ImageUrl: string | null;

  @Column({ type: 'text', nullable: true, name: 'section2_phu_lieu' })
  section2PhuLieu: string | null;

  @Column({ type: 'text', nullable: true, name: 'section3_luu_y_trai_cat' })
  section3LuuYTraiCat: string | null;

  @Column({ type: 'text', nullable: true, name: 'section4_comment_khach_hang' })
  section4CommentKhachHang: string | null;

  @OneToMany(() => ProductionDocSizeRow, (r) => r.doc, { cascade: true })
  sizeRows: ProductionDocSizeRow[];

  @OneToMany(() => ProductionDocSection, (s) => s.doc, { cascade: true })
  sections: ProductionDocSection[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
