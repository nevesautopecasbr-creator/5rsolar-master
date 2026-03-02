import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateContractDto } from "./dto/create-contract.dto";
import { UpdateContractDto } from "./dto/update-contract.dto";
import { CreateAddendumDto } from "./dto/create-addendum.dto";
import { AuditService } from "../iam/audit.service";

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.contract.findMany({
      where: companyId ? { companyId } : undefined,
      include: { receivables: true, addenda: true },
    });
  }

  async findOne(id: string, companyId?: string) {
    const contract = await this.prisma.contract.findFirst({
      where: companyId ? { id, companyId } : { id },
      include: { receivables: true, addenda: true },
    });
    if (!contract) {
      throw new NotFoundException("Contrato não encontrado");
    }
    return contract;
  }

  private buildInstallments(
    totalValue: number,
    count: number,
  ): number[] {
    const base = Number((totalValue / count).toFixed(2));
    const values = Array(count).fill(base);
    const sum = Number((base * count).toFixed(2));
    const diff = Number((totalValue - sum).toFixed(2));
    if (diff !== 0) {
      values[count - 1] = Number((values[count - 1] + diff).toFixed(2));
    }
    return values;
  }

  async create(
    companyId: string | undefined,
    dto: CreateContractDto,
    actorId?: string,
  ) {
    const created = await this.prisma.contract.create({
      data: {
        companyId,
        projectId: dto.projectId,
        customerId: dto.customerId,
        templateId: dto.templateId,
        status: dto.status,
        totalValue: dto.totalValue,
        signedAt: dto.signedAt ? new Date(dto.signedAt) : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        notes: dto.notes,
        createdById: actorId,
      },
    });

    const installmentsCount = dto.installmentsCount ?? 0;
    if (installmentsCount > 0 && dto.firstDueDate) {
      const intervalDays = dto.intervalDays ?? 30;
      const values = this.buildInstallments(dto.totalValue, installmentsCount);
      const first = new Date(dto.firstDueDate);

      for (let i = 0; i < installmentsCount; i += 1) {
        const dueDate = new Date(first);
        dueDate.setDate(first.getDate() + intervalDays * i);
        await this.prisma.receivable.create({
          data: {
            companyId,
            projectId: created.projectId,
            customerId: created.customerId,
            contractId: created.id,
            accountId: dto.receivableAccountId,
            description: `Contrato ${created.id} parcela ${i + 1}/${installmentsCount}`,
            amount: values[i],
            dueDate,
            installmentNo: i + 1,
            totalInstallments: installmentsCount,
            createdById: actorId,
          },
        });
      }
    }

    await this.audit.log({
      actorId,
      companyId,
      entityName: "Contract",
      entityId: created.id,
      action: "CREATE",
      payload: { totalValue: created.totalValue },
    });

    return this.findOne(created.id, companyId);
  }

  async update(
    id: string,
    dto: UpdateContractDto,
    actorId?: string,
    companyId?: string,
  ) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.contract.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        customerId: dto.customerId,
        templateId: dto.templateId,
        status: dto.status,
        totalValue: dto.totalValue,
        signedAt: dto.signedAt ? new Date(dto.signedAt) : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        notes: dto.notes,
        updatedById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "Contract",
      entityId: updated.id,
      action: "UPDATE",
      payload: { totalValue: updated.totalValue },
    });

    return this.findOne(updated.id, companyId);
  }

  async remove(id: string, actorId?: string, companyId?: string) {
    const contract = await this.findOne(id, companyId);
    const deleted = await this.prisma.contract.delete({ where: { id } });
    await this.audit.log({
      actorId,
      companyId: contract.companyId ?? undefined,
      entityName: "Contract",
      entityId: deleted.id,
      action: "DELETE",
      payload: { totalValue: deleted.totalValue },
    });
    return deleted;
  }

  async addAddendum(
    contractId: string,
    dto: CreateAddendumDto,
    actorId?: string,
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });
    if (!contract) {
      throw new NotFoundException("Contrato não encontrado");
    }

    const addendum = await this.prisma.contractAddendum.create({
      data: {
        contractId,
        title: dto.title,
        content: dto.content,
        valueChange: dto.valueChange,
        createdById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId: contract.companyId ?? undefined,
      entityName: "ContractAddendum",
      entityId: addendum.id,
      action: "CREATE",
      payload: { title: addendum.title },
    });

    return addendum;
  }
}