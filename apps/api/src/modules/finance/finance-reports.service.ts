import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PayableType, ReceivableStatus, PayableStatus } from "@prisma/client";

@Injectable()
export class FinanceReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async cashflow(
    companyId: string | undefined,
    start: Date,
    end: Date,
    projectId?: string,
  ) {
    const receivableForecast = await this.prisma.receivable.aggregate({
      _sum: { amount: true },
      where: {
        companyId,
        projectId,
        dueDate: { gte: start, lte: end },
        status: { notIn: [ReceivableStatus.PAID, ReceivableStatus.CANCELLED] },
      },
    });
    const receivableRealized = await this.prisma.receivable.aggregate({
      _sum: { amount: true },
      where: {
        companyId,
        projectId,
        receivedAt: { gte: start, lte: end },
        status: ReceivableStatus.PAID,
      },
    });
    const payableForecast = await this.prisma.payable.aggregate({
      _sum: { amount: true },
      where: {
        companyId,
        projectId,
        dueDate: { gte: start, lte: end },
        status: { notIn: [PayableStatus.PAID, PayableStatus.CANCELLED] },
      },
    });
    const payableRealized = await this.prisma.payable.aggregate({
      _sum: { amount: true },
      where: {
        companyId,
        projectId,
        paidAt: { gte: start, lte: end },
        status: PayableStatus.PAID,
      },
    });

    return {
      forecast: {
        inflow: Number(receivableForecast._sum.amount ?? 0),
        outflow: Number(payableForecast._sum.amount ?? 0),
      },
      realized: {
        inflow: Number(receivableRealized._sum.amount ?? 0),
        outflow: Number(payableRealized._sum.amount ?? 0),
      },
    };
  }

  async dre(
    companyId: string | undefined,
    start: Date,
    end: Date,
    projectId?: string,
  ) {
    const receivables = await this.prisma.receivable.groupBy({
      by: ["accountId"],
      _sum: { amount: true },
      where: {
        companyId,
        projectId,
        receivedAt: { gte: start, lte: end },
        status: ReceivableStatus.PAID,
      },
    });

    const payables = await this.prisma.payable.groupBy({
      by: ["accountId"],
      _sum: { amount: true },
      where: {
        companyId,
        projectId,
        paidAt: { gte: start, lte: end },
        status: PayableStatus.PAID,
      },
    });

    const accountIds = [
      ...new Set([
        ...receivables.map((item) => item.accountId),
        ...payables.map((item) => item.accountId),
      ]),
    ].filter(Boolean) as string[];

    const accounts = await this.prisma.chartOfAccount.findMany({
      where: { id: { in: accountIds } },
    });

    return {
      revenues: receivables.map((item) => ({
        account: accounts.find((acc) => acc.id === item.accountId),
        amount: Number(item._sum.amount ?? 0),
      })),
      expenses: payables.map((item) => ({
        account: accounts.find((acc) => acc.id === item.accountId),
        amount: Number(item._sum.amount ?? 0),
      })),
    };
  }

  async marginByProject(companyId: string | undefined, projectId: string) {
    const receivables = await this.prisma.receivable.aggregate({
      _sum: { amount: true },
      where: { companyId, projectId },
    });

    const directCosts = await this.prisma.payable.aggregate({
      _sum: { amount: true },
      where: { companyId, projectId, isDirectCost: true },
    });

    const laborCosts = await this.prisma.payable.aggregate({
      _sum: { amount: true },
      where: {
        companyId,
        projectId,
        type: { in: [PayableType.LABOR, PayableType.SERVICE] },
      },
    });

    const revenue = Number(receivables._sum.amount ?? 0);
    const direct = Number(directCosts._sum.amount ?? 0);
    const labor = Number(laborCosts._sum.amount ?? 0);

    return {
      revenue,
      directCosts: direct,
      laborCosts: labor,
      grossMargin: revenue - direct,
      netMargin: revenue - direct - labor,
    };
  }

  async costByCustomer(
    companyId: string | undefined,
    start: Date,
    end: Date,
  ) {
    const payables = await this.prisma.payable.findMany({
      where: {
        companyId,
        dueDate: { gte: start, lte: end },
      },
      include: {
        project: {
          include: { customer: true },
        },
      },
    });

    const totals = new Map<
      string,
      { customerId: string | null; customerName: string; total: number }
    >();

    for (const payable of payables) {
      const customerId = payable.project?.customerId ?? null;
      const customerName = payable.project?.customer?.name ?? "Sem cliente";
      const key = customerId ?? "none";
      const current = totals.get(key) ?? {
        customerId,
        customerName,
        total: 0,
      };
      current.total += Number(payable.amount ?? 0);
      totals.set(key, current);
    }

    return {
      items: Array.from(totals.values()).sort(
        (a, b) => b.total - a.total,
      ),
    };
  }
}
