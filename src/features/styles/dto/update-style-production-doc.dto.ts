import {
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StyleProductionDocSectionDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

export class StyleProductionDocSizeRowDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

export class UpdateStyleProductionDocDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: any; // ProductionDocStatus

  @IsOptional()
  @IsString()
  section1Description?: string;

  @IsOptional()
  @IsString()
  section1ImageUrl?: string;

  @IsOptional()
  @IsString()
  section2Accessories?: string;

  @IsOptional()
  @IsString()
  section3Notes?: string;

  @IsOptional()
  @IsString()
  section4CustomerFeedback?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StyleProductionDocSizeRowDto)
  sizeData?: StyleProductionDocSizeRowDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StyleProductionDocSectionDto)
  sections?: StyleProductionDocSectionDto[];

  @IsOptional()
  @IsArray()
  attachments?: any[];
}
