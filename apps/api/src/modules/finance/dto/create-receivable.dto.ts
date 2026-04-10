import { ReceivableStatus } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsUUID,
} from "class-validator";

function emptyToUndefined({ value }: { value: unknown }) {
  if (value === "" || value == null) return undefined;
  return value;
}

export class CreateReceivableDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID("4")
  projectId?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID("4")
  customerId?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID("4")
  contractId?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID("4")
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
  @Transform(emptyToUndefined)
  @IsDateString()
  receivedAt?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
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
