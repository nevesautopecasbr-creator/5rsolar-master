import { CashDirection } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
} from "class-validator";

export class CreateCashMovementDto {
  @IsString()
  cashAccountId: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsString()
  payableId?: string;

  @IsOptional()
  @IsString()
  receivableId?: string;

  @IsEnum(CashDirection)
  direction: CashDirection;

  @Type(() => Number)
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsDateString()
  movementDate?: string;

  @IsOptional()
  @IsString()
  description?: string;
}