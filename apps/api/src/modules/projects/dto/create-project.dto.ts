import { ProjectStatus } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

function optionalString(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
}

function optionalNumber(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isNaN(n) ? undefined : n;
}

function optionalDate(v: unknown): string | undefined {
  if (v == null || v === "") return undefined;
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) return v;
  if (typeof v === "string" && /^\d{2}\/\d{2}\/\d{4}/.test(v)) {
    const [d, m, y] = v.split("/");
    return `${y}-${m}-${d}`;
  }
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return undefined;
}

class ProjectProductSelectionDto {
  @IsString()
  productId: string;

  @IsString()
  name: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;
}

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @Transform(({ value }) => optionalString(value))
  @IsString()
  code?: string;

  @IsOptional()
  @Transform(({ value }) => optionalString(value))
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @Transform(({ value }) => optionalNumber(value))
  @IsNumber()
  kWp?: number;

  @IsOptional()
  @IsString()
  utilityCompany?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectProductSelectionDto)
  productsUsed?: ProjectProductSelectionDto[];

  @IsOptional()
  @Transform(({ value }) => optionalDate(value))
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @Transform(({ value }) => optionalDate(value))
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  customerId?: string;
}
