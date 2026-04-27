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
import { DraftBomsService } from './draft-boms.service.js';
import {
  CreateDraftBomDto,
  UpdateDraftBomDto,
  DraftBomLineDto,
} from './dto/create-draft-bom.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { DraftBomStatus } from './entities/draft-bom.entity';

@UseGuards(JwtAuthGuard)
@Controller('draft-boms')
export class DraftBomsController {
  constructor(private readonly service: DraftBomsService) {}

  @Get()
  findAll(
    @Query('styleId') styleId?: string,
    @Query('colorId') colorId?: string,
    @Query('status') status?: DraftBomStatus,
  ) {
    return this.service.findAll({ styleId, colorId, status });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(
    @Body() body: CreateDraftBomDto,
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.create(body, req.user?.email ?? 'system');
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateDraftBomDto,
  ) {
    return this.service.update(id, body);
  }

  @Patch(':id/submit')
  submit(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.submit(id);
  }

  @Patch(':id/approve')
  approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.approve(id);
  }

  @Post(':id/lines')
  addLine(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: DraftBomLineDto,
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.addLine(id, body, req.user?.email ?? 'system');
  }

  @Patch(':id/lines/:lineId')
  updateLine(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('lineId', ParseUUIDPipe) lineId: string,
    @Body() body: Partial<DraftBomLineDto>,
  ) {
    return this.service.updateLine(id, lineId, body);
  }

  @Delete(':id/lines/:lineId')
  removeLine(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('lineId', ParseUUIDPipe) lineId: string,
  ) {
    return this.service.removeLine(id, lineId);
  }

  @Post(':id/new-version')
  createNewVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.createNewVersion(id, req.user?.email ?? 'system');
  }

  @Post('from-style/:styleId')
  createFromStyle(
    @Request() req: { user?: { email: string } },
    @Param('styleId', ParseUUIDPipe) styleId: string,
    @Body('colorId') colorId?: string,
  ) {
    return this.service.createFromStyle(
      styleId,
      colorId,
      req.user?.email ?? 'system',
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
