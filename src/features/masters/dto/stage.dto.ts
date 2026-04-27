import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { StageStatus } from '../entities/stage.entity';

export class CreateStageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  stageCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  stageName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  smv?: number;

  @IsOptional()
  @IsEnum(StageStatus)
  status?: StageStatus;
}

export class UpdateStageDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  stageName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  smv?: number;

  @IsOptional()
  @IsEnum(StageStatus)
  status?: StageStatus;
}
