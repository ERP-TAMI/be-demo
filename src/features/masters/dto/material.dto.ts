import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';
import { MaterialStatus } from '../entities/material.entity';
import { StockMovementType } from '../entities/stock-movement.entity';

export class CreateMaterialDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  materialCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  materialName: string;

  @IsOptional()
  @IsUUID()
  materialGroupId?: string;

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

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;
}

export class UpdateMaterialDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  materialCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  materialName?: string;

  @IsOptional()
  @IsUUID()
  materialGroupId?: string;

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

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;
}

export class AdjustStockDto {
  @IsNumber()
  adjustment: number;

  @IsEnum(StockMovementType)
  movementType: StockMovementType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
