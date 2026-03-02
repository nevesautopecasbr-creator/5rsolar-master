import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../iam/audit.service";
import { CreateProjectBudgetDto } from "./dto/create-project-budget.dto";
import { UpdateProjectBudgetDto } from "./dto/update-project-budget.dto";

@Injectable()
export class ProjectBudgetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string, projectId?: string) {
    return this.prisma.projectBudget.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(projectId ? { projectId } : {}),
      },
      include: { project: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string, companyId?: string) {
    const budget = await this.prisma.projectBudget.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
      include: { project: true },
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
        projectId: dto.projectId ?? undefined,
        customerName: dto.customerName,
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
      payload: { projectId: created.projectId, totalValue: created.totalValue },
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
        projectId: dto.projectId,
        customerName: dto.customerName,
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
      payload: { projectId: updated.projectId, totalValue: updated.totalValue },
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
      payload: { projectId: deleted.projectId, totalValue: deleted.totalValue },
    });
    return deleted;
  }
}
