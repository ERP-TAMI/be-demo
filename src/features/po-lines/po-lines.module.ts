import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoLinesController } from './po-lines.controller.js';
import { PoLinesService } from './po-lines.service.js';
import { ColorCardService } from './color-card.service.js';
import { PoLine } from './entities/po-line.entity';
import { PoLineVersion } from './entities/po-line-version.entity';
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
import { StyleAs3bStep } from '../styles/entities/style-as3b-step.entity';
import { Style } from '../styles/entities/style.entity';
import { Bom } from '../boms/entities/bom.entity';
import { UploadsModule } from '../uploads/uploads.module.js';
import { StyleProductionDoc } from '../styles/entities/style-production-doc.entity.js';
import { ProductionDoc } from '../production-docs/entities/production-doc.entity.js';
import { ProductionDocSizeRow } from '../production-docs/entities/production-doc-size-row.entity.js';
import { ProductionDocSection } from '../production-docs/entities/production-doc-section.entity.js';
import { Sample } from '../samples/entities/sample.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PoLine,
      PoLineVersion, // Version control snapshots
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
      StyleAs3bStep, // Để clone AS3B khi tạo PoLine
      Style, // Để validate Status=Active & kế thừa thông tin
      Bom, // Để tạo BOM Draft khi lock PoLine
      StyleProductionDoc,
      ProductionDoc,
      ProductionDocSizeRow,
      ProductionDocSection,
      Sample,
    ]),
    UploadsModule,
  ],
  controllers: [PoLinesController],
  providers: [PoLinesService, ColorCardService],
  exports: [PoLinesService],
})
export class PoLinesModule {}
