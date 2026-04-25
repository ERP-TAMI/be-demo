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
  Request,
} from '@nestjs/common';
import { StyleProductionDocsService } from './style-production-docs.service.js';
import { ProductionDocStatus } from './entities/style-production-doc.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('styles/:styleId/production-docs')
export class StyleProductionDocsController {
  constructor(private readonly service: StyleProductionDocsService) {}

  @Get()
  findAll(@Param('styleId', ParseUUIDPipe) styleId: string) {
    return this.service.findByStyleId(styleId);
  }

  @Get(':docId')
  findOne(
    @Param('styleId', ParseUUIDPipe) styleId: string,
    @Param('docId', ParseUUIDPipe) docId: string,
  ) {
    return this.service.findOne(docId);
  }

  @Post()
  create(
    @Param('styleId', ParseUUIDPipe) styleId: string,
    @Body() body: { name: string; description?: string },
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.create(styleId, {
      ...body,
      createdBy: req.user?.email ?? 'system',
    });
  }

  @Patch(':docId')
  update(
    @Param('styleId', ParseUUIDPipe) styleId: string,
    @Param('docId', ParseUUIDPipe) docId: string,
    @Body() body: any,
  ) {
    return this.service.update(docId, body);
  }

  @Patch(':docId/status')
  updateStatus(
    @Param('styleId', ParseUUIDPipe) styleId: string,
    @Param('docId', ParseUUIDPipe) docId: string,
    @Body('status') status: ProductionDocStatus,
  ) {
    return this.service.updateStatus(docId, status);
  }

  @Delete(':docId')
  remove(
    @Param('styleId', ParseUUIDPipe) styleId: string,
    @Param('docId', ParseUUIDPipe) docId: string,
  ) {
    return this.service.remove(docId);
  }
}
