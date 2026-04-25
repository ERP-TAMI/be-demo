import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterPosController } from './master-pos.controller.js';
import { MasterPosService } from './master-pos.service.js';
import { MasterPo } from './entities/master-po.entity.js';
import { MasterPoLine } from './entities/master-po-line.entity.js';
import { PoLine } from '../po-lines/entities/po-line.entity.js';
import { Bom } from '../boms/entities/bom.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([MasterPo, MasterPoLine, PoLine, Bom]),
  ],
  controllers: [MasterPosController],
  providers: [MasterPosService],
  exports: [MasterPosService],
})
export class MasterPosModule {}
