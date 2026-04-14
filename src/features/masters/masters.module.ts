import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MastersController } from './masters.controller.js';
import { MastersService } from './masters.service.js';
import { Material } from './entities/material.entity.js';
import { Stage } from './entities/stage.entity.js';
import { Workshop } from './entities/workshop.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Material, Stage, Workshop])],
  controllers: [MastersController],
  providers: [MastersService],
  exports: [MastersService],
})
export class MastersModule {}
