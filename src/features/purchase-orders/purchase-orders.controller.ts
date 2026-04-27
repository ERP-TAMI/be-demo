import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service.js';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from './dto/purchase-order.dto.js';
import { PoStatus } from './entities/purchase-order.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly service: PurchaseOrdersService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/files')
  findFiles(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findFiles(id);
  }

  @Get(':id/logs')
  findLogs(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findLogs(id);
  }

  @Post()
  create(
    @Body() dto: CreatePurchaseOrderDto,
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.create(dto, req.user?.email ?? 'system');
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseOrderDto,
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.update(id, dto, req.user?.email ?? 'system');
  }

  @Post(':id/files')
  addFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { fileKey: string; originalName: string; label?: string },
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.addFile(id, req.user?.email ?? 'system', body);
  }

  @Delete(':id/files/:fileId')
  removeFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.removeFile(id, fileId, req.user?.email ?? 'system');
  }

  @Post(':id/finalize')
  finalize(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.finalizePo(id, req.user?.email ?? 'system');
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: PoStatus },
    @Request() req: { user?: { email: string } },
  ) {
    return this.service.updateStatus(
      id,
      body.status,
      req.user?.email ?? 'system',
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
