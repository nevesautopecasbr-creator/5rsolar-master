import { Transform } from "class-transformer";
import { IsDateString, IsOptional, IsString, IsUUID } from "class-validator";

function emptyToUndefined({ value }: { value: unknown }) {
  if (value === "" || value == null) return undefined;
  return value;
}

export class CreateWarrantyDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID("4")
  customerId?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsUUID("4")
  projectId?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  terms?: string;
}