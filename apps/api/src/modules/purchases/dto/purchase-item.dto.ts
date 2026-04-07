import { IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { Transform, Type } from "class-transformer";

function emptyToUndefined({ value }: { value: unknown }) {
  if (value === "" || value === null) return undefined;
  return value;
}

export class PurchaseItemDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID("4")
  productId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}