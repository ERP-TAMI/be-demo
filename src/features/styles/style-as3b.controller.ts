import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { StyleAs3bService } from './style-as3b.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('styles/:styleId/as3b')
export class StyleAs3bController {
  constructor(private readonly service: StyleAs3bService) {}

  @Get()
  findAll(@Param('styleId', ParseUUIDPipe) styleId: string) {
    return this.service.findByStyleId(styleId);
  }

  @Post()
  create(
    @Param('styleId', ParseUUIDPipe) styleId: string,
    @Body()
    body: {
      stageId?: string;
      stepName: string;
      description?: string;
      timePerPc: number;
      ssv: number;
      orderIndex?: number;
    },
  ) {
    return this.service.create(styleId, body);
  }

  @Put()
  replaceAll(
    @Param('styleId', ParseUUIDPipe) styleId: string,
    @Body()
    body: Array<{
      stageId?: string;
      stepName: string;
      description?: string;
      timePerPc: number;
      ssv: number;
      orderIndex: number;
    }>,
  ) {
    return this.service.createMany(styleId, body);
  }

  @Patch(':stepId')
  update(
    @Param('styleId', ParseUUIDPipe) styleId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Body()
    body: {
      stageId?: string;
      stepName?: string;
      description?: string;
      timePerPc?: number;
      ssv?: number;
      orderIndex?: number;
    },
  ) {
    return this.service.update(stepId, body);
  }

  @Delete(':stepId')
  remove(
    @Param('styleId', ParseUUIDPipe) styleId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
  ) {
    return this.service.remove(stepId);
  }

  @Put('reorder')
  reorder(
    @Param('styleId', ParseUUIDPipe) styleId: string,
    @Body() body: { orderedIds: string[] },
  ) {
    return this.service.reorder(styleId, body.orderedIds);
  }
}
