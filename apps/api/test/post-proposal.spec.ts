import { BadRequestException } from "@nestjs/common";
import { PostProposalService } from "../src/modules/post-proposal/post-proposal.service";

describe("post proposal flow", () => {
  function createService(overrides: Partial<Record<string, unknown>> = {}) {
    const prisma = {
      contract: {
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      sale: {
        findFirst: jest.fn(),
      },
      project: {
        findFirst: jest.fn(),
      },
      implementationChecklist: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      implementationChecklistItem: {
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      implementationChecklistTemplate: {
        findFirst: jest.fn(),
      },
      implementationItemEvidence: {
        create: jest.fn(),
      },
    };
    const audit = { log: jest.fn() };
    const files = {
      saveBase64: jest.fn(),
      saveBuffer: jest.fn(),
    };
    const workflow = { transition: jest.fn() };
    Object.assign(prisma, overrides);
    return new PostProposalService(prisma as any, audit as any, files as any, workflow as any);
  }

  it("throws when workflow returns pending on start", async () => {
    const service = createService();
    const workflow = (service as any).workflow;
    workflow.transition.mockResolvedValue({ type: "PENDING" });
    await expect(service.startChecklist("chk1", 1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("throws when workflow returns pending on finish", async () => {
    const service = createService();
    const workflow = (service as any).workflow;
    workflow.transition.mockResolvedValue({ type: "PENDING" });
    await expect(service.finishChecklist("chk1", 1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("sign triggers workflow activation", async () => {
    const prismaMock = {
      contract: {
        findFirst: jest.fn().mockResolvedValue({
          id: "c1",
          companyId: "comp1",
          saleId: "sale1",
          customer: { name: "Cliente", document: "123" },
          template: { content: "<p>Contrato {{customerName}}</p>" },
          project: { name: "Projeto" },
        }),
        update: jest.fn().mockResolvedValue({ id: "c1", companyId: "comp1" }),
      },
    };
    const service = createService(prismaMock);
    const files = (service as any).files;
    files.saveBase64.mockResolvedValue({ fileUrl: "http://files/sign.png" });
    files.saveBuffer.mockResolvedValue({ fileUrl: "http://files/contract.pdf" });
    const workflow = (service as any).workflow;
    workflow.transition.mockResolvedValue({ type: "APPLIED", entity: { id: "c1" } });

    await service.signContract("c1", {
      signatureType: "DRAWN",
      signatureImageBase64: "data:image/png;base64,AAA",
      signedName: "Cliente",
      signedDocument: "123",
      consent: true,
      version: 1,
    });

    expect(workflow.transition).toHaveBeenCalledWith(
      expect.objectContaining({ action: "CONTRACT_ACTIVATE", entityId: "c1" }),
    );
  });
});
