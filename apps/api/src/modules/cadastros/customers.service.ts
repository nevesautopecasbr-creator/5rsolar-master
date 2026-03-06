import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { AuditService } from "../iam/audit.service";

function normalizeDocument(doc: string): string {
  return (doc ?? "").replace(/\D/g, "");
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.customer.findMany({
      where: companyId ? { companyId } : undefined,
      include: { consumerUnits: true },
    });
  }

  async findOne(id: string, companyId?: string) {
    const customer = await this.prisma.customer.findFirst({
      where: companyId ? { id, companyId } : { id },
      include: { consumerUnits: true },
    });
    if (!customer) {
      throw new NotFoundException("Cliente não encontrado");
    }
    return customer;
  }

  private async checkDocumentUnique(
    document: string,
    companyId: string | undefined,
    excludeCustomerId?: string,
  ) {
    const normalized = normalizeDocument(document);
    if (normalized.length < 11) return; // CPF mínimo 11 dígitos
    const existing = await this.prisma.customer.findMany({
      where: companyId ? { companyId } : undefined,
      select: { id: true, document: true },
    });
    for (const c of existing) {
      if (c.id === excludeCustomerId) continue;
      if (c.document && normalizeDocument(c.document) === normalized) {
        throw new ConflictException("CPF/CNPJ já cadastrado para outro cliente");
      }
    }
  }

  async create(
    companyId: string | undefined,
    dto: CreateCustomerDto,
    actorId?: string,
  ) {
    await this.checkDocumentUnique(dto.document, companyId);

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
        currentConsumptionKwh: dto.consumerUnits?.[0]?.currentConsumptionKwh ?? undefined,
        consumerUnitCode: dto.consumerUnits?.[0]?.consumerUnitCode ?? undefined,
        createdById: actorId,
      },
    });

    if (dto.consumerUnits?.length) {
      await this.prisma.consumerUnit.createMany({
        data: dto.consumerUnits.map((uc) => ({
          customerId: created.id,
          consumerUnitCode: uc.consumerUnitCode,
          currentConsumptionKwh: uc.currentConsumptionKwh,
        })),
      });
    }

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

    return this.findOne(created.id, companyId);
  }

  async update(
    id: string,
    dto: UpdateCustomerDto,
    actorId?: string,
    companyId?: string,
  ) {
    await this.findOne(id, companyId);

    if (dto.document) {
      await this.checkDocumentUnique(dto.document, companyId, id);
    }

    const data: Record<string, unknown> = { updatedById: actorId };
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.document !== undefined) data.document = dto.document;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.state !== undefined) data.state = dto.state;
    if (dto.zipCode !== undefined) data.zipCode = dto.zipCode;

    const updated = await this.prisma.customer.update({
      where: { id },
      data,
    });

    if (dto.consumerUnits !== undefined) {
      await this.prisma.consumerUnit.deleteMany({ where: { customerId: id } });
      if (dto.consumerUnits.length > 0) {
        await this.prisma.consumerUnit.createMany({
          data: dto.consumerUnits.map((uc) => ({
            customerId: id,
            consumerUnitCode: uc.consumerUnitCode,
            currentConsumptionKwh: uc.currentConsumptionKwh,
          })),
        });
      }
    }

    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "Customer",
      entityId: updated.id,
      action: "UPDATE",
      payload: { name: updated.name },
    });

    return this.findOne(id, companyId);
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
