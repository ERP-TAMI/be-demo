import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SamplesController } from './samples.controller.js';
import { SamplesService } from './samples.service.js';
import { Sample } from './entities/sample.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sample])],
  controllers: [SamplesController],
  providers: [SamplesService],
  exports: [SamplesService],
})
export class SamplesModule {}
