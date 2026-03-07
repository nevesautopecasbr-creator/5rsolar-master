import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, Min, Max } from "class-validator";

export enum ConsumerGroup {
  A = "A",
  B = "B",
}

export enum SolarModality {
  AUTOCONSUMO_LOCAL = "autoconsumo_local",
  AUTOCONSUMO_REMOTO = "autoconsumo_remoto",
  GERACAO_COMPARTILHADA = "geracao_compartilhada",
}

export class SolarSimulateDto {
  /** Consumo médio mensal em kWh (obrigatório) */
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  consumptionKwh: number;

  /** Valor da conta de luz em R$ (opcional — usado para economia e tarifa) */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  billValue?: number;

  /** Custo estimado do sistema em R$ (opcional — usado para payback) */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  systemCost?: number;

  /** Grupo do consumidor (A ou B) — Lei 14.300 */
  @IsOptional()
  @IsEnum(ConsumerGroup)
  consumerGroup?: ConsumerGroup;

  /** Modalidade: autoconsumo local, remoto, geração compartilhada */
  @IsOptional()
  @IsEnum(SolarModality)
  modality?: SolarModality;

  /** Percentual fio B (0 a 1). Ex.: 0,15 = 15%. Default conforme ano/regulamento */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  fioBPct?: number;

  /** Fator de simultaneidade (0 a 1). Ex.: 0,85. Reduz a geração considerada útil no mesmo instante do consumo */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  simultaneityFactor?: number;
}

export interface SolarSimulateResult {
  suggestedPowerKwp: number;
  monthlyGenerationKwh: number;
  monthlySavings: number | null;
  paybackYears: number | null;
  premissas: {
    fioBPct: number;
    simultaneityFactor: number;
    consumerGroup: string | null;
    modality: string | null;
    sunHoursPerDay: number;
    systemLossFactor: number;
  };
}
