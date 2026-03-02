import { PayableStatus, PayableType } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
} from "class-validator";

export class CreatePayableDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  purchaseOrderId?: string;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsString()
  description: string;

  @Type(() => Number)
  @IsNumber()
  amount: number;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsEnum(PayableStatus)
  status?: PayableStatus;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsBoolean()
  isDirectCost?: boolean;

  @IsOptional()
  @IsEnum(PayableType)
  type?: PayableType;

  @IsOptional()
  @IsString()
  recurrenceRule?: string;

  @IsOptional()
  @IsDateString()
  nextDueDate?: string;
}