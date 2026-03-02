import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCashAccountDto } from "./dto/create-cash-account.dto";
import { UpdateCashAccountDto } from "./dto/update-cash-account.dto";
import { AuditService } from "../iam/audit.service";

@Injectable()
export class CashAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.cashAccount.findMany({
      where: companyId ? { companyId } : undefined,
    });
  }

  async findOne(id: string, companyId?: string) {
    const account = await this.prisma.cashAccount.findFirst({
      where: companyId ? { id, companyId } : { id },
    });
    if (!account) {
      throw new NotFoundException("Conta de caixa/banco não encontrada");
    }
    return account;
  }

  async create(
    companyId: string | undefined,
    dto: CreateCashAccountDto,
    actorId?: string,
  ) {
    const created = await this.prisma.cashAccount.create({
      data: {
        companyId,
        bankId: dto.bankId,
        name: dto.name,
        number: dto.number,
        isActive: dto.isActive ?? true,
        openingBalance: dto.openingBalance,
        createdById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "CashAccount",
      entityId: created.id,
      action: "CREATE",
      payload: { name: created.name },
    });

    return created;
  }

  async update(
    id: string,
    dto: UpdateCashAccountDto,
    actorId?: string,
    companyId?: string,
  ) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.cashAccount.update({
      where: { id },
      data: {
        bankId: dto.bankId,
        name: dto.name,
        number: dto.number,
        isActive: dto.isActive,
        openingBalance: dto.openingBalance,
        updatedById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "CashAccount",
      entityId: updated.id,
      action: "UPDATE",
      payload: { name: updated.name },
    });

    return updated;
  }

  async remove(id: string, actorId?: string, companyId?: string) {
    const account = await this.findOne(id, companyId);
    const deleted = await this.prisma.cashAccount.delete({ where: { id } });
    await this.audit.log({
      actorId,
      companyId: account.companyId ?? undefined,
      entityName: "CashAccount",
      entityId: deleted.id,
      action: "DELETE",
      payload: { name: deleted.name },
    });
    return deleted;
  }
}