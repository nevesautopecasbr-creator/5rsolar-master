import { PurchaseStatus } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
  IsNumber,
  IsUUID,
} from "class-validator";
import { PurchaseItemDto } from "./purchase-item.dto";

function emptyToUndefined({ value }: { value: unknown }) {
  if (value === "" || value === null) return undefined;
  return value;
}

export class CreatePurchaseOrderDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID("4")
  quoteId?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID("4")
  supplierId?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID("4")
  projectId?: string;

  @IsOptional()
  @IsEnum(PurchaseStatus)
  status?: PurchaseStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  total?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsDateString()
  payableDueDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items?: PurchaseItemDto[];
}
