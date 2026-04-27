import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMaterialSizeDto {
  @IsUUID()
  materialId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  size: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  barcode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;
}

export class UpdateMaterialSizeDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  barcode?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @Transform(({ value }) => (value === 'true' || value === true ? true : false))
  isActive?: boolean;
}

export class BulkCreateMaterialSizeDto {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  sizes: string[];
}
