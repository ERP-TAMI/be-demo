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
import { MasterPosService } from './master-pos.service.js';
import {
  CreateMasterPoDto,
  UpdateMasterPoDto,
  LinkPOLineDto,
  LinkMultiplePOLinesDto,
} from './dto/create-master-po.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { MasterPoStatus } from './entities/master-po.entity.js';

@UseGuards(JwtAuthGuard)
@Controller('master-pos')
export class MasterPosController {
  constructor(private readonly service: MasterPosService) {}

  @Get()
  findAll(
    @Query('status') status?: MasterPoStatus,
    @Query('shippingMonth') shippingMonth?: string,
  ) {
    return this.service.findAll({ status, shippingMonth });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/unlinked-lines')
  getUnlinkedPOLines(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getUnlinkedPOLines(id);
  }

  @Get(':id/summary')
  getSummary(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getSummary(id);
  }

  @Post()
  create(
    @Body() body: CreateMasterPoDto,
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.create(body, req.user?.email ?? 'system');
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMasterPoDto,
  ) {
    return this.service.update(id, body);
  }

  @Patch(':id/confirm')
  confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.confirm(id);
  }

  @Post(':id/link-lines')
  linkPOLine(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: LinkPOLineDto,
  ) {
    return this.service.linkPOLine(id, body);
  }

  @Post(':id/link-multiple-lines')
  linkMultiplePOLines(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: LinkMultiplePOLinesDto,
  ) {
    return this.service.linkMultiplePOLines(id, body.poLineIds);
  }

  @Delete(':id/link-lines/:poLineId')
  unlinkPOLine(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('poLineId', ParseUUIDPipe) poLineId: string,
  ) {
    return this.service.unlinkPOLine(id, poLineId);
  }

  @Post(':id/finalize')
  finalize(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.finalize(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
