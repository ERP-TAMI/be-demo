import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocFoldersController } from './doc-folders.controller.js';
import { DocFoldersService } from './doc-folders.service.js';
import { DocFolder } from './entities/doc-folder.entity.js';
import { DocFile } from './entities/doc-file.entity.js';
import { UploadsModule } from '../uploads/uploads.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([DocFolder, DocFile]), UploadsModule],
  controllers: [DocFoldersController],
  providers: [DocFoldersService],
  exports: [DocFoldersService],
})
export class DocFoldersModule {}
