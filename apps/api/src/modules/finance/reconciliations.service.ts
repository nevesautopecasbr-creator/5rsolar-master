import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateReconciliationDto } from "./dto/create-reconciliation.dto";
import { AuditService } from "../iam/audit.service";

@Injectable()
export class ReconciliationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll(companyId?: string) {
    return this.prisma.bankReconciliation.findMany({ where: { companyId } });
  }

  async create(companyId: string | undefined, dto: CreateReconciliationDto, actorId?: string) {
    const created = await this.prisma.bankReconciliation.create({
      data: {
        companyId,
        cashAccountId: dto.cashAccountId,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        createdById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "BankReconciliation",
      entityId: created.id,
      action: "CREATE",
      payload: { cashAccountId: created.cashAccountId },
    });

    return created;
  }
}
