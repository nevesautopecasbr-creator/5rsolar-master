import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../iam/audit.service";
import { FileService } from "./storage/file.service";
import { WorkflowEngineService } from "../workflow/workflow.service";

type Numberish = number | string | Prisma.Decimal | null | undefined;

type SignContractPayload = {
  signatureType: "DRAWN" | "UPLOAD";
  signatureImageBase64?: string;
  signatureFileUrl?: string;
  signedName: string;
  signedDocument: string;
  consent: boolean;
  signedUserAgent?: string;
  signedIp?: string;
  version: number;
};

@Injectable()
export class PostProposalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly files: FileService,
    private readonly workflow: WorkflowEngineService,
  ) {}

  private toNumber(value: Numberish) {
    if (value === null || value === undefined) return 0;
    return Number(value);
  }

  async getContractBySale(saleId: string, companyId?: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { saleId, ...(companyId ? { companyId } : {}) },
      include: { customer: true, project: true, template: true, sale: true },
    });
    if (!contract) {
      throw new NotFoundException("Contrato não encontrado");
    }
    return contract;
  }

  async createContractFromTemplate(
    saleId: string,
    companyId: string | undefined,
    actorId?: string,
  ) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, ...(companyId ? { companyId } : {}) },
    });
    if (!sale) {
      throw new NotFoundException("Venda não encontrada");
    }

    const existing = await this.prisma.contract.findFirst({
      where: { saleId, ...(companyId ? { companyId } : {}) },
    });
    if (existing) {
      return this.getContractBySale(saleId, companyId);
    }

    const template = await this.prisma.contractTemplate.findFirst({
      where: { ...(companyId ? { companyId } : {}), isActive: true },
      orderBy: { createdAt: "desc" },
    });
    if (!template) {
      throw new NotFoundException("Template de contrato não encontrado");
    }

    const project = await this.prisma.project.findFirst({
      where: { customerId: sale.customerId, ...(companyId ? { companyId } : {}) },
      orderBy: { createdAt: "desc" },
    });
    if (!project) {
      throw new NotFoundException("Projeto não encontrado para o cliente da venda.");
    }

    const contract = await this.prisma.contract.create({
      data: {
        companyId,
        saleId,
        customerId: sale.customerId,
        projectId: project.id,
        templateId: template.id,
        status: "DRAFT",
        totalValue: new Prisma.Decimal(0),
        createdById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "Contract",
      entityId: contract.id,
      action: "CREATE",
      payload: { saleId },
    });

    return this.getContractBySale(saleId, companyId);
  }

  async updateContract(
    contractId: string,
    payload: Partial<{ notes?: string; contractNumber?: string; totalValue?: number }>,
    companyId?: string,
    actorId?: string,
  ) {
    const existing = await this.prisma.contract.findFirst({
      where: { id: contractId, ...(companyId ? { companyId } : {}) },
    });
    if (!existing) {
      throw new NotFoundException("Contrato não encontrado");
    }

    const updated = await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        notes: payload.notes,
        contractNumber: payload.contractNumber,
        totalValue:
          payload.totalValue !== undefined
            ? new Prisma.Decimal(payload.totalValue)
            : undefined,
        updatedById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "Contract",
      entityId: updated.id,
      action: "UPDATE",
      payload,
    });

    return updated;
  }

  async signContract(
    contractId: string,
    payload: SignContractPayload,
    companyId?: string,
    actorId?: string,
  ) {
    if (!payload.consent) {
      throw new BadRequestException("Consentimento obrigatório.");
    }
    if (!payload.signedName || !payload.signedDocument) {
      throw new BadRequestException("Nome e documento obrigatórios.");
    }

    const contract = await this.prisma.contract.findFirst({
      where: { id: contractId, ...(companyId ? { companyId } : {}) },
      include: { customer: true, template: true, sale: true, project: true },
    });
    if (!contract) {
      throw new NotFoundException("Contrato não encontrado");
    }

    let signatureUrl: string | undefined;
    if (payload.signatureType === "DRAWN") {
      if (!payload.signatureImageBase64) {
        throw new BadRequestException("Assinatura base64 obrigatória.");
      }
      const result = await this.files.saveBase64(
        payload.signatureImageBase64,
        `signature-${contract.id}`,
      );
      signatureUrl = result.fileUrl;
    } else {
      if (!payload.signatureFileUrl) {
        throw new BadRequestException("Arquivo de assinatura obrigatório.");
      }
      const result = await this.files.saveBase64(
        payload.signatureFileUrl,
        `signature-${contract.id}`,
      );
      signatureUrl = result.fileUrl;
    }

    const pdfContent = this.generateContractPdf(contract, payload.signedName);
    const pdfResult = await this.files.saveBuffer(
      pdfContent,
      `contract-${contract.id}.pdf`,
    );

    const result = await this.workflow.transition({
      entityType: "CONTRACT",
      entityId: contract.id,
      action: "CONTRACT_ACTIVATE",
      version: payload.version,
      actorId,
      companyId,
      payload: {
        signedAt: new Date().toISOString(),
        signedName: payload.signedName,
        signedDocument: payload.signedDocument,
        signedIp: payload.signedIp,
        signedUserAgent: payload.signedUserAgent,
        signatureType: payload.signatureType,
        signatureImageUrl: signatureUrl,
        contractPdfUrl: pdfResult.fileUrl,
      },
    });

    if (result.type !== "APPLIED") {
      throw new BadRequestException("Contrato aguardando aprovação.");
    }

    return result.entity;
  }

  async getContractPdf(contractId: string, companyId?: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { id: contractId, ...(companyId ? { companyId } : {}) },
      select: { contractPdfUrl: true },
    });
    if (!contract?.contractPdfUrl) {
      throw new NotFoundException("PDF não encontrado");
    }
    return { url: contract.contractPdfUrl };
  }

  async getChecklistBySale(saleId: string, companyId?: string) {
    const checklist = await this.prisma.implementationChecklist.findFirst({
      where: { saleId, ...(companyId ? { companyId } : {}) },
    });
    if (!checklist) {
      throw new NotFoundException("Checklist não encontrado");
    }
    return checklist;
  }

  async getSaleById(saleId: string, companyId?: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, ...(companyId ? { companyId } : {}) },
    });
    if (!sale) {
      throw new NotFoundException("Venda não encontrada");
    }
    return sale;
  }

  async getChecklistItems(checklistId: string, companyId?: string) {
    const checklist = await this.prisma.implementationChecklist.findFirst({
      where: { id: checklistId, ...(companyId ? { companyId } : {}) },
    });
    if (!checklist) {
      throw new NotFoundException("Checklist não encontrado");
    }
    return this.prisma.implementationChecklistItem.findMany({
      where: { checklistId },
      include: { evidences: true, assignee: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async startChecklist(
    checklistId: string,
    version: number,
    companyId?: string,
    actorId?: string,
  ) {
    const result = await this.workflow.transition({
      entityType: "CHECKLIST",
      entityId: checklistId,
      action: "CHECKLIST_START",
      version,
      actorId,
      companyId,
    });
    if (result.type !== "APPLIED") {
      throw new BadRequestException("Checklist aguardando aprovação.");
    }
    return result.entity;
  }

  async updateChecklistItemStatus(
    itemId: string,
    payload: { status: "PENDING" | "IN_PROGRESS" | "DONE" | "BLOCKED"; notes?: string },
    companyId?: string,
    actorId?: string,
  ) {
    const item = await this.prisma.implementationChecklistItem.findFirst({
      where: { id: itemId, ...(companyId ? { companyId } : {}) },
    });
    if (!item) {
      throw new NotFoundException("Item não encontrado");
    }

    const updated = await this.prisma.implementationChecklistItem.update({
      where: { id: itemId },
      data: { status: payload.status, notes: payload.notes, updatedById: actorId },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "ImplementationChecklistItem",
      entityId: updated.id,
      action: "UPDATE_STATUS",
      payload: { oldStatus: item.status, newStatus: payload.status },
    });

    return updated;
  }

  async assignChecklistItem(
    itemId: string,
    assigneeUserId: string | null,
    companyId?: string,
    actorId?: string,
  ) {
    const item = await this.prisma.implementationChecklistItem.findFirst({
      where: { id: itemId, ...(companyId ? { companyId } : {}) },
    });
    if (!item) {
      throw new NotFoundException("Item não encontrado");
    }

    const updated = await this.prisma.implementationChecklistItem.update({
      where: { id: itemId },
      data: { assigneeUserId, updatedById: actorId },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "ImplementationChecklistItem",
      entityId: updated.id,
      action: "ASSIGN",
      payload: { assigneeUserId },
    });

    return updated;
  }

  async addEvidence(
    itemId: string,
    payload: { fileBase64: string; fileName: string },
    companyId?: string,
    actorId?: string,
  ) {
    const item = await this.prisma.implementationChecklistItem.findFirst({
      where: { id: itemId, ...(companyId ? { companyId } : {}) },
    });
    if (!item) {
      throw new NotFoundException("Item não encontrado");
    }
    const result = await this.files.saveBase64(payload.fileBase64, payload.fileName);
    const evidence = await this.prisma.implementationItemEvidence.create({
      data: {
        checklistItemId: itemId,
        fileUrl: result.fileUrl,
        fileName: result.fileName,
        createdById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "ImplementationItemEvidence",
      entityId: evidence.id,
      action: "UPLOAD_EVIDENCE",
      payload: { fileName: evidence.fileName },
    });

    return evidence;
  }

  async finishChecklist(
    checklistId: string,
    version: number,
    companyId?: string,
    actorId?: string,
  ) {
    const result = await this.workflow.transition({
      entityType: "CHECKLIST",
      entityId: checklistId,
      action: "CHECKLIST_FINISH",
      version,
      actorId,
      companyId,
    });
    if (result.type !== "APPLIED") {
      throw new BadRequestException("Checklist aguardando aprovação.");
    }
    return result.entity;
  }


  private renderContractHtml(
    contract: {
      customer: {
        name: string;
        document?: string | null;
        email?: string | null;
        phone?: string | null;
      };
      project: { name: string };
      template: { content: string } | null;
    },
    signedName: string,
  ) {
    const template = contract.template?.content ?? "<h1>Contrato</h1>";
    return template
      .replace(/\{\{customerName\}\}/g, contract.customer.name ?? "-")
      .replace(/\{\{customerDocument\}\}/g, contract.customer.document ?? "-")
      .replace(/\{\{customerEmail\}\}/g, contract.customer.email ?? "-")
      .replace(/\{\{customerPhone\}\}/g, contract.customer.phone ?? "-")
      .replace(/\{\{projectName\}\}/g, contract.project.name ?? "-")
      .replace(/\{\{signedName\}\}/g, signedName ?? "-");
  }

  private generateContractPdf(
    contract: {
      customer: { name: string; document?: string | null };
      project: { name: string };
      template: { content: string } | null;
    },
    signedName: string,
  ) {
    const text = this.renderContractHtml(contract, signedName)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const header = "%PDF-1.4\n";
    const objects: string[] = [];

    const contentLines = [
      "BT",
      "/F1 12 Tf",
      "50 780 Td",
      "(Contrato Assinado) Tj",
      "0 -18 Td",
      `(${this.escapePdfText(text.slice(0, 900))}) Tj`,
      "0 -18 Td",
      `(Assinado por: ${this.escapePdfText(signedName)}) Tj`,
      "ET",
    ].join("\n");

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

  private escapePdfText(text: string) {
    return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  }
}
