import { IsDateString, IsNumber, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";

export class CreatePixDto {
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @IsString()
  payerName: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
