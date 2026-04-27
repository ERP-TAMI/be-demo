import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DocFolder } from './doc-folder.entity';

@Entity('doc_files')
export class DocFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  name: string;

  /** pdf | image | xlsx | docx | file */
  @Column({ type: 'varchar', length: 50 })
  type: string;

  /** Kích thước dạng string VD: "2.3 MB" */
  @Column({ type: 'varchar', length: 50, nullable: true })
  size: string;

  /** URL presigned (MinIO) */
  @Column({ type: 'varchar', length: 1000, nullable: true })
  url: string;

  /** MinIO object key để xóa sau */
  @Column({ type: 'varchar', length: 1000, nullable: true, name: 'file_key' })
  fileKey: string;

  @Column({ type: 'uuid', name: 'folder_id' })
  folderId: string;

  @ManyToOne(() => DocFolder, (folder) => folder.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'folder_id' })
  folder: DocFolder;

  @CreateDateColumn({ type: 'timestamptz', name: 'uploaded_at' })
  uploadedAt: Date;
}
