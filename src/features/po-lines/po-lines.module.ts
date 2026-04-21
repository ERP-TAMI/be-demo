import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoLinesController } from './po-lines.controller.js';
import { PoLinesService } from './po-lines.service.js';
import { PoLine } from './entities/po-line.entity.js';
import { LineColor } from './entities/line-color.entity.js';
import { LineColorSize } from './entities/line-color-size.entity.js';
import { LineFile } from './entities/line-file.entity.js';
import { LineAs3bStep } from './entities/line-as3b-step.entity.js';
import { LineSample } from './entities/line-sample.entity.js';
import { SampleColorImage } from './entities/sample-color-image.entity.js';
import { LineMappedFile } from './entities/line-mapped-file.entity.js';
import { PoVersionLog } from '../purchase-orders/entities/po-version-log.entity.js';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PoLine,
      LineColor,
      LineColorSize,
      LineFile,
      LineAs3bStep,
      LineSample,
      SampleColorImage,
      LineMappedFile,
      PoVersionLog,
      PurchaseOrder,
    ]),
  ],
  controllers: [PoLinesController],
  providers: [PoLinesService],
  exports: [PoLinesService],
})
export class PoLinesModule {}
