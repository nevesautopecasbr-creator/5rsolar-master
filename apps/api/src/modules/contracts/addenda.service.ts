import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateAddendumDto } from "./dto/create-addendum.dto";
import { AuditService } from "../iam/audit.service";

@Injectable()
export class ContractAddendaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll(contractId: string) {
    return this.prisma.contractAddendum.findMany({ where: { contractId } });
  }

  async create(contractId: string, dto: CreateAddendumDto, actorId?: string) {
    const created = await this.prisma.contractAddendum.create({
      data: {
        contractId,
        title: dto.title,
        content: dto.content,
        valueChange: dto.valueChange,
        createdById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      entityName: "ContractAddendum",
      entityId: created.id,
      action: "CREATE",
      payload: { title: created.title },
    });

    return created;
  }

  async remove(id: string, actorId?: string) {
    const addendum = await this.prisma.contractAddendum.findUnique({ where: { id } });
    if (!addendum) {
      throw new NotFoundException("Aditivo não encontrado");
    }
    const deleted = await this.prisma.contractAddendum.delete({ where: { id } });
    await this.audit.log({
      actorId,
      entityName: "ContractAddendum",
      entityId: deleted.id,
      action: "DELETE",
      payload: { title: deleted.title },
    });
    return deleted;
  }
}
