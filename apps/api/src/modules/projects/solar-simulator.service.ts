import { Injectable } from "@nestjs/common";
import type { SolarSimulateDto, SolarSimulateResult } from "./dto/solar-simulate.dto";

/** Média de horas de sol útil por dia (Brasil, valor típico) */
const DEFAULT_SUN_HOURS_PER_DAY = 5.2;
/** Fator de perda do sistema (cabo, inversor, sujeira, etc.) */
const DEFAULT_SYSTEM_LOSS_FACTOR = 0.85;
/** Lei 14.300: percentual fio B típico (custo de distribuição não evitado) */
const DEFAULT_FIO_B_PCT = 0.15;
/** Fator de simultaneidade típico (quanto da geração coincide com o consumo) */
const DEFAULT_SIMULTANEITY_FACTOR = 0.85;

@Injectable()
export class SolarSimulatorService {
  /**
   * Calcula potência sugerida (kWp), geração mensal, economia e payback
   * considerando Lei 14.300 (fio B e fator de simultaneidade).
   */
  simulate(dto: SolarSimulateDto): SolarSimulateResult {
    const sunHoursPerDay = DEFAULT_SUN_HOURS_PER_DAY;
    const systemLossFactor = DEFAULT_SYSTEM_LOSS_FACTOR;
    const fioBPct = dto.fioBPct ?? DEFAULT_FIO_B_PCT;
    const simultaneityFactor = dto.simultaneityFactor ?? DEFAULT_SIMULTANEITY_FACTOR;

    // Potência sugerida para cobrir o consumo (kWh/mês -> kWp)
    // kWh_mes = kWp * sunHours * 30 * lossFactor  =>  kWp = kWh_mes / (sunHours * 30 * lossFactor)
    const suggestedPowerKwp =
      dto.consumptionKwh / (sunHoursPerDay * 30 * systemLossFactor);
    const roundedKwp = Math.round(suggestedPowerKwp * 100) / 100;

    // Geração mensal estimada (kWh)
    const monthlyGenerationKwh =
      roundedKwp * sunHoursPerDay * 30 * systemLossFactor;

    // Economia em R$: só quando temos valor da conta (tarifa implícita)
    let monthlySavings: number | null = null;
    if (dto.billValue != null && dto.billValue > 0 && dto.consumptionKwh > 0) {
      const tariffPerKwh = dto.billValue / dto.consumptionKwh;
      const usefulGenerationKwh = monthlyGenerationKwh * simultaneityFactor;
      const energyOffsetKwh = Math.min(usefulGenerationKwh, dto.consumptionKwh);
      // Parte da tarifa que não é “fio B” é o que se evita
      monthlySavings = energyOffsetKwh * tariffPerKwh * (1 - fioBPct);
      monthlySavings = Math.round(monthlySavings * 100) / 100;
    }

    // Payback em anos: só quando temos custo do sistema e economia
    let paybackYears: number | null = null;
    if (
      dto.systemCost != null &&
      dto.systemCost > 0 &&
      monthlySavings != null &&
      monthlySavings > 0
    ) {
      paybackYears = dto.systemCost / (monthlySavings * 12);
      paybackYears = Math.round(paybackYears * 100) / 100;
    }

    return {
      suggestedPowerKwp: roundedKwp,
      monthlyGenerationKwh: Math.round(monthlyGenerationKwh * 100) / 100,
      monthlySavings,
      paybackYears,
      premissas: {
        fioBPct,
        simultaneityFactor,
        consumerGroup: dto.consumerGroup ?? null,
        modality: dto.modality ?? null,
        sunHoursPerDay,
        systemLossFactor,
      },
    };
  }
}
