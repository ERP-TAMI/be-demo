import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ColorStatus } from '../entities/color.entity.js';

export class UpdateColorDto {
  @IsString()
  @IsOptional()
  colorName?: string;

  @IsString()
  @IsOptional()
  colorImage?: string;

  @IsString()
  @IsOptional()
  linkedSampleId?: string;

  @IsEnum(ColorStatus)
  @IsOptional()
  status?: ColorStatus;
}
