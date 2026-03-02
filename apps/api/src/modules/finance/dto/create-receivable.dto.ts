import { ReceivableStatus } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
} from "class-validator";

export class CreateReceivableDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  contractId?: string;

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
  @IsEnum(ReceivableStatus)
  status?: ReceivableStatus;

  @IsOptional()
  @IsDateString()
  receivedAt?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  installmentNo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalInstallments?: number;
}