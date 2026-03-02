import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";
import { AuditService } from "../iam/audit.service";

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.supplier.findMany({
      where: companyId ? { companyId } : undefined,
    });
  }

  async findOne(id: string, companyId?: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: companyId ? { id, companyId } : { id },
    });
    if (!supplier) {
      throw new NotFoundException("Fornecedor não encontrado");
    }
    return supplier;
  }

  async create(
    companyId: string | undefined,
    dto: CreateSupplierDto,
    actorId?: string,
  ) {
    const created = await this.prisma.supplier.create({
      data: {
        companyId,
        name: dto.name,
        document: dto.document,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        zipCode: dto.zipCode,
        createdById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "Supplier",
      entityId: created.id,
      action: "CREATE",
      payload: { name: created.name },
    });

    return created;
  }

  async update(
    id: string,
    dto: UpdateSupplierDto,
    actorId?: string,
    companyId?: string,
  ) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.supplier.update({
      where: { id },
      data: {
        name: dto.name,
        document: dto.document,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        zipCode: dto.zipCode,
        updatedById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "Supplier",
      entityId: updated.id,
      action: "UPDATE",
      payload: { name: updated.name },
    });

    return updated;
  }

  async remove(id: string, actorId?: string, companyId?: string) {
    const supplier = await this.findOne(id, companyId);
    const deleted = await this.prisma.supplier.delete({ where: { id } });
    await this.audit.log({
      actorId,
      companyId: supplier.companyId ?? undefined,
      entityName: "Supplier",
      entityId: deleted.id,
      action: "DELETE",
      payload: { name: deleted.name },
    });
    return deleted;
  }
}