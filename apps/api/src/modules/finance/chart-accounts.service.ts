import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateChartAccountDto } from "./dto/create-chart-account.dto";
import { UpdateChartAccountDto } from "./dto/update-chart-account.dto";
import { AuditService } from "../iam/audit.service";

@Injectable()
export class ChartAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.chartOfAccount.findMany({
      where: companyId ? { companyId } : undefined,
    });
  }

  async findOne(id: string, companyId?: string) {
    const account = await this.prisma.chartOfAccount.findFirst({
      where: companyId ? { id, companyId } : { id },
    });
    if (!account) {
      throw new NotFoundException("Conta contábil não encontrada");
    }
    return account;
  }

  async create(
    companyId: string | undefined,
    dto: CreateChartAccountDto,
    actorId?: string,
  ) {
    const created = await this.prisma.chartOfAccount.create({
      data: {
        companyId,
        code: dto.code,
        name: dto.name,
        type: dto.type,
        isActive: dto.isActive ?? true,
        createdById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "ChartOfAccount",
      entityId: created.id,
      action: "CREATE",
      payload: { code: created.code },
    });

    return created;
  }

  async update(
    id: string,
    dto: UpdateChartAccountDto,
    actorId?: string,
    companyId?: string,
  ) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.chartOfAccount.update({
      where: { id },
      data: {
        code: dto.code,
        name: dto.name,
        type: dto.type,
        isActive: dto.isActive,
        updatedById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "ChartOfAccount",
      entityId: updated.id,
      action: "UPDATE",
      payload: { code: updated.code },
    });

    return updated;
  }

  async remove(id: string, actorId?: string, companyId?: string) {
    const account = await this.findOne(id, companyId);
    const deleted = await this.prisma.chartOfAccount.delete({ where: { id } });
    await this.audit.log({
      actorId,
      companyId: account.companyId ?? undefined,
      entityName: "ChartOfAccount",
      entityId: deleted.id,
      action: "DELETE",
      payload: { code: deleted.code },
    });
    return deleted;
  }
}