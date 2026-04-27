import { IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class UpsertDailyPlanDto {
  @IsInt()
  @Min(1)
  @Max(31)
  day: number;

  @IsInt()
  @Min(0)
  plannedQty: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  actualQty?: number;

  @IsBoolean()
  @IsOptional()
  isManualOverride?: boolean;
}
