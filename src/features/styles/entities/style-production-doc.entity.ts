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
import { Style } from './style.entity';

export enum ProductionDocStatus {
  DRAFT = 'Draft',
  IN_PROGRESS = 'In_Progress',
  COMPLETED = 'Completed',
}

@Entity('style_production_docs')
export class StyleProductionDoc {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Style, (s) => s.productionDocs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'style_id' })
  style: Style;

  @Column({ type: 'uuid', name: 'style_id' })
  styleId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ProductionDocStatus,
    default: ProductionDocStatus.DRAFT,
  })
  status: ProductionDocStatus;

  // Section 1: Mô tả
  @Column({ type: 'text', nullable: true, name: 'section1_description' })
  section1Description: string;

  @Column({ type: 'text', nullable: true, name: 'section1_image_url' })
  section1ImageUrl: string;

  // Section 2: Phụ liệu
  @Column({ type: 'text', nullable: true, name: 'section2_accessories' })
  section2Accessories: string;

  // Section 3: Lưu ý
  @Column({ type: 'text', nullable: true, name: 'section3_notes' })
  section3Notes: string;

  // Section 4: Comment khách hàng
  @Column({ type: 'text', nullable: true, name: 'section4_customer_feedback' })
  section4CustomerFeedback: string;

  // Size data (JSON)
  @Column({ type: 'jsonb', nullable: true, name: 'size_data' })
  sizeData: any;

  // File attachments (JSON array)
  @Column({ type: 'jsonb', nullable: true, name: 'attachments' })
  attachments: { name: string; url: string; size: number }[];

  // Dynamic sections (JSON)
  @Column({ type: 'jsonb', nullable: true })
  sections: {
    title: string;
    content: string;
    imageUrls: string[];
    imageGroups?: { heading: string; headingColor: string; imageUrls: string[]; orderIndex: number }[];
    orderIndex: number;
  }[];

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
