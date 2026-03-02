import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../iam/audit.service";
import { WorkflowEngineService } from "./workflow.service";
import { WorkflowPermissionsService } from "./workflow-permissions.service";

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly workflow: WorkflowEngineService,
    private readonly permissions: WorkflowPermissionsService,
  ) {}

  async list(
    companyId: string | undefined,
    status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED",
    userId?: string,
  ) {
    if (!companyId) {
      throw new BadRequestException("companyId obrigatório.");
    }
    await this.ensureApprovalAccess(userId, companyId);
    const prisma = this.prisma as any;
    return prisma.approvalRequest.findMany({
      where: {
        companyId,
        ...(status ? { status } : {}),
      },
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        decidedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async findOne(id: string, companyId: string | undefined, userId?: string) {
    if (!companyId) {
      throw new BadRequestException("companyId obrigatório.");
    }
    await this.ensureApprovalAccess(userId, companyId);
    const prisma = this.prisma as any;
    const approval = await prisma.approvalRequest.findFirst({
      where: { id, companyId },
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        decidedBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!approval) {
      throw new NotFoundException("Solicitação não encontrada.");
    }
    return approval;
  }

  async decide(
    id: string,
    decision: "APPROVE" | "REJECT",
    note: string | undefined,
    actorId: string | undefined,
    companyId: string | undefined,
  ) {
    if (!companyId) {
      throw new BadRequestException("companyId obrigatório.");
    }
    await this.ensureApprovalAccess(actorId, companyId);
    const prisma = this.prisma as any;
    const approval = await prisma.approvalRequest.findFirst({
      where: { id, companyId },
    });
    if (!approval) {
      throw new NotFoundException("Solicitação não encontrada.");
    }
    if (approval.status !== "PENDING") {
      throw new BadRequestException("Solicitação já decidida.");
    }

    if (decision === "REJECT") {
      const updated = await prisma.approvalRequest.update({
        where: { id: approval.id },
        data: {
          status: "REJECTED",
          decidedByUserId: actorId,
          decidedAt: new Date(),
          decisionNote: note,
        },
      });

      await this.audit.log({
        actorId,
        companyId,
        entityName: "ApprovalRequest",
        entityId: approval.id,
        action: "APPROVAL_REJECTED",
        payload: { decisionNote: note ?? null },
      });

      return updated;
    }

    const approvalPayload = approval.payload as
      | {
          reason?: string | null;
          payload?: Record<string, unknown> | null;
          version?: number | null;
        }
      | null
      | undefined;

    const result = await this.workflow.transition(
      {
        entityType: approval.entityType as "SALE" | "CONTRACT" | "CHECKLIST",
        entityId: approval.entityId,
        action: approval.action,
        reason: approvalPayload?.reason ?? undefined,
        payload: approvalPayload?.payload ?? undefined,
        version: approvalPayload?.version ?? 0,
        actorId,
        companyId,
      },
      { skipApproval: true },
    );

    if (result.type !== "APPLIED") {
      throw new BadRequestException("Não foi possível aplicar a aprovação.");
    }

    const updated = await prisma.approvalRequest.update({
      where: { id: approval.id },
      data: {
        status: "APPROVED",
        decidedByUserId: actorId,
        decidedAt: new Date(),
        decisionNote: note,
      },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "ApprovalRequest",
      entityId: approval.id,
      action: "APPROVAL_APPROVED",
      payload: { decisionNote: note ?? null },
    });

    return updated;
  }

  private async ensureApprovalAccess(userId: string | undefined, companyId: string | undefined) {
    try {
      await this.permissions.ensureAnyPermission(userId, companyId, [
        "contratos.write",
        "obras.write",
      ]);
    } catch {
      await this.permissions.ensureAdmin(userId, companyId);
    }
  }
}
