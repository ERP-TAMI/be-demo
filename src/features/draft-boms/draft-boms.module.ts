import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DraftBomsController } from './draft-boms.controller.js';
import { DraftBomsService } from './draft-boms.service.js';
import { DraftBom } from './entities/draft-bom.entity.js';
import { DraftBomLine } from './entities/draft-bom-line.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([DraftBom, DraftBomLine])],
  controllers: [DraftBomsController],
  providers: [DraftBomsService],
  exports: [DraftBomsService],
})
export class DraftBomsModule {}
