import { BadRequestException, ConflictException } from "@nestjs/common";
import { WorkflowEngineService } from "../src/modules/workflow/workflow.service";
import { ApprovalsService } from "../src/modules/workflow/approvals.service";

describe("workflow engine", () => {
  function createWorkflow(overrides: Partial<Record<string, unknown>> = {}) {
    const prisma: any = {};
    prisma.$transaction = jest.fn((callback: any) => callback(prisma));
    Object.assign(prisma, {
      sale: {
        findFirst: jest.fn(),
        updateMany: jest.fn(),
      },
      contract: {
        findFirst: jest.fn(),
        updateMany: jest.fn(),
      },
      implementationChecklist: {
        findFirst: jest.fn(),
        updateMany: jest.fn(),
      },
      approvalRequest: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      contractTemplate: { findFirst: jest.fn() },
      project: { findFirst: jest.fn() },
      implementationChecklistTemplate: { findFirst: jest.fn() },
    });
    Object.assign(prisma, overrides);
    const audit = { log: jest.fn() };
    return { workflow: new WorkflowEngineService(prisma as any, audit as any), prisma, audit };
  }

  it("rejects invalid transition", async () => {
    const { workflow, prisma } = createWorkflow({
      sale: {
        findFirst: jest.fn().mockResolvedValue({ id: "s1", status: "NEW", version: 1 }),
      },
    });
    await expect(
      workflow.transition({
        entityType: "SALE",
        entityId: "s1",
        action: "SALE_MARK_WON",
        version: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("requires reason when configured", async () => {
    const { workflow } = createWorkflow({
      sale: {
        findFirst: jest.fn().mockResolvedValue({ id: "s1", status: "NEW", version: 1 }),
      },
    });
    await expect(
      workflow.transition({
        entityType: "SALE",
        entityId: "s1",
        action: "SALE_MARK_LOST",
        version: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("creates approval request when required", async () => {
    const { workflow, prisma } = createWorkflow({
      contract: {
        findFirst: jest.fn().mockResolvedValue({
          id: "c1",
          status: "ACTIVE",
          version: 3,
          companyId: "comp1",
        }),
      },
      approvalRequest: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: "apr1" }),
      },
    });

    const result = await workflow.transition({
      entityType: "CONTRACT",
      entityId: "c1",
      action: "CONTRACT_CANCEL",
      reason: "Cliente pediu",
      version: 3,
      actorId: "user1",
      companyId: "comp1",
    });

    expect(result).toEqual({ type: "PENDING", approvalRequestId: "apr1" });
    expect(prisma.approvalRequest.create).toHaveBeenCalled();
  });

  it("throws conflict on version mismatch", async () => {
    const { workflow, prisma } = createWorkflow({
      sale: {
        findFirst: jest.fn().mockResolvedValue({ id: "s1", status: "NEW", version: 1 }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    });

    await expect(
      workflow.transition({
        entityType: "SALE",
        entityId: "s1",
        action: "SALE_SET_PROPOSAL",
        version: 2,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe("approval decision", () => {
  function createApprovals(overrides: Partial<Record<string, unknown>> = {}) {
    const prisma = {
      approvalRequest: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    Object.assign(prisma, overrides);
    const audit = { log: jest.fn() };
    const workflow = { transition: jest.fn() };
    const permissions = {
      ensureAnyPermission: jest.fn(),
      ensureAdmin: jest.fn(),
    };
    return {
      service: new ApprovalsService(prisma as any, audit as any, workflow as any, permissions as any),
      prisma,
      audit,
      workflow,
      permissions,
    };
  }

  it("approves and audits", async () => {
    const { service, prisma, audit, workflow } = createApprovals({
      approvalRequest: {
        findFirst: jest.fn().mockResolvedValue({
          id: "apr1",
          status: "PENDING",
          entityType: "CONTRACT",
          entityId: "c1",
          action: "CONTRACT_CANCEL",
          payload: { version: 2 },
        }),
        update: jest.fn().mockResolvedValue({ id: "apr1", status: "APPROVED" }),
      },
    });
    workflow.transition.mockResolvedValue({ type: "APPLIED", entity: { id: "c1" } });

    await service.decide("apr1", "APPROVE", "ok", "user1", "comp1");

    expect(workflow.transition).toHaveBeenCalled();
    expect(prisma.approvalRequest.update).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalled();
  });
});
