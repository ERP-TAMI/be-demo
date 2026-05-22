import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MastersController } from './masters.controller.js';
import { MastersService } from './masters.service.js';
import { SizeChartsController } from './size-charts.controller.js';
import { SizeChartsService } from './size-charts.service.js';
import { Material } from './entities/material.entity';
import { MaterialGroup } from './entities/material-group.entity';
import { Stage } from './entities/stage.entity';
import { Workshop } from './entities/workshop.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { MaterialSize } from './entities/material-size.entity';
import { StageGroup } from './entities/stage-group.entity';
import { StageGroupItem } from './entities/stage-group-item.entity';
import { SizeChart } from './entities/size-chart.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Material,
      MaterialGroup,
      Stage,
      Workshop,
      StockMovement,
      MaterialSize,
      StageGroup,
      StageGroupItem,
      SizeChart,
    ]),
  ],
  controllers: [MastersController, SizeChartsController],
  providers: [MastersService, SizeChartsService],
  exports: [MastersService, SizeChartsService],
})
export class MastersModule {}
