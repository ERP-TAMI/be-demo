import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PoLine } from './po-line.entity.js';
import { PoFile } from '../../purchase-orders/entities/po-file.entity.js';

@Entity('line_mapped_files')
export class LineMappedFile {
  @PrimaryColumn({ type: 'uuid', name: 'line_id' })
  lineId: string;

  @PrimaryColumn({ type: 'uuid', name: 'po_file_id' })
  poFileId: string;

  @ManyToOne(() => PoLine, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'line_id' })
  line: PoLine;

  @ManyToOne(() => PoFile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'po_file_id' })
  poFile: PoFile;
}
