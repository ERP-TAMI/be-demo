import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { StylesController } from './styles.controller.js';
import { StylesService } from './styles.service.js';
import { StyleAs3bController } from './style-as3b.controller.js';
import { StyleAs3bService } from './style-as3b.service.js';
import { StyleProductionDocsController } from './style-production-docs.controller.js';
import { StyleProductionDocsService } from './style-production-docs.service.js';
import { Style } from './entities/style.entity';
import { StyleAs3bStep } from './entities/style-as3b-step.entity';
import { StyleVersionLog } from './entities/style-version-log.entity';
import { StyleProductionDoc } from './entities/style-production-doc.entity';
import { Color } from '../colors/entities/color.entity';
import { Sample } from '../samples/entities/sample.entity';
import { DocFile } from '../doc-folders/entities/doc-file.entity';
import { UploadsModule } from '../uploads/uploads.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Style, StyleAs3bStep, StyleVersionLog, StyleProductionDoc, Color, Sample, DocFile]),
    MulterModule.register({ dest: './uploads' }),
    UploadsModule,
  ],
  controllers: [StylesController, StyleAs3bController, StyleProductionDocsController],
  providers: [StylesService, StyleAs3bService, StyleProductionDocsService],
  exports: [StylesService, StyleAs3bService, StyleProductionDocsService],
})
export class StylesModule {}
