import { Injectable, NotFoundException } from "@nestjs/common";
import { DocumentTemplateType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../iam/audit.service";
import { CreateDocumentTemplateDto } from "./dto/create-document-template.dto";
import { UpdateDocumentTemplateDto } from "./dto/update-document-template.dto";
import { FileService } from "../post-proposal/storage/file.service";
import { UploadTemplateImageDto } from "./dto/upload-template-image.dto";

type VariableItem = {
  label: string;
  placeholder: string;
  description: string;
  example: string;
  category: string;
};

@Injectable()
export class DocumentTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly files: FileService,
  ) {}

  async findAll(companyId?: string, type?: DocumentTemplateType, active?: boolean) {
    return this.prisma.documentTemplate.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(type ? { type } : {}),
        ...(active !== undefined ? { isActive: active } : {}),
      },
      orderBy: [{ type: "asc" }, { updatedAt: "desc" }],
    });
  }

  async findOne(id: string, companyId?: string) {
    const found = await this.prisma.documentTemplate.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!found) throw new NotFoundException("Template não encontrado");
    return found;
  }

  async create(companyId: string | undefined, dto: CreateDocumentTemplateDto, actorId?: string) {
    if (dto.isDefault) {
      await this.clearTypeDefault(companyId, dto.type);
    }
    if (dto.isActive) {
      await this.clearTypeActive(companyId, dto.type);
    }

    const created = await this.prisma.documentTemplate.create({
      data: {
        companyId,
        name: dto.name,
        type: dto.type,
        content: dto.content,
        isActive: dto.isActive ?? true,
        isDefault: dto.isDefault ?? false,
        createdById: actorId,
      },
    });
    await this.audit.log({
      actorId,
      companyId,
      entityName: "DocumentTemplate",
      entityId: created.id,
      action: "CREATE",
      payload: { name: created.name, type: created.type },
    });
    return created;
  }

  async update(
    id: string,
    dto: UpdateDocumentTemplateDto,
    actorId?: string,
    companyId?: string,
  ) {
    const current = await this.findOne(id, companyId);
    const nextType = dto.type ?? current.type;
    if (dto.isDefault) {
      await this.clearTypeDefault(companyId, nextType);
    }
    if (dto.isActive) {
      await this.clearTypeActive(companyId, nextType);
    }

    const updated = await this.prisma.documentTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        content: dto.content,
        isActive: dto.isActive,
        isDefault: dto.isDefault,
        version: dto.content !== undefined ? current.version + 1 : current.version,
        updatedById: actorId,
      },
    });
    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "DocumentTemplate",
      entityId: updated.id,
      action: "UPDATE",
      payload: { name: updated.name, type: updated.type },
    });
    return updated;
  }

  async remove(id: string, actorId?: string, companyId?: string) {
    const current = await this.findOne(id, companyId);
    const deleted = await this.prisma.documentTemplate.delete({ where: { id } });
    await this.audit.log({
      actorId,
      companyId: current.companyId ?? undefined,
      entityName: "DocumentTemplate",
      entityId: deleted.id,
      action: "DELETE",
      payload: { name: deleted.name, type: deleted.type },
    });
    return deleted;
  }

  async activate(id: string, actorId?: string, companyId?: string) {
    const current = await this.findOne(id, companyId);
    await this.clearTypeActive(companyId, current.type);
    const updated = await this.prisma.documentTemplate.update({
      where: { id },
      data: { isActive: true, updatedById: actorId },
    });
    await this.audit.log({
      actorId,
      companyId: current.companyId ?? undefined,
      entityName: "DocumentTemplate",
      entityId: updated.id,
      action: "ACTIVATE",
      payload: { type: updated.type },
    });
    return updated;
  }

  async getActiveByType(type: DocumentTemplateType, companyId?: string) {
    const active = await this.prisma.documentTemplate.findFirst({
      where: { ...(companyId ? { companyId } : {}), type, isActive: true },
      orderBy: { updatedAt: "desc" },
    });
    if (active) return active;
    return this.prisma.documentTemplate.findFirst({
      where: { ...(companyId ? { companyId } : {}), type },
      orderBy: { updatedAt: "desc" },
    });
  }

  getVariables(type: DocumentTemplateType): VariableItem[] {
    if (type === "CONTRACT") {
      return [
        this.item("Cliente", "{{customerName}}", "Nome do cliente", "João Silva", "Cliente"),
        this.item("Documento", "{{customerDocument}}", "CPF/CNPJ", "123.456.789-00", "Cliente"),
        this.item("E-mail", "{{customerEmail}}", "E-mail do cliente", "cliente@dominio.com", "Cliente"),
        this.item("Telefone", "{{customerPhone}}", "Telefone do cliente", "(11) 99999-9999", "Cliente"),
        this.item("Endereço", "{{customerAddress}}", "Endereço do cliente", "Rua A, 123", "Cliente"),
        this.item("Projeto", "{{projectName}}", "Nome do projeto", "Usina Residencial", "Projeto"),
        this.item("kWp", "{{projectKwp}}", "Potência do sistema", "5.12", "Projeto"),
        this.item("Cidade", "{{projectCity}}", "Cidade do projeto", "São Paulo", "Projeto"),
        this.item("UF", "{{projectState}}", "Estado do projeto", "SP", "Projeto"),
        this.item("Valor total", "{{totalValue}}", "Valor total formatado", "R$ 42.000,00", "Financeiro"),
        this.item("Assinante", "{{signedName}}", "Nome de quem assinou", "João Silva", "Assinatura"),
      ];
    }
    return [
      this.item("Cliente", "{{customerName}}", "Nome do cliente", "João Silva", "Cliente"),
      this.item("UC", "{{consumerUnitCode}}", "Unidade consumidora", "123456789", "Cliente"),
      this.item("Consumo", "{{consumptionKwh}}", "Consumo em kWh", "420", "Técnico"),
      this.item("Potência", "{{systemPowerKwp}}", "Potência do sistema", "5.12", "Técnico"),
      this.item("Economia mensal", "{{monthlySavings}}", "Economia estimada", "R$ 380,00", "Financeiro"),
      this.item("Payback", "{{paybackYears}}", "Payback em anos", "4.8 anos", "Financeiro"),
      this.item("Condições pagamento", "{{paymentTerms}}", "Texto de pagamento", "Entrada + 12x", "Financeiro"),
      this.item("Fio B", "{{fioBPct}}", "Percentual do fio B", "15.0%", "Regulatório"),
      this.item("Fator simultaneidade", "{{simultaneityFactor}}", "Fator de simultaneidade", "0.8", "Regulatório"),
      this.item("Grupo consumidor", "{{consumerGroup}}", "Grupo regulatório", "B", "Regulatório"),
      this.item("Modalidade", "{{modality}}", "Modalidade da proposta", "Autoconsumo remoto", "Regulatório"),
      this.item("Mão de obra", "{{laborCost}}", "Custo de mão de obra", "R$ 4.000,00", "Custos"),
      this.item("Materiais", "{{materialCost}}", "Custo de materiais", "R$ 20.000,00", "Custos"),
      this.item("Impostos", "{{taxAmount}}", "Valor de impostos", "R$ 2.000,00", "Custos"),
      this.item("Valor total", "{{totalValue}}", "Valor total da proposta", "R$ 30.000,00", "Financeiro"),
      this.item("Observações", "{{notes}}", "Observações livres", "Prazo de instalação em 45 dias.", "Outros"),
      this.item("Produtos", "{{productsList}}", "Lista textual de produtos/serviços", "1. Módulo X - Qtd: 10", "Itens"),
    ];
  }

  async uploadImage(payload: UploadTemplateImageDto) {
    const fileName = payload.fileName.replace(/\s+/g, "-").toLowerCase();
    return this.files.saveBase64(payload.fileBase64, `template-image-${Date.now()}-${fileName}`);
  }

  private item(
    label: string,
    placeholder: string,
    description: string,
    example: string,
    category: string,
  ): VariableItem {
    return { label, placeholder, description, example, category };
  }

  private async clearTypeActive(companyId: string | undefined, type: DocumentTemplateType) {
    await this.prisma.documentTemplate.updateMany({
      where: { ...(companyId ? { companyId } : {}), type, isActive: true },
      data: { isActive: false },
    });
  }

  private async clearTypeDefault(companyId: string | undefined, type: DocumentTemplateType) {
    await this.prisma.documentTemplate.updateMany({
      where: { ...(companyId ? { companyId } : {}), type, isDefault: true },
      data: { isDefault: false },
    });
  }
}
