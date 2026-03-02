import { computePricingItem, computePricingSummary } from "../src/modules/pricing/pricing-calculations";

describe("pricing calculations", () => {
  it("calculates fixedPct and markup correctly", () => {
    const summary = computePricingSummary({
      totalFixedMonthly: 1000,
      totalVariablePct: 0.05,
      annualRevenue: 60000,
      baseMonths: 6,
      desiredProfitPct: 0.2,
    });

    expect(summary.fixedPct).toBeCloseTo(0.1, 6);
    expect(summary.cmvMaxPct).toBeCloseTo(0.65, 6);
    expect(summary.markup).toBeCloseTo(1 / 0.65, 6);
  });

  it("returns warning when annual revenue is zero", () => {
    const summary = computePricingSummary({
      totalFixedMonthly: 8000,
      totalVariablePct: 0.1,
      annualRevenue: 0,
      baseMonths: 0,
      desiredProfitPct: 0.2,
    });

    expect(summary.fixedPct).toBe(0);
    expect(summary.warnings).toContain("ANNUAL_REVENUE_ZERO");
  });

  it("returns warning when cmvMaxPct is invalid", () => {
    const summary = computePricingSummary({
      totalFixedMonthly: 10000,
      totalVariablePct: 0.4,
      annualRevenue: 120000,
      baseMonths: 12,
      desiredProfitPct: 0.5,
    });

    expect(summary.cmvMaxPct).toBeLessThanOrEqual(0);
    expect(summary.warnings).toContain("CMV_MAX_INVALID");
  });

  it("handles item calculation when current price is zero", () => {
    const summary = computePricingSummary({
      totalFixedMonthly: 1000,
      totalVariablePct: 0.05,
      annualRevenue: 60000,
      baseMonths: 6,
      desiredProfitPct: 0.2,
    });
    const item = computePricingItem(1000, 0, summary);

    expect(item.cmvReal).toBeNull();
    expect(item.lucroRealPct).toBeNull();
    expect(item.precoRecomendado).toBeCloseTo(1000 / summary.cmvMaxPct, 6);
  });
});
