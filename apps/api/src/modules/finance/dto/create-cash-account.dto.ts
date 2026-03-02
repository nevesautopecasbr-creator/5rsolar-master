import { Type } from "class-transformer";
import { IsOptional, IsString, IsBoolean, IsNumber } from "class-validator";

export class CreateCashAccountDto {
  @IsOptional()
  @IsString()
  bankId?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  openingBalance?: number;
}