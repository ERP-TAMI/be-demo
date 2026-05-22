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
import { SizeChartsService } from './size-charts.service.js';
import { CreateSizeChartDto, UpdateSizeChartDto } from './dto/size-chart.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('size-charts')
export class SizeChartsController {
  constructor(private readonly sizeChartsService: SizeChartsService) {}

  @Get()
  findAll() {
    return this.sizeChartsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateSizeChartDto) {
    return this.sizeChartsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSizeChartDto,
  ) {
    return this.sizeChartsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.sizeChartsService.remove(id);
  }

  @Patch(':id/toggle-status')
  toggleStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.sizeChartsService.toggleStatus(id);
  }
}
