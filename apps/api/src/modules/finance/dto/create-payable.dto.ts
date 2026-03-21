import { PayableStatus, PayableType } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
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

function normalizePayableStatus(v: unknown): string {
  const raw = String(v ?? "").trim().toUpperCase();
  if (!raw) return raw;
  if (raw === "EM_ABERTO" || raw === "EM ABERTO" || raw === "ABERTO" || raw === "OPEN") {
    return PayableStatus.OPEN;
  }
  if (raw === "PAGO" || raw === "PAID") {
    return PayableStatus.PAID;
  }
  return raw;
}

function normalizePaymentMethod(v: unknown): string | undefined {
  const raw = String(v ?? "").trim().toUpperCase();
  if (!raw) return undefined;
  if (raw === "CARTÃO" || raw === "CARTAO" || raw === "CARD") return "CARTAO";
  if (raw === "PIX") return "PIX";
  if (raw === "BOLETO") return "BOLETO";
  if (raw === "DINHEIRO" || raw === "CASH") return "DINHEIRO";
  return raw;
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
  @Transform(({ value }) => normalizePayableStatus(value))
  @IsEnum(PayableStatus)
  @IsIn([PayableStatus.OPEN, PayableStatus.PAID])
  status?: PayableStatus;

  @IsOptional()
  @Transform(({ value }) => (value == null || value === "" ? undefined : toIsoDate(value)))
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @Transform(({ value }) => normalizePaymentMethod(value))
  @IsIn(["PIX", "CARTAO", "BOLETO", "DINHEIRO"])
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
