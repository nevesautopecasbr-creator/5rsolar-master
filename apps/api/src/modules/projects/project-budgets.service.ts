import { Injectable, NotFoundException } from "@nestjs/common";
import { Decimal } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../iam/audit.service";
import { FileService } from "../post-proposal/storage/file.service";
import { CreateProjectBudgetDto } from "./dto/create-project-budget.dto";
import { UpdateProjectBudgetDto } from "./dto/update-project-budget.dto";

@Injectable()
export class ProjectBudgetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly files: FileService,
  ) {}

  /** Retorna dados do projeto/cliente para preencher o orçamento (consumo, UC, potência, nome do cliente) */
  async getBudgetContextFromProject(projectId: string, companyId?: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, ...(companyId ? { companyId } : {}) },
      include: {
        customer: {
          include: { consumerUnits: true },
        },
      },
    });
    if (!project) return null;
    const customer = project.customer;
    const consumptionKwh =
      customer?.consumerUnits?.[0]?.currentConsumptionKwh ??
      (customer as { currentConsumptionKwh?: Decimal | null })?.currentConsumptionKwh ??
      null;
    const consumerUnitCode =
      customer?.consumerUnits?.[0]?.consumerUnitCode ??
      (customer as { consumerUnitCode?: string | null })?.consumerUnitCode ??
      null;
    return {
      customerName: customer?.name ?? null,
      consumptionKwh: consumptionKwh != null ? Number(consumptionKwh) : null,
      consumerUnitCode,
      systemPowerKwp: project.kWp != null ? Number(project.kWp) : null,
    };
  }

  async findAll(companyId?: string) {
    return this.prisma.projectBudget.findMany({
      where: { ...(companyId ? { companyId } : {}) },
      include: { projectFromAcceptance: true, sale: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string, companyId?: string) {
    const budget = await this.prisma.projectBudget.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
      include: {
        projectFromAcceptance: true,
        sale: { include: { customer: true } },
      },
    });
    if (!budget) {
      throw new NotFoundException("Orçamento não encontrado");
    }
    return budget;
  }

  async create(
    companyId: string | undefined,
    dto: CreateProjectBudgetDto,
    actorId?: string,
  ) {
    const created = await this.prisma.projectBudget.create({
      data: {
        companyId,
        customerName: dto.customerName ?? undefined,
        consumptionKwh: dto.consumptionKwh != null ? new Decimal(dto.consumptionKwh) : undefined,
        consumerUnitCode: dto.consumerUnitCode ?? undefined,
        systemPowerKwp: dto.systemPowerKwp != null ? new Decimal(dto.systemPowerKwp) : undefined,
        monthlySavings: dto.monthlySavings != null ? new Decimal(dto.monthlySavings) : undefined,
        paybackYears: dto.paybackYears != null ? new Decimal(dto.paybackYears) : undefined,
        paymentTerms: dto.paymentTerms ?? undefined,
        fioBPct: dto.fioBPct != null ? new Decimal(dto.fioBPct) : undefined,
        simultaneityFactor: dto.simultaneityFactor != null ? new Decimal(dto.simultaneityFactor) : undefined,
        consumerGroup: dto.consumerGroup ?? undefined,
        modality: dto.modality ?? undefined,
        laborCost: dto.laborCost,
        materialCost: dto.materialCost,
        taxAmount: dto.taxAmount,
        otherCosts: dto.otherCosts ?? undefined,
        totalValue: dto.totalValue,
        productsUsed: dto.productsUsed
          ? (dto.productsUsed as unknown as Prisma.InputJsonValue)
          : undefined,
        notes: dto.notes,
        createdById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "ProjectBudget",
      entityId: created.id,
      action: "CREATE",
      payload: { totalValue: created.totalValue },
    });

    return this.findOne(created.id, companyId);
  }

  async update(
    id: string,
    dto: UpdateProjectBudgetDto,
    actorId?: string,
    companyId?: string,
  ) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.projectBudget.update({
      where: { id },
      data: {
        customerName: dto.customerName,
        consumptionKwh: dto.consumptionKwh != null ? new Decimal(dto.consumptionKwh) : undefined,
        consumerUnitCode: dto.consumerUnitCode,
        systemPowerKwp: dto.systemPowerKwp != null ? new Decimal(dto.systemPowerKwp) : undefined,
        monthlySavings: dto.monthlySavings != null ? new Decimal(dto.monthlySavings) : undefined,
        paybackYears: dto.paybackYears != null ? new Decimal(dto.paybackYears) : undefined,
        paymentTerms: dto.paymentTerms,
        fioBPct: dto.fioBPct != null ? new Decimal(dto.fioBPct) : undefined,
        simultaneityFactor: dto.simultaneityFactor != null ? new Decimal(dto.simultaneityFactor) : undefined,
        consumerGroup: dto.consumerGroup,
        modality: dto.modality,
        laborCost: dto.laborCost,
        materialCost: dto.materialCost,
        taxAmount: dto.taxAmount,
        otherCosts: dto.otherCosts,
        totalValue: dto.totalValue,
        productsUsed: dto.productsUsed
          ? (dto.productsUsed as unknown as Prisma.InputJsonValue)
          : undefined,
        notes: dto.notes,
        updatedById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "ProjectBudget",
      entityId: updated.id,
      action: "UPDATE",
      payload: { totalValue: updated.totalValue },
    });

    return this.findOne(updated.id, companyId);
  }

  async remove(id: string, actorId?: string, companyId?: string) {
    const budget = await this.findOne(id, companyId);
    const deleted = await this.prisma.projectBudget.delete({ where: { id } });
    await this.audit.log({
      actorId,
      companyId: budget.companyId ?? undefined,
      entityName: "ProjectBudget",
      entityId: deleted.id,
      action: "DELETE",
      payload: { totalValue: deleted.totalValue },
    });
    return deleted;
  }

  /**
   * Gera o PDF da Proposta Comercial a partir do orçamento (dados do cliente + orçamento)
   * e salva no storage (Supabase ou local), gravando a URL em proposalPdfUrl.
   */
  async generateProposalPdf(id: string, companyId?: string, actorId?: string) {
    const budget = await this.prisma.projectBudget.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
      include: { sale: { include: { customer: true } } },
    });
    if (!budget) {
      throw new NotFoundException("Orçamento não encontrado");
    }

    const customerName =
      budget.customerName ??
      (budget.sale?.customer as { name?: string } | null)?.name ??
      "-";
    const consumptionKwh =
      budget.consumptionKwh != null ? Number(budget.consumptionKwh) : null;
    const consumerUnitCode = budget.consumerUnitCode ?? "-";
    const systemPowerKwp =
      budget.systemPowerKwp != null ? Number(budget.systemPowerKwp) : null;
    const totalValue =
      budget.totalValue != null
        ? Number(budget.totalValue).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })
        : "-";
    const laborCost =
      budget.laborCost != null
        ? Number(budget.laborCost).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })
        : "-";
    const materialCost =
      budget.materialCost != null
        ? Number(budget.materialCost).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })
        : "-";
    const taxAmount =
      budget.taxAmount != null
        ? Number(budget.taxAmount).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })
        : "-";

    const monthlySavings =
      budget.monthlySavings != null
        ? Number(budget.monthlySavings).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })
        : null;
    const paybackYears =
      budget.paybackYears != null ? Number(budget.paybackYears) : null;
    const paymentTerms = budget.paymentTerms?.trim() || null;
    const fioBPct =
      budget.fioBPct != null ? `${(Number(budget.fioBPct) * 100).toFixed(1)}%` : null;
    const simultaneityFactor =
      budget.simultaneityFactor != null ? Number(budget.simultaneityFactor) : null;
    const consumerGroup = budget.consumerGroup ?? null;
    const modality = budget.modality ?? null;

    const products = (budget.productsUsed as Array<{ name?: string; quantity?: number; price?: number }>) ?? [];
    const productsLines = products
      .map(
        (p, i) =>
          `${i + 1}. ${p.name ?? "-"} - Qtd: ${p.quantity ?? 0} - R$ ${Number(p.price ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      )
      .join("\n");

    const solarSection = [
      "",
      "Proposta Solar (simulação e regulatório):",
      monthlySavings != null ? `Economia mensal estimada: ${monthlySavings}` : "",
      paybackYears != null ? `Payback estimado: ${paybackYears} anos` : "",
      paymentTerms ? `Condições de pagamento: ${paymentTerms}` : "",
      consumerGroup ? `Grupo consumidor: ${consumerGroup}` : "",
      modality ? `Modalidade: ${modality}` : "",
      fioBPct != null ? `Premissa Lei 14.300 - Fio B: ${fioBPct}` : "",
      simultaneityFactor != null
        ? `Premissa - Fator de simultaneidade: ${simultaneityFactor}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const text = [
      "PROPOSTA COMERCIAL",
      "",
      "Dados do cliente (Passo 1):",
      `Cliente: ${customerName}`,
      `Unidade consumidora (UC): ${consumerUnitCode}`,
      `Consumo (kWh/mês): ${consumptionKwh ?? "-"}`,
      `Potência do sistema (kWp): ${systemPowerKwp ?? "-"}`,
      solarSection,
      "",
      "Dados do orçamento (Passo 2):",
      `Mão de obra: ${laborCost}`,
      `Material: ${materialCost}`,
      `Impostos: ${taxAmount}`,
      productsLines ? `Produtos/serviços:\n${productsLines}` : "",
      `Valor total: ${totalValue}`,
      budget.notes ? `Observações: ${budget.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const pdfBuffer = this.buildSimplePdf(text, "Proposta Comercial");
    const pdfResult = await this.files.saveBuffer(
      pdfBuffer,
      `proposta-${budget.id}.pdf`,
    );

    await this.prisma.projectBudget.update({
      where: { id },
      data: { proposalPdfUrl: pdfResult.fileUrl, updatedById: actorId },
    });

    await this.audit.log({
      actorId,
      companyId: budget.companyId ?? undefined,
      entityName: "ProjectBudget",
      entityId: budget.id,
      action: "GENERATE_PROPOSAL_PDF",
      payload: { proposalPdfUrl: pdfResult.fileUrl },
    });

    return this.findOne(id, companyId);
  }

  private escapePdfText(s: string): string {
    return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  }

  private buildSimplePdf(bodyText: string, title: string): Buffer {
    const header = "%PDF-1.4\n";
    const objects: string[] = [];
    const lines = bodyText.slice(0, 3000).split("\n");
    const pdfLines: string[] = [
      "BT",
      "/F1 11 Tf",
      "50 800 Td",
      `(${this.escapePdfText(title)}) Tj`,
      "0 -14 Td",
    ];
    for (const line of lines) {
      pdfLines.push(`(${this.escapePdfText(line.slice(0, 100))}) Tj`, "0 -14 Td");
    }
    pdfLines.push("ET");
    const contentLines = pdfLines.join("\n");
    const content = `<< /Length ${contentLines.length} >>\nstream\n${contentLines}\nendstream`;
    objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
    objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
    objects.push(
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
    );
    objects.push(`4 0 obj\n${content}\nendobj\n`);
    objects.push(
      "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    );
    let offset = header.length;
    const xref = ["xref", `0 ${objects.length + 1}`, "0000000000 65535 f "];
    const body = objects
      .map((obj) => {
        const line = `${offset.toString().padStart(10, "0")} 00000 n `;
        xref.push(line);
        offset += obj.length;
        return obj;
      })
      .join("");
    const xrefOffset = header.length + body.length;
    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(`${header}${body}${xref.join("\n")}\n${trailer}`);
  }
}
