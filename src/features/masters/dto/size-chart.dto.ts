import { IsString, IsArray, IsOptional, MaxLength } from 'class-validator';

export class CreateSizeChartDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsArray()
  @IsString({ each: true })
  sizes: string[];
}

export class UpdateSizeChartDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[];
}
