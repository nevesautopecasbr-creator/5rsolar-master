import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePurchaseQuoteDto } from "./dto/create-purchase-quote.dto";
import { UpdatePurchaseQuoteDto } from "./dto/update-purchase-quote.dto";
import { AuditService } from "../iam/audit.service";

@Injectable()
export class PurchaseQuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.purchaseQuote.findMany({
      where: companyId ? { companyId } : undefined,
      include: { items: true },
    });
  }

  async findOne(id: string, companyId?: string) {
    const quote = await this.prisma.purchaseQuote.findFirst({
      where: companyId ? { id, companyId } : { id },
      include: { items: true },
    });
    if (!quote) {
      throw new NotFoundException("Cotação não encontrada");
    }
    return quote;
  }

  async create(
    companyId: string | undefined,
    dto: CreatePurchaseQuoteDto,
    actorId?: string,
  ) {
    const created = await this.prisma.purchaseQuote.create({
      data: {
        companyId,
        requestId: dto.requestId,
        supplierId: dto.supplierId,
        projectId: dto.projectId,
        status: dto.status,
        total: dto.total,
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
      entityName: "PurchaseQuote",
      entityId: created.id,
      action: "CREATE",
      payload: { total: created.total },
    });

    return created;
  }

  async update(
    id: string,
    dto: UpdatePurchaseQuoteDto,
    actorId?: string,
    companyId?: string,
  ) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.purchaseQuote.update({
      where: { id },
      data: {
        requestId: dto.requestId,
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
      entityName: "PurchaseQuote",
      entityId: updated.id,
      action: "UPDATE",
      payload: { total: updated.total },
    });

    return updated;
  }

  async remove(id: string, actorId?: string, companyId?: string) {
    const quote = await this.findOne(id, companyId);
    const deleted = await this.prisma.purchaseQuote.delete({
      where: { id },
    });
    await this.audit.log({
      actorId,
      companyId: quote.companyId ?? undefined,
      entityName: "PurchaseQuote",
      entityId: deleted.id,
      action: "DELETE",
      payload: { total: deleted.total },
    });
    return deleted;
  }
}
