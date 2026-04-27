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
} from '@nestjs/common';
import { MastersService } from './masters.service.js';
import { CreateMaterialDto, UpdateMaterialDto, AdjustStockDto } from './dto/material.dto.js';
import { CreateMaterialSizeDto, UpdateMaterialSizeDto, BulkCreateMaterialSizeDto } from './dto/material-size.dto.js';
import { CreateStageDto, UpdateStageDto } from './dto/stage.dto.js';
import { CreateWorkshopDto, UpdateWorkshopDto } from './dto/workshop.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@UseGuards(JwtAuthGuard)
@Controller('masters')
export class MastersController {
  constructor(private readonly mastersService: MastersService) {}

  // ─── Materials ───────────────────────────────────────────────────────────────

  @Get('materials')
  findAllMaterials() {
    return this.mastersService.findAllMaterials();
  }

  @Get('materials/:id')
  findOneMaterial(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.findOneMaterial(id);
  }

  @Post('materials')
  createMaterial(@Body() dto: CreateMaterialDto) {
    return this.mastersService.createMaterial(dto);
  }

  @Patch('materials/:id')
  updateMaterial(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaterialDto,
  ) {
    return this.mastersService.updateMaterial(id, dto);
  }

  @Patch('materials/:id/stock')
  adjustStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.mastersService.adjustStock(id, dto, userId);
  }

  @Get('materials/low-stock')
  findLowStockMaterials() {
    return this.mastersService.findLowStockMaterials();
  }

  @Get('materials/:id/movements')
  getStockMovements(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.getStockMovements(id);
  }

  @Delete('materials/:id')
  removeMaterial(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.removeMaterial(id);
  }

  // ─── Material Groups ─────────────────────────────────────────────────────────

  @Get('material-groups')
  findAllMaterialGroups() {
    return this.mastersService.findAllMaterialGroups();
  }

  @Get('material-groups/:id')
  findOneMaterialGroup(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.findOneMaterialGroup(id);
  }

  @Post('material-groups')
  createMaterialGroup(@Body('name') name: string) {
    return this.mastersService.createMaterialGroup(name);
  }

  @Patch('material-groups/:id')
  updateMaterialGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('name') name: string,
  ) {
    return this.mastersService.updateMaterialGroup(id, name);
  }

  @Delete('material-groups/:id')
  removeMaterialGroup(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.removeMaterialGroup(id);
  }

  // ─── Stages ──────────────────────────────────────────────────────────────────

  @Get('stages')
  findAllStages() {
    return this.mastersService.findAllStages();
  }

  @Get('stages/:id')
  findOneStage(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.findOneStage(id);
  }

  @Post('stages')
  createStage(@Body() dto: CreateStageDto) {
    return this.mastersService.createStage(dto);
  }

  @Patch('stages/:id')
  updateStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStageDto,
  ) {
    return this.mastersService.updateStage(id, dto);
  }

  @Delete('stages/:id')
  removeStage(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.removeStage(id);
  }

  // ─── Workshops ───────────────────────────────────────────────────────────────

  @Get('workshops')
  findAllWorkshops() {
    return this.mastersService.findAllWorkshops();
  }

  @Get('workshops/:id')
  findOneWorkshop(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.findOneWorkshop(id);
  }

  @Post('workshops')
  createWorkshop(@Body() dto: CreateWorkshopDto) {
    return this.mastersService.createWorkshop(dto);
  }

  @Patch('workshops/:id')
  updateWorkshop(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkshopDto,
  ) {
    return this.mastersService.updateWorkshop(id, dto);
  }

  @Delete('workshops/:id')
  removeWorkshop(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.removeWorkshop(id);
  }

  // ─── Material Sizes ─────────────────────────────────────────────────────────

  @Get('materials/:materialId/sizes')
  findAllSizesByMaterial(@Param('materialId', ParseUUIDPipe) materialId: string) {
    return this.mastersService.findAllSizesByMaterial(materialId);
  }

  @Post('materials/:materialId/sizes')
  createMaterialSize(
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @Body() dto: CreateMaterialSizeDto,
  ) {
    return this.mastersService.createMaterialSize({ ...dto, materialId });
  }

  @Post('materials/:materialId/sizes/bulk')
  bulkCreateMaterialSizes(
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @Body() dto: BulkCreateMaterialSizeDto,
  ) {
    return this.mastersService.bulkCreateMaterialSizes(materialId, dto);
  }

  @Get('materials/:materialId/sizes/:id')
  getMaterialWithSizes(@Param('materialId', ParseUUIDPipe) materialId: string) {
    return this.mastersService.getMaterialWithSizes(materialId);
  }

  @Patch('materials/:materialId/sizes/:id')
  updateMaterialSize(
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaterialSizeDto,
  ) {
    return this.mastersService.updateMaterialSize(id, dto);
  }

  @Delete('materials/:materialId/sizes/:id')
  removeMaterialSize(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.removeMaterialSize(id);
  }
}
