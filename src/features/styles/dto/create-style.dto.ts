import { IsString, IsOptional, IsEnum } from 'class-validator';
import { StyleStatus } from '../entities/style.entity.js';

export class CreateStyleDto {
  @IsString()
  styleCode: string;

  @IsString()
  styleName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  baseImage?: string;

  @IsEnum(StyleStatus)
  @IsOptional()
  status?: StyleStatus;
}
