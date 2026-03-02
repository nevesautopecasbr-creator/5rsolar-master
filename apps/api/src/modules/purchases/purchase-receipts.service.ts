import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePurchaseReceiptDto } from "./dto/create-purchase-receipt.dto";
import { UpdatePurchaseReceiptDto } from "./dto/update-purchase-receipt.dto";
import { AuditService } from "../iam/audit.service";

@Injectable()
export class PurchaseReceiptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.purchaseReceipt.findMany({
      where: companyId ? { companyId } : undefined,
      include: { items: true },
    });
  }

  async findOne(id: string, companyId?: string) {
    const receipt = await this.prisma.purchaseReceipt.findFirst({
      where: companyId ? { id, companyId } : { id },
      include: { items: true },
    });
    if (!receipt) {
      throw new NotFoundException("Recebimento não encontrado");
    }
    return receipt;
  }

  async create(
    companyId: string | undefined,
    dto: CreatePurchaseReceiptDto,
    actorId?: string,
  ) {
    const created = await this.prisma.purchaseReceipt.create({
      data: {
        companyId,
        orderId: dto.orderId,
        projectId: dto.projectId,
        status: dto.status,
        receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : undefined,
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
      entityName: "PurchaseReceipt",
      entityId: created.id,
      action: "CREATE",
      payload: { receivedAt: created.receivedAt },
    });

    return created;
  }

  async update(
    id: string,
    dto: UpdatePurchaseReceiptDto,
    actorId?: string,
    companyId?: string,
  ) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.purchaseReceipt.update({
      where: { id },
      data: {
        orderId: dto.orderId,
        projectId: dto.projectId,
        status: dto.status,
        receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : undefined,
        notes: dto.notes,
        updatedById: actorId,
      },
      include: { items: true },
    });

    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "PurchaseReceipt",
      entityId: updated.id,
      action: "UPDATE",
      payload: { receivedAt: updated.receivedAt },
    });

    return updated;
  }

  async remove(id: string, actorId?: string, companyId?: string) {
    const receipt = await this.findOne(id, companyId);
    const deleted = await this.prisma.purchaseReceipt.delete({
      where: { id },
    });
    await this.audit.log({
      actorId,
      companyId: receipt.companyId ?? undefined,
      entityName: "PurchaseReceipt",
      entityId: deleted.id,
      action: "DELETE",
      payload: { receivedAt: deleted.receivedAt },
    });
    return deleted;
  }
}
