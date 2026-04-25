import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StylesController } from './styles.controller.js';
import { StylesService } from './styles.service.js';
import { StyleAs3bController } from './style-as3b.controller.js';
import { StyleAs3bService } from './style-as3b.service.js';
import { StyleProductionDocsController } from './style-production-docs.controller.js';
import { StyleProductionDocsService } from './style-production-docs.service.js';
import { Style } from './entities/style.entity.js';
import { StyleAs3bStep } from './entities/style-as3b-step.entity.js';
import { StyleVersionLog } from './entities/style-version-log.entity.js';
import { StyleProductionDoc } from './entities/style-production-doc.entity.js';
import { Color } from '../colors/entities/color.entity.js';
import { Sample } from '../samples/entities/sample.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Style, StyleAs3bStep, StyleVersionLog, StyleProductionDoc, Color, Sample])],
  controllers: [StylesController, StyleAs3bController, StyleProductionDocsController],
  providers: [StylesService, StyleAs3bService, StyleProductionDocsService],
  exports: [StylesService, StyleAs3bService, StyleProductionDocsService],
})
export class StylesModule {}
