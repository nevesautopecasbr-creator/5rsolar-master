import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateContractDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  contractNumber?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalValue?: number;
}
