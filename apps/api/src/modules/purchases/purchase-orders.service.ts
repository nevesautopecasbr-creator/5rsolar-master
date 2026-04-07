import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";
import { UpdatePurchaseOrderDto } from "./dto/update-purchase-order.dto";
import { AuditService } from "../iam/audit.service";

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.purchaseOrder.findMany({
      where: companyId ? { companyId } : undefined,
      include: { items: true, payables: true },
    });
  }

  async findOne(id: string, companyId?: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: companyId ? { id, companyId } : { id },
      include: { items: true, payables: true },
    });
    if (!order) {
      throw new NotFoundException("Pedido de compra não encontrado");
    }
    return order;
  }

  async create(
    companyId: string | undefined,
    dto: CreatePurchaseOrderDto,
    actorId?: string,
  ) {
    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const order = await tx.purchaseOrder.create({
          data: {
            companyId,
            quoteId: dto.quoteId,
            supplierId: dto.supplierId,
            projectId: dto.projectId,
            status: dto.status,
            total: dto.total,
            notes: dto.notes,
            createdById: actorId,
            items: dto.items?.length
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

        if (dto.total != null && Number(dto.total) > 0) {
          const dueDate = dto.payableDueDate
            ? new Date(dto.payableDueDate)
            : new Date();
          await tx.payable.create({
            data: {
              companyId,
              projectId: dto.projectId,
              supplierId: dto.supplierId,
              purchaseOrderId: order.id,
              description: `Compra ${order.id}`,
              amount: dto.total,
              dueDate,
              createdById: actorId,
              isDirectCost: true,
            },
          });
        }

        return order;
      });

      await this.audit.log({
        actorId,
        companyId,
        entityName: "PurchaseOrder",
        entityId: created.id,
        action: "CREATE",
        payload: { total: created.total },
      });

      return this.findOne(created.id, companyId);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2003") {
          throw new BadRequestException(
            "Referência inválida: fornecedor, projeto, cotação ou produto não encontrado (ou ID incorreto).",
          );
        }
      }
      throw e;
    }
  }

  async update(
    id: string,
    dto: UpdatePurchaseOrderDto,
    actorId?: string,
    companyId?: string,
  ) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        quoteId: dto.quoteId,
        supplierId: dto.supplierId,
        projectId: dto.projectId,
        status: dto.status,
        total: dto.total,
        notes: dto.notes,
        updatedById: actorId,
      },
      include: { items: true },
    });

    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "PurchaseOrder",
      entityId: updated.id,
      action: "UPDATE",
      payload: { total: updated.total },
    });

    return updated;
  }

  async remove(id: string, actorId?: string, companyId?: string) {
    const order = await this.findOne(id, companyId);
    const deleted = await this.prisma.purchaseOrder.delete({
      where: { id },
    });
    await this.audit.log({
      actorId,
      companyId: order.companyId ?? undefined,
      entityName: "PurchaseOrder",
      entityId: deleted.id,
      action: "DELETE",
      payload: { total: deleted.total },
    });
    return deleted;
  }
}
