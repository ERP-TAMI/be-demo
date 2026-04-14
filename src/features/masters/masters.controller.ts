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
import { CreateMaterialDto, UpdateMaterialDto } from './dto/material.dto.js';
import { CreateStageDto, UpdateStageDto } from './dto/stage.dto.js';
import { CreateWorkshopDto, UpdateWorkshopDto } from './dto/workshop.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

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

  @Delete('materials/:id')
  removeMaterial(@Param('id', ParseUUIDPipe) id: string) {
    return this.mastersService.removeMaterial(id);
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
}
