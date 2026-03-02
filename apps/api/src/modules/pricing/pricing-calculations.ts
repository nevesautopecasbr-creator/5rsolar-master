type PricingSummaryInput = {
  totalFixedMonthly: number;
  totalVariablePct: number;
  annualRevenue: number;
  baseMonths: number;
  desiredProfitPct: number;
};

export type PricingSummary = {
  totalFixedMonthly: number;
  totalVariablePct: number;
  annualRevenue: number;
  baseMonths: number;
  fixedPct: number;
  variablePct: number;
  desiredProfitPct: number;
  cmvMaxPct: number;
  markup: number;
  warnings: string[];
};

export type PricingItemCalculation = {
  cmvReal: number | null;
  lucroRealPct: number | null;
  precoRecomendado: number | null;
  lucroRealValue: number | null;
  lucroRecomendadoValue: number | null;
};

export function computePricingSummary(input: PricingSummaryInput): PricingSummary {
  const warnings: string[] = [];
  const { totalFixedMonthly, totalVariablePct, annualRevenue, baseMonths, desiredProfitPct } =
    input;

  const fixedPct =
    annualRevenue > 0 ? (totalFixedMonthly * baseMonths) / annualRevenue : 0;
  if (annualRevenue === 0) {
    warnings.push("ANNUAL_REVENUE_ZERO");
  }

  const variablePct = totalVariablePct;
  const cmvMaxPct = 1 - (desiredProfitPct + fixedPct + variablePct);
  if (cmvMaxPct <= 0) {
    warnings.push("CMV_MAX_INVALID");
  }

  const markup = cmvMaxPct > 0 ? 1 / cmvMaxPct : 0;

  return {
    totalFixedMonthly,
    totalVariablePct,
    annualRevenue,
    baseMonths,
    fixedPct,
    variablePct,
    desiredProfitPct,
    cmvMaxPct,
    markup,
    warnings,
  };
}

export function computePricingItem(
  costValue: number,
  currentPrice: number,
  summary: Pick<PricingSummary, "fixedPct" | "variablePct" | "desiredProfitPct" | "cmvMaxPct">,
): PricingItemCalculation {
  if (currentPrice <= 0) {
    return {
      cmvReal: null,
      lucroRealPct: null,
      precoRecomendado: summary.cmvMaxPct > 0 ? costValue / summary.cmvMaxPct : null,
      lucroRealValue: null,
      lucroRecomendadoValue:
        summary.cmvMaxPct > 0 ? (costValue / summary.cmvMaxPct) * summary.desiredProfitPct : null,
    };
  }

  const cmvReal = costValue / currentPrice;
  const lucroRealPct = 1 - (cmvReal + summary.fixedPct + summary.variablePct);
  const precoRecomendado = summary.cmvMaxPct > 0 ? costValue / summary.cmvMaxPct : null;
  const lucroRealValue = currentPrice * lucroRealPct;
  const lucroRecomendadoValue =
    precoRecomendado !== null ? precoRecomendado * summary.desiredProfitPct : null;

  return {
    cmvReal,
    lucroRealPct,
    precoRecomendado,
    lucroRealValue,
    lucroRecomendadoValue,
  };
}
