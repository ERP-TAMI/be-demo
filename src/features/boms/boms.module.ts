import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BomsController } from './boms.controller.js';
import { BomsService } from './boms.service.js';
import { Bom } from './entities/bom.entity.js';
import { BomLine } from './entities/bom-line.entity.js';
import { PoVersionLog } from '../purchase-orders/entities/po-version-log.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Bom, BomLine, PoVersionLog])],
  controllers: [BomsController],
  providers: [BomsService],
  exports: [BomsService],
})
export class BomsModule {}
