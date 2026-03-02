import { PricingItemType } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsString } from "class-validator";

export class CreatePricingItemDto {
  @IsEnum(PricingItemType)
  type: PricingItemType;

  @IsString()
  name: string;

  @Type(() => Number)
  @IsNumber()
  costValue: number;

  @Type(() => Number)
  @IsNumber()
  currentPrice: number;
}
