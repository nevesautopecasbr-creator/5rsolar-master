import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePurchaseRequestDto } from "./dto/create-purchase-request.dto";
import { UpdatePurchaseRequestDto } from "./dto/update-purchase-request.dto";
import { AuditService } from "../iam/audit.service";

@Injectable()
export class PurchaseRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.purchaseRequest.findMany({
      where: companyId ? { companyId } : undefined,
      include: { items: true },
    });
  }

  async findOne(id: string, companyId?: string) {
    const request = await this.prisma.purchaseRequest.findFirst({
      where: companyId ? { id, companyId } : { id },
      include: { items: true },
    });
    if (!request) {
      throw new NotFoundException("Solicitação não encontrada");
    }
    return request;
  }

  async create(
    companyId: string | undefined,
    dto: CreatePurchaseRequestDto,
    actorId?: string,
  ) {
    const created = await this.prisma.purchaseRequest.create({
      data: {
        companyId,
        projectId: dto.projectId,
        status: dto.status,
        title: dto.title,
        notes: dto.notes,
        createdById: actorId,
        items: dto.items
          ? {
              create: dto.items.map((item) => ({
                productId: item.productId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              })),
            }
          : undefined,
      },
      include: { items: true },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "PurchaseRequest",
      entityId: created.id,
      action: "CREATE",
      payload: { title: created.title },
    });

    return created;
  }

  async update(
    id: string,
    dto: UpdatePurchaseRequestDto,
    actorId?: string,
    companyId?: string,
  ) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        status: dto.status,
        title: dto.title,
        notes: dto.notes,
        updatedById: actorId,
      },
      include: { items: true },
    });

    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "PurchaseRequest",
      entityId: updated.id,
      action: "UPDATE",
      payload: { title: updated.title },
    });

    return updated;
  }

  async remove(id: string, actorId?: string, companyId?: string) {
    const request = await this.findOne(id, companyId);
    const deleted = await this.prisma.purchaseRequest.delete({
      where: { id },
    });
    await this.audit.log({
      actorId,
      companyId: request.companyId ?? undefined,
      entityName: "PurchaseRequest",
      entityId: deleted.id,
      action: "DELETE",
      payload: { title: deleted.title },
    });
    return deleted;
  }
}
