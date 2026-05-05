import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('style_version_logs')
export class StyleVersionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'style_id' })
  styleId: string;

  @Column({ type: 'varchar', length: 255 })
  actor: string;

  @Column({ type: 'varchar', length: 100 })
  type: string; // STYLE_CREATED, STYLE_UPDATED, STYLE_STATUS_CHANGED, etc.

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'uuid', nullable: true, name: 'target_id' })
  targetId?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'target_label',
  })
  targetLabel?: string;

  @Column({ type: 'jsonb', nullable: true })
  changes?: { field: string; label: string; before: any; after: any }[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
