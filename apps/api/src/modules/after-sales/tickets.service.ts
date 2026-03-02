import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";
import { AuditService } from "../iam/audit.service";

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.ticket.findMany({
      where: companyId ? { companyId } : undefined,
    });
  }

  async findOne(id: string, companyId?: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: companyId ? { id, companyId } : { id },
    });
    if (!ticket) {
      throw new NotFoundException("Ticket não encontrado");
    }
    return ticket;
  }

  async create(
    companyId: string | undefined,
    dto: CreateTicketDto,
    actorId?: string,
  ) {
    const created = await this.prisma.ticket.create({
      data: {
        companyId,
        customerId: dto.customerId,
        projectId: dto.projectId,
        assignedToId: dto.assignedToId,
        status: dto.status,
        priority: dto.priority,
        subject: dto.subject,
        description: dto.description,
        createdById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "Ticket",
      entityId: created.id,
      action: "CREATE",
      payload: { subject: created.subject },
    });

    return created;
  }

  async update(
    id: string,
    dto: UpdateTicketDto,
    actorId?: string,
    companyId?: string,
  ) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        customerId: dto.customerId,
        projectId: dto.projectId,
        assignedToId: dto.assignedToId,
        status: dto.status,
        priority: dto.priority,
        subject: dto.subject,
        description: dto.description,
        updatedById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "Ticket",
      entityId: updated.id,
      action: "UPDATE",
      payload: { subject: updated.subject },
    });

    return updated;
  }

  async remove(id: string, actorId?: string, companyId?: string) {
    const ticket = await this.findOne(id, companyId);
    const deleted = await this.prisma.ticket.delete({ where: { id } });
    await this.audit.log({
      actorId,
      companyId: ticket.companyId ?? undefined,
      entityName: "Ticket",
      entityId: deleted.id,
      action: "DELETE",
      payload: { subject: deleted.subject },
    });
    return deleted;
  }
}