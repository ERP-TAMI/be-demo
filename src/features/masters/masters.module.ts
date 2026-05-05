import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MastersController } from './masters.controller.js';
import { MastersService } from './masters.service.js';
import { Material } from './entities/material.entity';
import { MaterialGroup } from './entities/material-group.entity';
import { Stage } from './entities/stage.entity';
import { Workshop } from './entities/workshop.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { MaterialSize } from './entities/material-size.entity';
import { StageGroup } from './entities/stage-group.entity';
import { StageGroupItem } from './entities/stage-group-item.entity';

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
    ]),
  ],
  controllers: [MastersController],
  providers: [MastersService],
  exports: [MastersService],
})
export class MastersModule {}
