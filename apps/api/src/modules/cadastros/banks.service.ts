import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateBankDto } from "./dto/create-bank.dto";
import { UpdateBankDto } from "./dto/update-bank.dto";
import { AuditService } from "../iam/audit.service";

@Injectable()
export class BanksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.bank.findMany({
      where: companyId ? { companyId } : undefined,
    });
  }

  async findOne(id: string, companyId?: string) {
    const bank = await this.prisma.bank.findFirst({
      where: companyId ? { id, companyId } : { id },
    });
    if (!bank) {
      throw new NotFoundException("Banco não encontrado");
    }
    return bank;
  }

  async create(
    companyId: string | undefined,
    dto: CreateBankDto,
    actorId?: string,
  ) {
    const created = await this.prisma.bank.create({
      data: {
        companyId,
        name: dto.name,
        code: dto.code,
        agency: dto.agency,
        accountNumber: dto.accountNumber,
        accountType: dto.accountType,
        createdById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "Bank",
      entityId: created.id,
      action: "CREATE",
      payload: { name: created.name },
    });

    return created;
  }

  async update(
    id: string,
    dto: UpdateBankDto,
    actorId?: string,
    companyId?: string,
  ) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.bank.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        agency: dto.agency,
        accountNumber: dto.accountNumber,
        accountType: dto.accountType,
        updatedById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "Bank",
      entityId: updated.id,
      action: "UPDATE",
      payload: { name: updated.name },
    });

    return updated;
  }

  async remove(id: string, actorId?: string, companyId?: string) {
    const bank = await this.findOne(id, companyId);
    const deleted = await this.prisma.bank.delete({ where: { id } });
    await this.audit.log({
      actorId,
      companyId: bank.companyId ?? undefined,
      entityName: "Bank",
      entityId: deleted.id,
      action: "DELETE",
      payload: { name: deleted.name },
    });
    return deleted;
  }
}