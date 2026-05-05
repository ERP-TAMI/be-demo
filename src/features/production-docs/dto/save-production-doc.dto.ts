import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SizeRowDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsString() rowName?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() sValue?: string;
  @IsOptional() @IsString() mValue?: string;
  @IsOptional() @IsString() lValue?: string;
  @IsOptional() @IsString() xlValue?: string;
  @IsOptional() @IsString() patternValue?: string;
  @IsOptional() @IsString() tolPlusMinus?: string;
  @IsNumber() orderIndex: number;
}

export class SectionImageGroupDto {
  @IsOptional() @IsString() heading?: string;
  @IsOptional() @IsIn(['red', 'black']) headingColor?: 'red' | 'black';
  @IsOptional() @IsArray() @IsString({ each: true }) imageUrls?: string[];
  @IsNumber() orderIndex: number;
}

export class SectionDto {
  @IsOptional() @IsString() id?: string;
  @IsString() title: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) imageUrls?: string[];
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionImageGroupDto)
  imageGroups?: SectionImageGroupDto[];
  @IsNumber() orderIndex: number;
}

export class SaveProductionDocDto {
  @IsOptional() @IsString() section1MoTa?: string;
  @IsOptional() @IsString() section1ImageUrl?: string;
  @IsOptional() @IsString() section2PhuLieu?: string;
  @IsOptional() @IsString() section3LuuYTraiCat?: string;
  @IsOptional() @IsString() section4CommentKhachHang?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SizeRowDto)
  sizeRows?: SizeRowDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionDto)
  sections?: SectionDto[];
}
