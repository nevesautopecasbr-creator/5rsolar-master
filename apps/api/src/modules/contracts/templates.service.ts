import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateContractTemplateDto } from "./dto/create-contract-template.dto";
import { UpdateContractTemplateDto } from "./dto/update-contract-template.dto";
import { AuditService } from "../iam/audit.service";

@Injectable()
export class TemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.contractTemplate.findMany({
      where: companyId ? { companyId } : undefined,
    });
  }

  async findOne(id: string, companyId?: string) {
    const template = await this.prisma.contractTemplate.findFirst({
      where: companyId ? { id, companyId } : { id },
    });
    if (!template) {
      throw new NotFoundException("Template não encontrado");
    }
    return template;
  }

  async create(
    companyId: string | undefined,
    dto: CreateContractTemplateDto,
    actorId?: string,
  ) {
    const created = await this.prisma.contractTemplate.create({
      data: {
        companyId,
        name: dto.name,
        content: dto.content,
        isActive: dto.isActive ?? true,
        createdById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "ContractTemplate",
      entityId: created.id,
      action: "CREATE",
      payload: { name: created.name },
    });

    return created;
  }

  async update(
    id: string,
    dto: UpdateContractTemplateDto,
    actorId?: string,
    companyId?: string,
  ) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.contractTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        content: dto.content,
        isActive: dto.isActive,
        updatedById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "ContractTemplate",
      entityId: updated.id,
      action: "UPDATE",
      payload: { name: updated.name },
    });

    return updated;
  }

  async remove(id: string, actorId?: string, companyId?: string) {
    const template = await this.findOne(id, companyId);
    const deleted = await this.prisma.contractTemplate.delete({
      where: { id },
    });
    await this.audit.log({
      actorId,
      companyId: template.companyId ?? undefined,
      entityName: "ContractTemplate",
      entityId: deleted.id,
      action: "DELETE",
      payload: { name: deleted.name },
    });
    return deleted;
  }
}