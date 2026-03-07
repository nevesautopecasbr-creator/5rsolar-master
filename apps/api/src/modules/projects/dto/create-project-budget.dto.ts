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

  /** Economia mensal estimada (R$) — proposta solar */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  monthlySavings?: number;

  /** Payback estimado em anos — proposta solar */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  paybackYears?: number;

  /** Condições de pagamento (texto) — proposta solar */
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  /** Lei 14.300: percentual fio B (0–1) */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fioBPct?: number;

  /** Fator de simultaneidade (0–1) */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  simultaneityFactor?: number;

  /** Grupo consumidor (A/B) */
  @IsOptional()
  @IsString()
  consumerGroup?: string;

  /** Modalidade (autoconsumo local, remoto, etc.) */
  @IsOptional()
  @IsString()
  modality?: string;

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
