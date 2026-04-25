import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MasterPo } from './master-po.entity.js';
import { PoLine } from '../../po-lines/entities/po-line.entity.js';

@Entity('master_po_lines')
export class MasterPoLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MasterPo, (masterPo) => masterPo.linkedLines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'master_po_id' })
  masterPo: MasterPo;

  @Column({ type: 'uuid', name: 'master_po_id' })
  masterPoId: string;

  @ManyToOne(() => PoLine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'po_line_id' })
  poLine: PoLine;

  @Column({ type: 'uuid', name: 'po_line_id' })
  poLineId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'linked_at' })
  linkedAt: Date;
}
