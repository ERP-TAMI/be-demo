import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ColorsService } from './colors.service.js';
import { CreateColorDto } from './dto/create-color.dto.js';
import { UpdateColorDto } from './dto/update-color.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ColorStatus } from './entities/color.entity.js';

@UseGuards(JwtAuthGuard)
@Controller('colors')
export class ColorsController {
  constructor(private readonly service: ColorsService) {}

  @Get()
  findAll(
    @Query('styleId') styleId?: string,
    @Query('status') status?: ColorStatus,
  ) {
    return this.service.findAll({ styleId, status });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post('style/:styleId')
  create(
    @Request() req: { user?: { email: string } },
    @Param('styleId', ParseUUIDPipe) styleId: string,
    @Body() body: CreateColorDto,
  ) {
    return this.service.create(styleId, body, req.user?.email ?? 'system');
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateColorDto,
  ) {
    return this.service.update(id, body);
  }

  @Patch(':id/activate')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.activate(id);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deactivate(id);
  }

  @Post(':id/clone')
  clone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('newColorName') newColorName: string,
    @Body('targetStyleId') targetStyleId?: string,
  ) {
    return this.service.clone(id, newColorName, targetStyleId);
  }

  @Patch(':id/link-sample')
  linkToSample(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('sampleId') sampleId: string,
  ) {
    return this.service.linkToSample(id, sampleId);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
