import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { StylesService } from './styles.service.js';
import { StyleAs3bService } from './style-as3b.service.js';
import { CreateStyleDto } from './dto/create-style.dto.js';
import { UpdateStyleDto } from './dto/update-style.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { StyleStatus } from './entities/style.entity';

@UseGuards(JwtAuthGuard)
@Controller('styles')
export class StylesController {
  constructor(
    private readonly service: StylesService,
    private readonly as3bService: StyleAs3bService,
  ) {}

  @Get()
  findAll(
    @Query('status') status?: StyleStatus,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({ status, category, search });
  }

  @Get('code/:styleCode')
  findByCode(@Param('styleCode') styleCode: string) {
    return this.service.findByCode(styleCode);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(
    @Body() body: CreateStyleDto,
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.create(body, req.user?.email ?? 'system');
  }

  @Post('from-documents')
  createFromDocuments(
    @Body()
    body: {
      styleCode: string;
      styleName: string;
      category?: string;
      description?: string;
      documentIds: string[];
    },
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.createFromDocuments(body, req.user?.email ?? 'system');
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateStyleDto,
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.update(id, body, req.user?.email ?? 'system');
  }

  @Post(':id/documents')
  assignDocuments(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('documentIds') documentIds: string[],
  ) {
    return this.service.assignDocuments(id, documentIds);
  }

  @Patch(':id/archive')
  archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.archive(id);
  }

  @Post(':id/clone')
  clone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('newStyleCode') newStyleCode: string,
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.clone(id, newStyleCode, req.user?.email ?? 'system');
  }

  @Get(':id/colors')
  getColors(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getColors(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Get(':id/as3b')
  getAS3B(@Param('id', ParseUUIDPipe) id: string) {
    return this.as3bService.findByStyleId(id);
  }

  @Get(':id/as3b/export-template')
  async exportAS3BTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.service.exportAs3bTemplate(id);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
    res.send(buffer);
  }

  @Put(':id/as3b')
  replaceAS3B(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body:
      | Array<{
          stageId?: string;
          stepName: string;
          description?: string;
          timePerPc: number;
          ssv: number;
          targetTotal?: number;
          note?: string;
          orderIndex: number;
        }>
      | {
          as3bCmBaseDays?: number;
          as3bSteps?: Array<{
            stageId?: string;
            stepName: string;
            description?: string;
            timePerPc: number;
            ssv: number;
            targetTotal?: number;
            note?: string;
            orderIndex: number;
          }>;
        },
    @Request() req: { user?: { email: string } },
  ) {
    const steps = Array.isArray(body) ? body : (body?.as3bSteps ?? []);
    const as3bCmBaseDays = Array.isArray(body)
      ? undefined
      : body?.as3bCmBaseDays;

    return this.as3bService
      .createMany(id, steps, as3bCmBaseDays)
      .then(() =>
        this.service.logActionIfAvailable(
          id,
          'STYLE_AS3B_UPDATED',
          `Updated AS3B process table (${steps.length} steps)`,
          req.user?.email ?? 'system',
        ),
      )
      .then(() => this.as3bService.findByStyleId(id));
  }

  @Get(':id/logs')
  getLogs(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getLogs(id);
  }

  @Get(':id/sample')
  getSample(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getSampleForStyle(id);
  }

  @Post(':id/sample')
  createOrReplaceSample(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      description?: string;
      images?: string[];
      dateTime?: string;
      internalNote?: string;
    },
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.createOrReplaceSampleVersion(
      id,
      body,
      req.user?.email ?? 'system',
    );
  }
}
