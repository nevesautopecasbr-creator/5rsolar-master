import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateReceivableDto } from "./dto/create-receivable.dto";
import { UpdateReceivableDto } from "./dto/update-receivable.dto";
import { AuditService } from "../iam/audit.service";

@Injectable()
export class ReceivablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.receivable.findMany({
      where: companyId ? { companyId } : undefined,
    });
  }

  async findOne(id: string, companyId?: string) {
    const receivable = await this.prisma.receivable.findFirst({
      where: companyId ? { id, companyId } : { id },
    });
    if (!receivable) {
      throw new NotFoundException("Conta a receber não encontrada");
    }
    return receivable;
  }

  async create(
    companyId: string | undefined,
    dto: CreateReceivableDto,
    actorId?: string,
  ) {
    if (dto.amount == null || Number.isNaN(Number(dto.amount))) {
      throw new BadRequestException("Valor inválido.");
    }

    const due = new Date(dto.dueDate);
    if (Number.isNaN(due.getTime())) {
      throw new BadRequestException("Data de vencimento inválida.");
    }
    let receivedAt: Date | undefined;
    if (dto.receivedAt) {
      receivedAt = new Date(dto.receivedAt);
      if (Number.isNaN(receivedAt.getTime())) {
        throw new BadRequestException("Data de recebimento inválida.");
      }
    }

    try {
      const created = await this.prisma.receivable.create({
        data: {
          companyId,
          projectId: dto.projectId,
          customerId: dto.customerId,
          contractId: dto.contractId,
          accountId: dto.accountId,
          description: dto.description,
          amount: dto.amount,
          dueDate: due,
          status: dto.status,
          receivedAt,
          paymentMethod: dto.paymentMethod,
          installmentNo: dto.installmentNo,
          totalInstallments: dto.totalInstallments,
          createdById: actorId,
        },
      });

      await this.audit.log({
        actorId,
        companyId,
        entityName: "Receivable",
        entityId: created.id,
        action: "CREATE",
        payload: { amount: created.amount },
      });

      return created;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
        throw new BadRequestException(
          "Referencia invalida: projeto, cliente, contrato ou conta contabil nao encontrado (ou ID incorreto).",
        );
      }
      throw e;
    }
  }

  async update(
    id: string,
    dto: UpdateReceivableDto,
    actorId?: string,
    companyId?: string,
  ) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.receivable.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        customerId: dto.customerId,
        contractId: dto.contractId,
        accountId: dto.accountId,
        description: dto.description,
        amount: dto.amount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: dto.status,
        receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : undefined,
        paymentMethod: dto.paymentMethod,
        installmentNo: dto.installmentNo,
        totalInstallments: dto.totalInstallments,
        updatedById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "Receivable",
      entityId: updated.id,
      action: "UPDATE",
      payload: { amount: updated.amount },
    });

    return updated;
  }

  async remove(id: string, actorId?: string, companyId?: string) {
    const receivable = await this.findOne(id, companyId);
    const deleted = await this.prisma.receivable.delete({ where: { id } });
    await this.audit.log({
      actorId,
      companyId: receivable.companyId ?? undefined,
      entityName: "Receivable",
      entityId: deleted.id,
      action: "DELETE",
      payload: { amount: deleted.amount },
    });
    return deleted;
  }
}
