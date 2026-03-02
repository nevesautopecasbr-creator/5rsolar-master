import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { AuditService } from "../iam/audit.service";

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.customer.findMany({
      where: companyId ? { companyId } : undefined,
    });
  }

  async findOne(id: string, companyId?: string) {
    const customer = await this.prisma.customer.findFirst({
      where: companyId ? { id, companyId } : { id },
    });
    if (!customer) {
      throw new NotFoundException("Cliente não encontrado");
    }
    return customer;
  }

  async create(
    companyId: string | undefined,
    dto: CreateCustomerDto,
    actorId?: string,
  ) {
    const created = await this.prisma.customer.create({
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
      entityName: "Customer",
      entityId: created.id,
      action: "CREATE",
      payload: { name: created.name },
    });

    const project = await this.prisma.project.create({
      data: {
        companyId,
        name: created.name,
        customerId: created.id,
        createdById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "Project",
      entityId: project.id,
      action: "CREATE",
      payload: { name: project.name, customerId: created.id },
    });

    return created;
  }

  async update(
    id: string,
    dto: UpdateCustomerDto,
    actorId?: string,
    companyId?: string,
  ) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.customer.update({
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
      entityName: "Customer",
      entityId: updated.id,
      action: "UPDATE",
      payload: { name: updated.name },
    });

    return updated;
  }

  async remove(id: string, actorId?: string, companyId?: string) {
    const customer = await this.findOne(id, companyId);
    const deleted = await this.prisma.customer.delete({ where: { id } });
    await this.audit.log({
      actorId,
      companyId: customer.companyId ?? undefined,
      entityName: "Customer",
      entityId: deleted.id,
      action: "DELETE",
      payload: { name: deleted.name },
    });
    return deleted;
  }
}
