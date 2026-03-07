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

  /** Consumo em kWh (preenchido automaticamente pelo projeto/cliente se não informado) */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  consumptionKwh?: number;

  /** Código da unidade consumidora (preenchido automaticamente pelo projeto/cliente se não informado) */
  @IsOptional()
  @IsString()
  consumerUnitCode?: string;

  /** Potência do sistema em kWp (preenchida automaticamente pelo projeto se não informada) */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  systemPowerKwp?: number;

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
