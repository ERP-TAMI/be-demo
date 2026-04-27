import { IsString, IsOptional, IsEnum } from 'class-validator';
import { StyleStatus } from '../entities/style.entity';

export class UpdateStyleDto {
  @IsString()
  @IsOptional()
  styleName?: string;

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
