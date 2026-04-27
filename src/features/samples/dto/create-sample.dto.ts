import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { SampleType, SampleStatus } from '../entities/sample.entity';

export class CreateSampleDto {
  @IsString()
  sampleCode: string;

  @IsEnum(SampleType)
  @IsOptional()
  sampleType?: SampleType;

  @IsString()
  @IsOptional()
  styleId?: string;

  @IsString()
  @IsOptional()
  colorId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  dateTime?: string;

  @IsString()
  @IsOptional()
  internalNote?: string;

  @IsArray()
  @IsOptional()
  files?: { name: string; url: string; size: number }[];

  @IsArray()
  @IsOptional()
  images?: string[];
}

export class UpdateSampleDto {
  @IsEnum(SampleType)
  @IsOptional()
  sampleType?: SampleType;

  @IsString()
  @IsOptional()
  styleId?: string;

  @IsString()
  @IsOptional()
  colorId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  analysisResult?: string;

  @IsString()
  @IsOptional()
  dateTime?: string;

  @IsString()
  @IsOptional()
  internalNote?: string;

  @IsArray()
  @IsOptional()
  files?: { name: string; url: string; size: number }[];

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsEnum(SampleStatus)
  @IsOptional()
  status?: SampleStatus;
}
