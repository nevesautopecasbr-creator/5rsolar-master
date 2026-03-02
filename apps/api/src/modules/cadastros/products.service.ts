import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { AuditService } from "../iam/audit.service";

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.product.findMany({
      where: companyId ? { companyId } : undefined,
    });
  }

  async findOne(id: string, companyId?: string) {
    const product = await this.prisma.product.findFirst({
      where: companyId ? { id, companyId } : { id },
    });
    if (!product) {
      throw new NotFoundException("Produto não encontrado");
    }
    return product;
  }

  async create(
    companyId: string | undefined,
    dto: CreateProductDto,
    actorId?: string,
  ) {
    const created = await this.prisma.product.create({
      data: {
        companyId,
        name: dto.name,
        sku: dto.sku,
        unit: dto.unit,
        cost: dto.cost,
        price: dto.price,
        isActive: dto.isActive ?? true,
        createdById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "Product",
      entityId: created.id,
      action: "CREATE",
      payload: { name: created.name },
    });

    return created;
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    actorId?: string,
    companyId?: string,
  ) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        sku: dto.sku,
        unit: dto.unit,
        cost: dto.cost,
        price: dto.price,
        isActive: dto.isActive,
        updatedById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "Product",
      entityId: updated.id,
      action: "UPDATE",
      payload: { name: updated.name },
    });

    return updated;
  }

  async remove(id: string, actorId?: string, companyId?: string) {
    const product = await this.findOne(id, companyId);
    const deleted = await this.prisma.product.delete({ where: { id } });
    await this.audit.log({
      actorId,
      companyId: product.companyId ?? undefined,
      entityName: "Product",
      entityId: deleted.id,
      action: "DELETE",
      payload: { name: deleted.name },
    });
    return deleted;
  }
}