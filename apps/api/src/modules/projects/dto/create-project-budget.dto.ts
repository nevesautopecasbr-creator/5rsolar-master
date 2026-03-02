import { Type } from "class-transformer";
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

class ProjectBudgetProductSelectionDto {
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

export class CreateProjectBudgetDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @Type(() => Number)
  @IsNumber()
  laborCost: number;

  @Type(() => Number)
  @IsNumber()
  materialCost: number;

  @Type(() => Number)
  @IsNumber()
  taxAmount: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  otherCosts?: number;

  @Type(() => Number)
  @IsNumber()
  totalValue: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectBudgetProductSelectionDto)
  productsUsed?: ProjectBudgetProductSelectionDto[];
}
