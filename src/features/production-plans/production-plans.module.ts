import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionPlansController } from './production-plans.controller.js';
import { ProductionPlansService } from './production-plans.service.js';
import { DynamicTargetEngineService } from './dynamic-target.engine.js';
import { PlansSseService } from './plans-sse.service.js';
import { ProductionPlan } from './entities/production-plan.entity.js';
import { DailyPlan } from './entities/daily-plan.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([ProductionPlan, DailyPlan])],
  controllers: [ProductionPlansController],
  providers: [
    ProductionPlansService,
    DynamicTargetEngineService,
    PlansSseService,
  ],
  exports: [ProductionPlansService],
})
export class ProductionPlansModule {}
