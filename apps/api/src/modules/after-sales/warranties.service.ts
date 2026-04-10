import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateWarrantyDto } from "./dto/create-warranty.dto";
import { UpdateWarrantyDto } from "./dto/update-warranty.dto";
import { AuditService } from "../iam/audit.service";

@Injectable()
export class WarrantiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.warranty.findMany({
      where: companyId ? { companyId } : undefined,
    });
  }

  async findOne(id: string, companyId?: string) {
    const warranty = await this.prisma.warranty.findFirst({
      where: companyId ? { id, companyId } : { id },
    });
    if (!warranty) {
      throw new NotFoundException("Garantia não encontrada");
    }
    return warranty;
  }

  async create(
    companyId: string | undefined,
    dto: CreateWarrantyDto,
    actorId?: string,
  ) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException("Datas de início ou fim inválidas.");
    }
    if (end < start) {
      throw new BadRequestException("A data final deve ser igual ou posterior à data inicial.");
    }

    try {
      const created = await this.prisma.warranty.create({
        data: {
          companyId,
          customerId: dto.customerId,
          projectId: dto.projectId,
          startDate: start,
          endDate: end,
          terms: dto.terms,
          createdById: actorId,
        },
      });

      await this.audit.log({
        actorId,
        companyId,
        entityName: "Warranty",
        entityId: created.id,
        action: "CREATE",
        payload: { startDate: created.startDate },
      });

      return created;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
        throw new BadRequestException(
          "Referência inválida: cliente ou projeto não encontrado (ou ID incorreto).",
        );
      }
      throw e;
    }
  }

  async update(
    id: string,
    dto: UpdateWarrantyDto,
    actorId?: string,
    companyId?: string,
  ) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.warranty.update({
      where: { id },
      data: {
        customerId: dto.customerId,
        projectId: dto.projectId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        terms: dto.terms,
      },
    });

    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "Warranty",
      entityId: updated.id,
      action: "UPDATE",
      payload: { startDate: updated.startDate },
    });

    return updated;
  }

  async remove(id: string, actorId?: string, companyId?: string) {
    const warranty = await this.findOne(id, companyId);
    const deleted = await this.prisma.warranty.delete({ where: { id } });
    await this.audit.log({
      actorId,
      companyId: warranty.companyId ?? undefined,
      entityName: "Warranty",
      entityId: deleted.id,
      action: "DELETE",
      payload: { startDate: deleted.startDate },
    });
    return deleted;
  }
}
