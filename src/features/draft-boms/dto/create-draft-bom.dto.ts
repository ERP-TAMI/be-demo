import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';
import { DraftBomStatus } from '../entities/draft-bom.entity';

export class CreateDraftBomDto {
  @IsString()
  draftBomCode: string;

  @IsString()
  @IsOptional()
  styleId?: string;

  @IsString()
  @IsOptional()
  colorId?: string;

  @IsNumber()
  @IsOptional()
  version?: number;

  @IsNumber()
  @IsOptional()
  quotationPrice?: number;

  @IsArray()
  @IsOptional()
  lines?: Partial<DraftBomLineDto>;
}

export class UpdateDraftBomDto {
  @IsNumber()
  @IsOptional()
  version?: number;

  @IsNumber()
  @IsOptional()
  trimCost?: number;

  @IsNumber()
  @IsOptional()
  quotationPrice?: number;

  @IsString()
  @IsOptional()
  status?: DraftBomStatus;
}

export class DraftBomLineDto {
  @IsString()
  @IsOptional()
  masterMaterialId?: string;

  @IsString()
  materialName: string;

  @IsString()
  @IsOptional()
  materialGroup?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @IsOptional()
  consumption?: number;

  @IsNumber()
  @IsOptional()
  unitCost?: number;

  @IsNumber()
  @IsOptional()
  yieldPct?: number;
}
