import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller.js';
import { UploadsService } from './uploads.service.js';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService], // Export so PO/Lines modules can use it
})
export class UploadsModule {}
