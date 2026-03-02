import { Type } from "class-transformer";
import { IsNumber } from "class-validator";

export class UpdatePricingSettingsDto {
  @Type(() => Number)
  @IsNumber()
  desiredProfitPct: number;
}
