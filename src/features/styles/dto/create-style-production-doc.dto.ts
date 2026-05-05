import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UpdateStyleProductionDocDto } from './update-style-production-doc.dto.js';

export class CreateStyleProductionDocDto extends UpdateStyleProductionDocDto {
  @IsString()
  @IsNotEmpty()
  declare name: string;

  @IsOptional()
  @IsString()
  declare description?: string;
}
