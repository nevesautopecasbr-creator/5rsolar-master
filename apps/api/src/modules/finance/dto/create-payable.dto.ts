import { PayableStatus, PayableType } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

function toNumber(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/\s/g, "").replace(",", "."));
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

function toIsoDate(v: unknown): string {
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) return v;
  if (typeof v === "string" && /^\d{2}\/\d{2}\/\d{4}/.test(v)) {
    const [d, m, y] = v.split("/");
    return `${y}-${m}-${d}`;
  }
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v ?? "");
}

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

  @Transform(({ value }) => toNumber(value))
  @IsNumber()
  amount: number;

  @Transform(({ value }) => toIsoDate(value))
  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsEnum(PayableStatus)
  status?: PayableStatus;

  @IsOptional()
  @Transform(({ value }) => (value == null || value === "" ? undefined : toIsoDate(value)))
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
  @Transform(({ value }) => (value == null || value === "" ? undefined : toIsoDate(value)))
  @IsDateString()
  nextDueDate?: string;
}
