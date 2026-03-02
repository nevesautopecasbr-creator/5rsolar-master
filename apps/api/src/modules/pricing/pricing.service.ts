import { Injectable, NotFoundException } from "@nestjs/common";
import { PricingItemType, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../iam/audit.service";
import { CreateFixedExpenseDto } from "./dto/create-fixed-expense.dto";
import { UpdateFixedExpenseDto } from "./dto/update-fixed-expense.dto";
import { CreateVariableExpenseDto } from "./dto/create-variable-expense.dto";
import { UpdateVariableExpenseDto } from "./dto/update-variable-expense.dto";
import { UpdatePricingSettingsDto } from "./dto/update-pricing-settings.dto";
import { UpdateRevenueBaseDto } from "./dto/update-revenue-base.dto";
import { CreatePricingItemDto } from "./dto/create-pricing-item.dto";
import { UpdatePricingItemDto } from "./dto/update-pricing-item.dto";
import { computePricingItem, computePricingSummary } from "./pricing-calculations";

type Numberish = number | string | Prisma.Decimal | null | undefined;

@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private toNumber(value: Numberish) {
    if (value === null || value === undefined) return 0;
    return Number(value);
  }

  async getSettings(companyId?: string) {
    const settings = await this.prisma.pricingSettings.findFirst({
      where: companyId ? { companyId } : undefined,
    });
    return (
      settings ?? {
        desiredProfitPct: 0.2,
      }
    );
  }

  async updateSettings(
    companyId: string | undefined,
    dto: UpdatePricingSettingsDto,
    actorId?: string,
  ) {
    const existing = await this.prisma.pricingSettings.findFirst({
      where: companyId ? { companyId } : undefined,
    });
    const updated = existing
      ? await this.prisma.pricingSettings.update({
          where: { id: existing.id },
          data: { desiredProfitPct: dto.desiredProfitPct },
        })
      : await this.prisma.pricingSettings.create({
          data: {
            companyId,
            desiredProfitPct: dto.desiredProfitPct,
          },
        });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "PricingSettings",
      entityId: updated.id,
      action: existing ? "UPDATE" : "CREATE",
      payload: { desiredProfitPct: updated.desiredProfitPct },
    });

    return updated;
  }

  async findFixedExpenses(companyId?: string) {
    return this.prisma.fixedExpense.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { createdAt: "asc" },
    });
  }

  async createFixedExpense(
    companyId: string | undefined,
    dto: CreateFixedExpenseDto,
    actorId?: string,
  ) {
    const created = await this.prisma.fixedExpense.create({
      data: {
        companyId,
        description: dto.description,
        monthlyValue: dto.monthlyValue,
      },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "FixedExpense",
      entityId: created.id,
      action: "CREATE",
      payload: { description: created.description },
    });

    return created;
  }

  async updateFixedExpense(
    id: string,
    dto: UpdateFixedExpenseDto,
    actorId?: string,
    companyId?: string,
  ) {
    const existing = await this.prisma.fixedExpense.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) {
      throw new NotFoundException("Despesa fixa não encontrada");
    }
    const updated = await this.prisma.fixedExpense.update({
      where: { id },
      data: {
        description: dto.description,
        monthlyValue: dto.monthlyValue,
      },
    });

    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "FixedExpense",
      entityId: updated.id,
      action: "UPDATE",
      payload: { description: updated.description },
    });

    return updated;
  }

  async removeFixedExpense(id: string, actorId?: string, companyId?: string) {
    const existing = await this.prisma.fixedExpense.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) {
      throw new NotFoundException("Despesa fixa não encontrada");
    }
    const deleted = await this.prisma.fixedExpense.delete({ where: { id } });

    await this.audit.log({
      actorId,
      companyId: deleted.companyId ?? undefined,
      entityName: "FixedExpense",
      entityId: deleted.id,
      action: "DELETE",
      payload: { description: deleted.description },
    });

    return deleted;
  }

  async findVariableExpenses(companyId?: string) {
    return this.prisma.variableExpense.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { createdAt: "asc" },
    });
  }

  async createVariableExpense(
    companyId: string | undefined,
    dto: CreateVariableExpenseDto,
    actorId?: string,
  ) {
    const created = await this.prisma.variableExpense.create({
      data: {
        companyId,
        description: dto.description,
        pct: dto.pct,
      },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "VariableExpense",
      entityId: created.id,
      action: "CREATE",
      payload: { description: created.description },
    });

    return created;
  }

  async updateVariableExpense(
    id: string,
    dto: UpdateVariableExpenseDto,
    actorId?: string,
    companyId?: string,
  ) {
    const existing = await this.prisma.variableExpense.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) {
      throw new NotFoundException("Despesa variável não encontrada");
    }
    const updated = await this.prisma.variableExpense.update({
      where: { id },
      data: {
        description: dto.description,
        pct: dto.pct,
      },
    });

    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "VariableExpense",
      entityId: updated.id,
      action: "UPDATE",
      payload: { description: updated.description },
    });

    return updated;
  }

  async removeVariableExpense(id: string, actorId?: string, companyId?: string) {
    const existing = await this.prisma.variableExpense.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) {
      throw new NotFoundException("Despesa variável não encontrada");
    }
    const deleted = await this.prisma.variableExpense.delete({ where: { id } });

    await this.audit.log({
      actorId,
      companyId: deleted.companyId ?? undefined,
      entityName: "VariableExpense",
      entityId: deleted.id,
      action: "DELETE",
      payload: { description: deleted.description },
    });

    return deleted;
  }

  async getRevenueBase(companyId: string | undefined, year: number) {
    const data = await this.prisma.revenueBaseMonthly.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        year,
      },
      orderBy: { month: "asc" },
    });

    const byMonth = new Map(data.map((item) => [item.month, item]));
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const entry = byMonth.get(month);
      return {
        month,
        revenueValue: this.toNumber(entry?.revenueValue ?? 0),
      };
    });
  }

  async getRevenueYears(companyId: string | undefined) {
    const years = await this.prisma.revenueBaseMonthly.findMany({
      where: companyId ? { companyId } : undefined,
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "asc" },
    });
    return years.map((item) => item.year);
  }

  async updateRevenueBase(
    companyId: string | undefined,
    year: number,
    dto: UpdateRevenueBaseDto,
    actorId?: string,
  ) {
    const sanitized = dto.months
      .filter((item) => item.month >= 1 && item.month <= 12)
      .map((item) => ({
        companyId,
        year,
        month: item.month,
        revenueValue: item.revenueValue,
      }));

    await this.prisma.$transaction([
      this.prisma.revenueBaseMonthly.deleteMany({
        where: {
          ...(companyId ? { companyId } : {}),
          year,
        },
      }),
      this.prisma.revenueBaseMonthly.createMany({
        data: sanitized,
      }),
    ]);

    await this.audit.log({
      actorId,
      companyId,
      entityName: "RevenueBaseMonthly",
      entityId: `${companyId ?? "global"}:${year}`,
      action: "UPDATE",
      payload: { year, months: sanitized.length },
    });

    return this.getRevenueBase(companyId, year);
  }

  async findPricingItems(companyId?: string) {
    return this.prisma.pricingItem.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { createdAt: "asc" },
    });
  }

  async createPricingItem(
    companyId: string | undefined,
    dto: CreatePricingItemDto,
    actorId?: string,
  ) {
    const created = await this.prisma.pricingItem.create({
      data: {
        companyId,
        type: dto.type,
        name: dto.name,
        costValue: dto.costValue,
        currentPrice: dto.currentPrice,
      },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "PricingItem",
      entityId: created.id,
      action: "CREATE",
      payload: { name: created.name, type: created.type },
    });

    return created;
  }

  async updatePricingItem(
    id: string,
    dto: UpdatePricingItemDto,
    actorId?: string,
    companyId?: string,
  ) {
    const existing = await this.prisma.pricingItem.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) {
      throw new NotFoundException("Item de precificação não encontrado");
    }
    const updated = await this.prisma.pricingItem.update({
      where: { id },
      data: {
        type: dto.type as PricingItemType | undefined,
        name: dto.name,
        costValue: dto.costValue,
        currentPrice: dto.currentPrice,
      },
    });

    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "PricingItem",
      entityId: updated.id,
      action: "UPDATE",
      payload: { name: updated.name, type: updated.type },
    });

    return updated;
  }

  async removePricingItem(id: string, actorId?: string, companyId?: string) {
    const existing = await this.prisma.pricingItem.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) {
      throw new NotFoundException("Item de precificação não encontrado");
    }
    const deleted = await this.prisma.pricingItem.delete({ where: { id } });

    await this.audit.log({
      actorId,
      companyId: deleted.companyId ?? undefined,
      entityName: "PricingItem",
      entityId: deleted.id,
      action: "DELETE",
      payload: { name: deleted.name, type: deleted.type },
    });

    return deleted;
  }

  async getSummary(companyId: string | undefined, year: number) {
    const [fixedExpenses, variableExpenses, revenueBase, settings] = await Promise.all([
      this.findFixedExpenses(companyId),
      this.findVariableExpenses(companyId),
      this.prisma.revenueBaseMonthly.findMany({
        where: {
          ...(companyId ? { companyId } : {}),
          year,
        },
      }),
      this.getSettings(companyId),
    ]);

    const totalFixedMonthly = fixedExpenses.reduce(
      (sum, item) => sum + this.toNumber(item.monthlyValue),
      0,
    );
    const totalVariablePct = variableExpenses.reduce(
      (sum, item) => sum + this.toNumber(item.pct),
      0,
    );
    const annualRevenue = revenueBase.reduce(
      (sum, item) => sum + this.toNumber(item.revenueValue),
      0,
    );
    const baseMonths = revenueBase.filter((item) => this.toNumber(item.revenueValue) > 0)
      .length;
    const desiredProfitPct = this.toNumber(
      "desiredProfitPct" in settings ? settings.desiredProfitPct : 0.2,
    );

    return computePricingSummary({
      totalFixedMonthly,
      totalVariablePct,
      annualRevenue,
      baseMonths,
      desiredProfitPct,
    });
  }

  async getItemsCalculated(companyId: string | undefined, year: number) {
    const [items, summary] = await Promise.all([
      this.findPricingItems(companyId),
      this.getSummary(companyId, year),
    ]);

    return items.map((item) => {
      const costValue = this.toNumber(item.costValue);
      const currentPrice = this.toNumber(item.currentPrice);
      const calculations = computePricingItem(costValue, currentPrice, summary);
      return {
        ...item,
        costValue,
        currentPrice,
        ...calculations,
      };
    });
  }
}
