import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { MaterialGroup, MaterialStatus } from '../entities/material.entity.js';

export class CreateMaterialDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  materialCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  materialName: string;

  @IsEnum(MaterialGroup)
  materialGroup: MaterialGroup;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  unit: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultYieldPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lastUnitCost?: number;

  @IsOptional()
  @IsEnum(MaterialStatus)
  status?: MaterialStatus;
}

export class UpdateMaterialDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  materialName?: string;

  @IsOptional()
  @IsEnum(MaterialGroup)
  materialGroup?: MaterialGroup;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultYieldPct?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lastUnitCost?: number;

  @IsOptional()
  @IsEnum(MaterialStatus)
  status?: MaterialStatus;
}
