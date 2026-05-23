import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrdersController } from './purchase-orders.controller.js';
import { PurchaseOrdersService } from './purchase-orders.service.js';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PoFile } from './entities/po-file.entity';
import { PoVersionLog } from './entities/po-version-log.entity';
import { UploadsModule } from '../uploads/uploads.module.js';
import { LineMappedFile } from '../po-lines/entities/line-mapped-file.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseOrder, PoFile, PoVersionLog, LineMappedFile]),
    UploadsModule,
  ],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
