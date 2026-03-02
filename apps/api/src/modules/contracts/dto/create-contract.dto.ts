import { ContractStatus } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateContractDto {
  @IsString()
  projectId: string;

  @IsString()
  customerId: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalValue: number;

  @IsOptional()
  @IsDateString()
  signedAt?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  installmentsCount?: number;

  @IsOptional()
  @IsDateString()
  firstDueDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  intervalDays?: number;

  @IsOptional()
  @IsString()
  receivableAccountId?: string;
}