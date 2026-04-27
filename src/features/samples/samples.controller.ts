import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SamplesService } from './samples.service.js';
import {
  CreateSampleDto,
  UpdateSampleDto,
} from './dto/create-sample.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { SampleType, SampleStatus } from './entities/sample.entity';

@UseGuards(JwtAuthGuard)
@Controller('samples')
export class SamplesController {
  constructor(private readonly service: SamplesService) {}

  @Get()
  findAll(
    @Query('sampleType') sampleType?: SampleType,
    @Query('status') status?: SampleStatus,
    @Query('styleId') styleId?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({ sampleType, status, styleId, search });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Get('code/:sampleCode')
  findByCode(@Param('sampleCode') sampleCode: string) {
    return this.service.findByCode(sampleCode);
  }

  @Post()
  create(
    @Body() body: CreateSampleDto,
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.create(body, req.user?.email ?? 'system');
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateSampleDto,
  ) {
    return this.service.update(id, body);
  }

  @Patch(':id/analyze')
  analyze(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('analysisResult') analysisResult: string,
  ) {
    return this.service.analyze(id, analysisResult);
  }

  @Patch(':id/mark-analyzed')
  markAnalyzed(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.markAnalyzed(id);
  }

  @Patch(':id/approve')
  approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.approve(id);
  }

  @Post(':id/files')
  addFiles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('files')
    files: { name: string; url: string; size: number }[],
  ) {
    return this.service.addFiles(id, files);
  }

  @Post(':id/images')
  addImages(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('images') images: string[],
  ) {
    return this.service.addImages(id, images);
  }

  @Patch(':id/link-style')
  linkToStyle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('styleId') styleId: string,
  ) {
    return this.service.linkToStyle(id, styleId);
  }

  @Patch(':id/link-color')
  linkToColor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('colorId') colorId: string,
  ) {
    return this.service.linkToColor(id, colorId);
  }
}
