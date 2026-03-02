import { Type } from "class-transformer";
import { IsArray, IsNumber, ValidateNested } from "class-validator";

export class RevenueBaseMonthDto {
  @Type(() => Number)
  @IsNumber()
  month: number;

  @Type(() => Number)
  @IsNumber()
  revenueValue: number;
}

export class UpdateRevenueBaseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RevenueBaseMonthDto)
  months: RevenueBaseMonthDto[];
}
