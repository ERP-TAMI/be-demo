import { IsString, IsOptional } from 'class-validator';

export class CreateColorDto {
  @IsString()
  colorName: string;

  @IsString()
  @IsOptional()
  colorImage?: string;

  @IsString()
  @IsOptional()
  linkedSampleId?: string;
}
