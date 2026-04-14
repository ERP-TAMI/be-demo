import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { PoStatus } from '../entities/purchase-order.entity.js';

export class CreatePurchaseOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  poCode: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  customerPoCode?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  customer: string;

  @IsOptional()
  @IsDateString()
  receivedDate?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(PoStatus)
  status?: PoStatus;
}

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  customerPoCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  customer?: string;

  @IsOptional()
  @IsDateString()
  receivedDate?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(PoStatus)
  status?: PoStatus;
}

export class FinalizePoDto {
  @IsOptional()
  @IsString()
  note?: string;
}
