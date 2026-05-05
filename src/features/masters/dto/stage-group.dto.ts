import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StageGroupItemDto {
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  stageName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ssv?: number;

  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

export class CreateStageGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  groupCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  groupName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StageGroupItemDto)
  items?: StageGroupItemDto[];
}

export class UpdateStageGroupDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  groupName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StageGroupItemDto)
  items?: StageGroupItemDto[];
}
