import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePayableDto } from "./dto/create-payable.dto";
import { UpdatePayableDto } from "./dto/update-payable.dto";
import { AuditService } from "../iam/audit.service";

@Injectable()
export class PayablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.payable.findMany({
      where: companyId ? { companyId } : undefined,
    });
  }

  async findOne(id: string, companyId?: string) {
    const payable = await this.prisma.payable.findFirst({
      where: companyId ? { id, companyId } : { id },
    });
    if (!payable) {
      throw new NotFoundException("Conta a pagar não encontrada");
    }
    return payable;
  }

  async create(
    companyId: string | undefined,
    dto: CreatePayableDto,
    actorId?: string,
  ) {
    const created = await this.prisma.payable.create({
      data: {
        companyId,
        projectId: dto.projectId,
        supplierId: dto.supplierId,
        purchaseOrderId: dto.purchaseOrderId,
        accountId: dto.accountId,
        description: dto.description,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        status: dto.status,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
        paymentMethod: dto.paymentMethod,
        isDirectCost: dto.isDirectCost ?? false,
        type: dto.type,
        recurrenceRule: dto.recurrenceRule,
        nextDueDate: dto.nextDueDate ? new Date(dto.nextDueDate) : undefined,
        createdById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "Payable",
      entityId: created.id,
      action: "CREATE",
      payload: { amount: created.amount },
    });

    return created;
  }

  async update(
    id: string,
    dto: UpdatePayableDto,
    actorId?: string,
    companyId?: string,
  ) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.payable.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        supplierId: dto.supplierId,
        purchaseOrderId: dto.purchaseOrderId,
        accountId: dto.accountId,
        description: dto.description,
        amount: dto.amount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: dto.status,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
        paymentMethod: dto.paymentMethod,
        isDirectCost: dto.isDirectCost,
        type: dto.type,
        recurrenceRule: dto.recurrenceRule,
        nextDueDate: dto.nextDueDate ? new Date(dto.nextDueDate) : undefined,
        updatedById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "Payable",
      entityId: updated.id,
      action: "UPDATE",
      payload: { amount: updated.amount },
    });

    return updated;
  }

  async remove(id: string, actorId?: string, companyId?: string) {
    const payable = await this.findOne(id, companyId);
    const deleted = await this.prisma.payable.delete({ where: { id } });
    await this.audit.log({
      actorId,
      companyId: payable.companyId ?? undefined,
      entityName: "Payable",
      entityId: deleted.id,
      action: "DELETE",
      payload: { amount: deleted.amount },
    });
    return deleted;
  }
}