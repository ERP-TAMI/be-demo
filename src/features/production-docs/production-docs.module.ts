import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionDocsController } from './production-docs.controller.js';
import { ProductionDocsService } from './production-docs.service.js';
import { ProductionDoc } from './entities/production-doc.entity';
import { ProductionDocSizeRow } from './entities/production-doc-size-row.entity';
import { ProductionDocSection } from './entities/production-doc-section.entity';
import { UploadsModule } from '../uploads/uploads.module.js';
import { PoLine } from '../po-lines/entities/po-line.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductionDoc,
      ProductionDocSizeRow,
      ProductionDocSection,
      PoLine,
      PurchaseOrder,
    ]),
    UploadsModule,
  ],
  controllers: [ProductionDocsController],
  providers: [ProductionDocsService],
})
export class ProductionDocsModule {}
