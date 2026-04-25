import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { MasterPoStatus } from '../entities/master-po.entity.js';

export class CreateMasterPoDto {
  @IsString()
  masterPoCode: string;

  @IsString()
  @IsOptional()
  containerName?: string;

  @IsString()
  @IsOptional()
  shippingMonth?: string;

  @IsDateString()
  @IsOptional()
  estimatedShipDate?: string;
}

export class UpdateMasterPoDto {
  @IsString()
  @IsOptional()
  containerName?: string;

  @IsString()
  @IsOptional()
  shippingMonth?: string;

  @IsDateString()
  @IsOptional()
  estimatedShipDate?: string;

  @IsString()
  @IsOptional()
  status?: MasterPoStatus;
}

export class LinkPOLineDto {
  @IsString()
  poLineId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class LinkMultiplePOLinesDto {
  @IsString({ each: true })
  poLineIds: string[];
}
