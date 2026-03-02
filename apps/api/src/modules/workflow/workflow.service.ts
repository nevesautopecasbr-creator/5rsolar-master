import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ChecklistStatus,
  ContractStatus,
  Prisma,
  SaleStatus,
  SignatureType,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../iam/audit.service";

type EntityType = "SALE" | "CONTRACT" | "CHECKLIST";
type ApprovalEntityType = "SALE" | "CONTRACT" | "CHECKLIST";
type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

type TransitionContext = {
  entityType: EntityType;
  entityId: string;
  action: string;
  reason?: string;
  payload?: Record<string, unknown>;
  version: number;
  actorId?: string;
  companyId?: string;
};

type TransitionDefinition = {
  action: string;
  label: string;
  allowedFrom: string[];
  toStatus: string | null;
  requiresReason?: boolean;
  requiresApproval?: (context: TransitionContext, entity: Record<string, unknown>) => boolean;
  validate?: (context: TransitionContext, entity: Record<string, unknown>) => void;
};

type TransitionResult =
  | { type: "APPLIED"; entity: Record<string, unknown> }
  | { type: "PENDING"; approvalRequestId: string };

@Injectable()
export class WorkflowEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getAllowedActions(
    entityType: EntityType,
    entityId: string,
    companyId?: string,
  ) {
    const entity = await this.loadEntity(entityType, entityId, companyId);
    const status = this.getEntityStatus(entityType, entity);
    const version = this.getEntityVersion(entityType, entity);
    const blocked = this.getChecklistBlocked(entityType, entity);

    const prisma = this.prisma as any;
    const pendingApprovals = companyId
      ? await prisma.approvalRequest.findMany({
          where: {
            companyId,
            entityType: entityType as ApprovalEntityType,
            entityId,
            status: "PENDING" as ApprovalStatus,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : [];

    if (blocked.isBlocked) {
      return {
        status,
        version,
        isBlocked: true,
        blockedReason: blocked.blockedReason,
        allowedActions: [],
        pendingApprovals,
      };
    }

    const transitions = this.getTransitions(entityType);
    const allowedActions = transitions
      .filter((transition) => transition.allowedFrom.includes(status))
      .filter((transition) => {
        if (!transition.validate) return true;
        try {
          transition.validate({ entityType, entityId, action: transition.action, version }, entity);
          return true;
        } catch {
          return false;
        }
      })
      .map((transition) => ({
        action: transition.action,
        label: transition.label,
        requiresReason: Boolean(transition.requiresReason),
        requiresApproval: Boolean(transition.requiresApproval?.({ entityType, entityId, action: transition.action, version }, entity)),
        payload:
          entityType === "SALE" && transition.action === "SALE_MARK_LOST"
            ? { reasonType: "CANCELLED" }
            : undefined,
      }));

    return {
      status,
      version,
      isBlocked: false,
      blockedReason: null,
      allowedActions,
      pendingApprovals,
    };
  }

  async transition(context: TransitionContext, options?: { skipApproval?: boolean }) {
    const entity = await this.loadEntity(context.entityType, context.entityId, context.companyId);
    if (context.entityType === "CHECKLIST") {
      const blocked = this.getChecklistBlocked(context.entityType, entity);
      if (blocked.isBlocked) {
        throw new BadRequestException("Checklist bloqueado.");
      }
    }

    const transition = this.getTransition(context.entityType, context.action);
    const currentStatus = this.getEntityStatus(context.entityType, entity);
    if (!transition.allowedFrom.includes(currentStatus)) {
      throw new BadRequestException("Ação inválida para o status atual.");
    }
    if (transition.requiresReason && !context.reason) {
      throw new BadRequestException("Motivo obrigatório.");
    }
    if (transition.validate) {
      transition.validate(context, entity);
    }

    if (!options?.skipApproval && transition.requiresApproval?.(context, entity)) {
      if (!context.companyId) {
        throw new BadRequestException("companyId obrigatório para aprovação.");
      }
      if (!context.actorId) {
        throw new BadRequestException("Usuário obrigatório para aprovação.");
      }
      const prisma = this.prisma as any;
      const existing = await prisma.approvalRequest.findFirst({
        where: {
          companyId: context.companyId,
          entityType: context.entityType as ApprovalEntityType,
          entityId: context.entityId,
          action: context.action,
          status: "PENDING" as ApprovalStatus,
        },
      });
      if (existing) {
        return { type: "PENDING", approvalRequestId: existing.id } as TransitionResult;
      }

      const approval = await prisma.approvalRequest.create({
        data: {
          companyId: context.companyId!,
          entityType: context.entityType as ApprovalEntityType,
          entityId: context.entityId,
          action: context.action,
          payload: {
            reason: context.reason ?? null,
            payload: context.payload ?? null,
            version: context.version,
          } as Prisma.InputJsonValue,
          requestedByUserId: context.actorId!,
          status: "PENDING" as ApprovalStatus,
        },
      });

      await this.audit.log({
        actorId: context.actorId,
        companyId: context.companyId,
        entityName: this.mapEntityName(context.entityType),
        entityId: context.entityId,
        action: "APPROVAL_REQUESTED",
        payload: {
          approvalRequestId: approval.id,
          action: context.action,
          reason: context.reason ?? null,
        },
      });

      return { type: "PENDING", approvalRequestId: approval.id } as TransitionResult;
    }

    const applied = await this.prisma.$transaction(async (tx) => {
      const updated = await this.applyTransition(tx, context, entity);
      await this.auditTransition(tx, context, entity, updated);
      await this.applySideEffects(tx, context, entity, updated);
      return updated;
    });

    return { type: "APPLIED", entity: applied } as TransitionResult;
  }

  private getTransitions(entityType: EntityType): TransitionDefinition[] {
    switch (entityType) {
      case "SALE":
        return [
          {
            action: "SALE_SET_PROPOSAL",
            label: "Enviar proposta",
            allowedFrom: [SaleStatus.NEW],
            toStatus: SaleStatus.PROPOSAL,
          },
          {
            action: "SALE_MARK_WON",
            label: "Marcar como ganha",
            allowedFrom: [SaleStatus.PROPOSAL],
            toStatus: SaleStatus.WON,
          },
          {
            action: "SALE_MARK_LOST",
            label: "Cancelar venda",
            allowedFrom: [SaleStatus.NEW, SaleStatus.PROPOSAL],
            toStatus: SaleStatus.LOST,
            requiresReason: true,
          },
        ];
      case "CONTRACT":
        return [
          {
            action: "CONTRACT_REQUEST_SIGNATURE",
            label: "Solicitar assinatura",
            allowedFrom: [ContractStatus.DRAFT],
            toStatus: null,
          },
          {
            action: "CONTRACT_ACTIVATE",
            label: "Ativar contrato",
            allowedFrom: [ContractStatus.DRAFT],
            toStatus: ContractStatus.ACTIVE,
            validate: (context, entity) => {
              const contract = entity as { signedAt?: Date | null };
              const signedAt = (context.payload?.signedAt as string | undefined) ?? contract.signedAt;
              if (!signedAt) {
                throw new BadRequestException("Assinatura obrigatória.");
              }
            },
          },
          {
            action: "CONTRACT_SUSPEND",
            label: "Suspender contrato",
            allowedFrom: [ContractStatus.ACTIVE],
            toStatus: ContractStatus.SUSPENDED,
            requiresReason: true,
            requiresApproval: () => true,
          },
          {
            action: "CONTRACT_RESUME",
            label: "Reativar contrato",
            allowedFrom: [ContractStatus.SUSPENDED],
            toStatus: ContractStatus.ACTIVE,
            requiresReason: true,
          },
          {
            action: "CONTRACT_COMPLETE",
            label: "Concluir contrato",
            allowedFrom: [ContractStatus.ACTIVE],
            toStatus: ContractStatus.COMPLETED,
          },
          {
            action: "CONTRACT_CANCEL",
            label: "Cancelar contrato",
            allowedFrom: [ContractStatus.DRAFT, ContractStatus.ACTIVE, ContractStatus.SUSPENDED],
            toStatus: ContractStatus.CANCELLED,
            requiresReason: true,
            requiresApproval: (_context, entity) => {
              const contract = entity as { status: ContractStatus };
              return ["ACTIVE", "SUSPENDED"].includes(String(contract.status));
            },
          },
        ];
      case "CHECKLIST":
        return [
          {
            action: "CHECKLIST_START",
            label: "Iniciar checklist",
            allowedFrom: [ChecklistStatus.NOT_STARTED],
            toStatus: ChecklistStatus.IN_PROGRESS,
            validate: (_context, entity) => {
              const checklist = entity as { contract?: { status: ContractStatus } | null };
              if (checklist.contract?.status !== ContractStatus.ACTIVE) {
                throw new BadRequestException("Contrato não está ativo.");
              }
            },
          },
          {
            action: "CHECKLIST_FINISH",
            label: "Concluir checklist",
            allowedFrom: [ChecklistStatus.IN_PROGRESS],
            toStatus: ChecklistStatus.DONE,
            validate: (_context, entity) => {
              const checklist = entity as {
                items?: Array<{ isRequired: boolean; status: string }>;
              };
              const items = checklist.items ?? [];
              if (items.length === 0) {
                return;
              }
              const missing = items.filter((item) => item.isRequired && item.status !== "DONE");
              if (missing.length > 0) {
                throw new BadRequestException("Existem itens obrigatórios pendentes.");
              }
            },
          },
        ];
      default:
        return [];
    }
  }

  private getTransition(entityType: EntityType, action: string) {
    const transitions = this.getTransitions(entityType);
    const transition = transitions.find((entry) => entry.action === action);
    if (!transition) {
      throw new BadRequestException("Ação não suportada.");
    }
    return transition;
  }

  private async loadEntity(entityType: EntityType, entityId: string, companyId?: string) {
    if (entityType === "SALE") {
      const sale = await this.prisma.sale.findFirst({
        where: { id: entityId, ...(companyId ? { companyId } : {}) },
      });
      if (!sale) throw new NotFoundException("Venda não encontrada");
      return sale;
    }
    if (entityType === "CONTRACT") {
      const contract = await this.prisma.contract.findFirst({
        where: { id: entityId, ...(companyId ? { companyId } : {}) },
      });
      if (!contract) throw new NotFoundException("Contrato não encontrado");
      return contract;
    }
    if (entityType === "CHECKLIST") {
      const checklist = await this.prisma.implementationChecklist.findFirst({
        where: { id: entityId, ...(companyId ? { companyId } : {}) },
        include: { contract: true, items: true },
      });
      if (!checklist) throw new NotFoundException("Checklist não encontrado");
      return checklist;
    }
    throw new BadRequestException("Tipo de entidade inválido.");
  }

  private getEntityStatus(entityType: EntityType, entity: Record<string, unknown>) {
    if (entityType === "SALE") return entity.status as SaleStatus;
    if (entityType === "CONTRACT") return entity.status as ContractStatus;
    if (entityType === "CHECKLIST") return entity.status as ChecklistStatus;
    throw new BadRequestException("Tipo de entidade inválido.");
  }

  private getEntityVersion(entityType: EntityType, entity: Record<string, unknown>) {
    if (entityType === "SALE") return entity.version as number;
    if (entityType === "CONTRACT") return entity.version as number;
    if (entityType === "CHECKLIST") return entity.version as number;
    throw new BadRequestException("Tipo de entidade inválido.");
  }

  private getChecklistBlocked(entityType: EntityType, entity: Record<string, unknown>) {
    if (entityType !== "CHECKLIST") {
      return { isBlocked: false, blockedReason: null as string | null };
    }
    const blockedAt = entity.blockedAt as Date | null | undefined;
    const blockedReason = entity.blockedReason as string | null | undefined;
    return {
      isBlocked: Boolean(blockedAt),
      blockedReason: blockedReason ?? null,
    };
  }

  private async applyTransition(
    tx: Prisma.TransactionClient,
    context: TransitionContext,
    entity: Record<string, unknown>,
  ) {
    if (context.entityType === "SALE") {
      const transition = this.getTransition(context.entityType, context.action);
      const updated = await this.updateSaleWithLock(tx, {
        id: context.entityId,
        companyId: context.companyId,
        version: context.version,
        data: {
          status: transition.toStatus as SaleStatus,
          updatedById: context.actorId,
        },
      });
      return updated;
    }

    if (context.entityType === "CONTRACT") {
      const transition = this.getTransition(context.entityType, context.action);
      const payload = context.payload ?? {};
      const updateData: Record<string, unknown> = {
        updatedById: context.actorId,
      };

      if (transition.toStatus) {
        updateData.status = transition.toStatus as ContractStatus;
      }

      if (context.action === "CONTRACT_REQUEST_SIGNATURE") {
        updateData.sentAt = new Date();
      }

      if (context.action === "CONTRACT_ACTIVATE") {
        const signedAtValue =
          (payload.signedAt ? new Date(payload.signedAt as string) : null) ||
          (entity.signedAt as Date | null | undefined) ||
          new Date();
        updateData.signedAt = signedAtValue;
        updateData.signedName = payload.signedName as string | undefined;
        updateData.signedDocument = payload.signedDocument as string | undefined;
        updateData.signedIp = payload.signedIp as string | undefined;
        updateData.signedUserAgent = payload.signedUserAgent as string | undefined;
        updateData.signatureImageUrl = payload.signatureImageUrl as string | undefined;
        updateData.contractPdfUrl = payload.contractPdfUrl as string | undefined;
        if (payload.signatureType) {
          updateData.signatureType =
            payload.signatureType === "DRAWN" ? SignatureType.DRAWN : SignatureType.UPLOAD;
        }
      }

      const updated = await this.updateContractWithLock(tx, {
        id: context.entityId,
        companyId: context.companyId,
        version: context.version,
        data: updateData,
      });
      return updated;
    }

    if (context.entityType === "CHECKLIST") {
      const transition = this.getTransition(context.entityType, context.action);
      const updateData: Record<string, unknown> = {
        updatedById: context.actorId,
      };
      if (transition.toStatus) {
        updateData.status = transition.toStatus as ChecklistStatus;
      }
      if (context.action === "CHECKLIST_START") {
        updateData.startedAt = new Date();
      }
      if (context.action === "CHECKLIST_FINISH") {
        updateData.finishedAt = new Date();
      }

      const updated = await this.updateChecklistWithLock(tx, {
        id: context.entityId,
        companyId: context.companyId,
        version: context.version,
        data: updateData,
      });
      return updated;
    }

    throw new BadRequestException("Tipo de entidade inválido.");
  }

  private async applySideEffects(
    tx: Prisma.TransactionClient,
    context: TransitionContext,
    entity: Record<string, unknown>,
    updated: Record<string, unknown>,
  ) {
    if (context.entityType === "SALE" && context.action === "SALE_MARK_WON") {
      const sale = updated as { id: string; companyId: string | null; customerId: string };
      const existing = await tx.contract.findFirst({
        where: {
          saleId: sale.id,
          ...(sale.companyId ? { companyId: sale.companyId } : {}),
        },
      });
      if (!existing) {
        const template = await tx.contractTemplate.findFirst({
          where: { ...(sale.companyId ? { companyId: sale.companyId } : {}), isActive: true },
          orderBy: { createdAt: "desc" },
        });
        const project = await tx.project.findFirst({
          where: { customerId: sale.customerId, ...(sale.companyId ? { companyId: sale.companyId } : {}) },
          orderBy: { createdAt: "desc" },
        });
        if (template && project) {
          await tx.contract.create({
            data: {
              companyId: sale.companyId ?? undefined,
              saleId: sale.id,
              customerId: sale.customerId,
              projectId: project.id,
              templateId: template.id,
              status: ContractStatus.DRAFT,
              totalValue: new Prisma.Decimal(0),
              createdById: context.actorId,
            },
          });
        }
      }
    }

    if (context.entityType === "CONTRACT" && context.action === "CONTRACT_CANCEL") {
      const contract = updated as { id: string; companyId: string | null };
      await tx.implementationChecklist.updateMany({
        where: {
          contractId: contract.id,
          ...(contract.companyId ? { companyId: contract.companyId } : {}),
        },
        data: {
          blockedAt: new Date(),
          blockedReason: context.reason ?? "Contrato cancelado.",
          updatedById: context.actorId,
          version: { increment: 1 },
        } as any,
      });
    }

    if (context.entityType === "CONTRACT" && context.action === "CONTRACT_ACTIVATE") {
      const contract = updated as {
        id: string;
        companyId: string | null;
        saleId: string | null;
        signedAt?: Date | null;
      };
      if (!contract.saleId) {
        return;
      }
      const existing = await tx.implementationChecklist.findFirst({
        where: { contractId: contract.id },
      });
      if (existing) return;

      const template = await tx.implementationChecklistTemplate.findFirst({
        where: { ...(contract.companyId ? { companyId: contract.companyId } : {}), isDefault: true },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
      if (!template) {
        return;
      }

      const signedAt = contract.signedAt ?? null;

      await tx.implementationChecklist.create({
        data: {
          companyId: contract.companyId ?? undefined,
          saleId: contract.saleId,
          contractId: contract.id,
          status: ChecklistStatus.NOT_STARTED,
          createdById: context.actorId,
          items: {
            create: template.items.map((item) => ({
              title: item.title,
              description: item.description,
              department: item.department,
              isRequired: item.isRequired,
              status: "PENDING",
              dueDate: signedAt
                ? new Date(signedAt.getTime() + item.defaultDueDays * 24 * 60 * 60 * 1000)
                : undefined,
            })),
          },
        },
      });
    }
  }

  private async auditTransition(
    tx: Prisma.TransactionClient,
    context: TransitionContext,
    previous: Record<string, unknown>,
    updated: Record<string, unknown>,
  ) {
    const fromStatus = this.getEntityStatus(context.entityType, previous);
    const toStatus = this.getEntityStatus(context.entityType, updated);

    await tx.auditLog.create({
      data: {
        actorId: context.actorId,
        companyId: context.companyId,
        entityName: this.mapEntityName(context.entityType),
        entityId: context.entityId,
        action: context.action,
        payload: {
          fromStatus,
          toStatus,
          reason: context.reason ?? null,
          reasonType:
            context.action === "SALE_MARK_LOST"
              ? (context.payload?.reasonType as string | undefined) ?? "CANCELLED"
              : context.payload?.reasonType,
          payload: context.payload ?? null,
        } as Prisma.InputJsonValue,
      },
    });
  }

  private mapEntityName(entityType: EntityType) {
    if (entityType === "SALE") return "Sale";
    if (entityType === "CONTRACT") return "Contract";
    if (entityType === "CHECKLIST") return "ImplementationChecklist";
    return "Unknown";
  }

  private async updateSaleWithLock(
    tx: Prisma.TransactionClient,
    params: {
      id: string;
      companyId?: string;
      version: number;
      data: Record<string, unknown>;
    },
  ) {
    const result = await tx.sale.updateMany({
      where: {
        id: params.id,
        ...(params.companyId ? { companyId: params.companyId } : {}),
        version: params.version,
      } as any,
      data: {
        ...params.data,
        version: { increment: 1 },
      } as any,
    });
    if (result.count === 0) {
      throw new ConflictException("Registro desatualizado.");
    }
    const updated = await tx.sale.findFirst({
      where: {
        id: params.id,
        ...(params.companyId ? { companyId: params.companyId } : {}),
      },
    });
    if (!updated) {
      throw new NotFoundException("Venda não encontrada.");
    }
    return updated;
  }

  private async updateContractWithLock(
    tx: Prisma.TransactionClient,
    params: {
      id: string;
      companyId?: string;
      version: number;
      data: Record<string, unknown>;
    },
  ) {
    const result = await tx.contract.updateMany({
      where: {
        id: params.id,
        ...(params.companyId ? { companyId: params.companyId } : {}),
        version: params.version,
      } as any,
      data: {
        ...params.data,
        version: { increment: 1 },
      } as any,
    });
    if (result.count === 0) {
      throw new ConflictException("Registro desatualizado.");
    }
    const updated = await tx.contract.findFirst({
      where: {
        id: params.id,
        ...(params.companyId ? { companyId: params.companyId } : {}),
      },
    });
    if (!updated) {
      throw new NotFoundException("Contrato não encontrado.");
    }
    return updated;
  }

  private async updateChecklistWithLock(
    tx: Prisma.TransactionClient,
    params: {
      id: string;
      companyId?: string;
      version: number;
      data: Record<string, unknown>;
    },
  ) {
    const result = await tx.implementationChecklist.updateMany({
      where: {
        id: params.id,
        ...(params.companyId ? { companyId: params.companyId } : {}),
        version: params.version,
      } as any,
      data: {
        ...params.data,
        version: { increment: 1 },
      } as any,
    });
    if (result.count === 0) {
      throw new ConflictException("Registro desatualizado.");
    }
    const updated = await tx.implementationChecklist.findFirst({
      where: {
        id: params.id,
        ...(params.companyId ? { companyId: params.companyId } : {}),
      },
    });
    if (!updated) {
      throw new NotFoundException("Checklist não encontrado.");
    }
    return updated;
  }
}
