import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrdersController } from './purchase-orders.controller.js';
import { PurchaseOrdersService } from './purchase-orders.service.js';
import { PurchaseOrder } from './entities/purchase-order.entity.js';
import { PoFile } from './entities/po-file.entity.js';
import { PoVersionLog } from './entities/po-version-log.entity.js';
import { UploadsModule } from '../uploads/uploads.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseOrder, PoFile, PoVersionLog]),
    UploadsModule,
  ],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
