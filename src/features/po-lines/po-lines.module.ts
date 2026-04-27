import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoLinesController } from './po-lines.controller.js';
import { PoLinesService } from './po-lines.service.js';
import { ColorCardService } from './color-card.service.js';
import { PoLine } from './entities/po-line.entity';
import { LineColor } from './entities/line-color.entity';
import { LineColorSize } from './entities/line-color-size.entity';
import { LineFile } from './entities/line-file.entity';
import { LineAs3bStep } from './entities/line-as3b-step.entity';
import { LineSample } from './entities/line-sample.entity';
import { SampleColorImage } from './entities/sample-color-image.entity';
import { LineMappedFile } from './entities/line-mapped-file.entity';
import { LineColorCard } from './entities/line-color-card.entity';
import { PoVersionLog } from '../purchase-orders/entities/po-version-log.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { UploadsModule } from '../uploads/uploads.module.js';

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
      LineColorCard,
      PoVersionLog,
      PurchaseOrder,
    ]),
    UploadsModule,
  ],
  controllers: [PoLinesController],
  providers: [PoLinesService, ColorCardService],
  exports: [PoLinesService],
})
export class PoLinesModule {}
