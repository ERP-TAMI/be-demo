import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocFolder } from './entities/doc-folder.entity.js';
import { DocFile } from './entities/doc-file.entity.js';
import { UploadsService } from '../uploads/uploads.service.js';

@Injectable()
export class DocFoldersService {
  constructor(
    @InjectRepository(DocFolder)
    private readonly folderRepo: Repository<DocFolder>,
    @InjectRepository(DocFile)
    private readonly fileRepo: Repository<DocFile>,
  ) {}

  /** Lấy tất cả thư mục, kèm số lượng file */
  findAll(search?: string) {
    const qb = this.folderRepo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.files', 'files')
      .orderBy('f.created_at', 'DESC');

    if (search) {
      qb.where('f.name ILIKE :s OR f.description ILIKE :s', {
        s: `%${search}%`,
      });
    }

    return qb.getMany();
  }

  async findOne(id: string) {
    const folder = await this.folderRepo.findOne({
      where: { id },
      relations: ['files'],
    });
    if (!folder) throw new NotFoundException('Không tìm thấy thư mục');
    return folder;
  }

  create(data: { name: string; description?: string; createdBy: string }) {
    const folder = this.folderRepo.create(data);
    return this.folderRepo.save(folder);
  }

  async remove(id: string) {
    const folder = await this.findOne(id);
    return this.folderRepo.remove(folder);
  }

  /** Thêm file metadata vào thư mục */
  async addFile(
    folderId: string,
    data: { name: string; type: string; size?: string; url?: string; fileKey?: string },
  ) {
    await this.findOne(folderId); // validate exists
    const file = this.fileRepo.create({ ...data, folderId });
    return this.fileRepo.save(file);
  }

  async removeFile(folderId: string, fileId: string, uploadsService?: UploadsService) {
    const file = await this.fileRepo.findOne({
      where: { id: fileId, folderId },
    });
    if (!file) throw new NotFoundException('Không tìm thấy file');

    // Xóa file trên MinIO nếu có fileKey
    if (file.fileKey && uploadsService) {
      try {
        await uploadsService.deleteFile(file.fileKey);
      } catch (e) {
        // Không dừng lại nếu MinIO fail
        console.warn('MinIO delete failed:', e.message);
      }
    }

    return this.fileRepo.remove(file);
  }
}
