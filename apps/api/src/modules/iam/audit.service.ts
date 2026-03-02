import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

type AuditLogInput = {
  actorId?: string;
  companyId?: string;
  entityName: string;
  entityId: string;
  action: string;
  payload?: Prisma.InputJsonValue | Record<string, unknown>;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogInput) {
    return this.prisma.auditLog.create({
      data: {
        actorId: entry.actorId,
        companyId: entry.companyId,
        entityName: entry.entityName,
        entityId: entry.entityId,
        action: entry.action,
        payload: (entry.payload ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
