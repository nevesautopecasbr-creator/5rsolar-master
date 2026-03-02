import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { AuditService } from "../iam/audit.service";

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.project.findMany({
      where: companyId ? { companyId } : undefined,
    });
  }

  async findOne(id: string, companyId?: string) {
    const project = await this.prisma.project.findFirst({
      where: companyId ? { id, companyId } : { id },
    });
    if (!project) {
      throw new NotFoundException("Projeto não encontrado");
    }
    return project;
  }

  async create(
    companyId: string | undefined,
    dto: CreateProjectDto,
    actorId?: string,
  ) {
    const created = await this.prisma.project.create({
      data: {
        companyId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        status: dto.status,
        kWp: dto.kWp,
        utilityCompany: dto.utilityCompany,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        zipCode: dto.zipCode,
        productsUsed: dto.productsUsed
          ? (dto.productsUsed as unknown as Prisma.InputJsonValue)
          : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        customerId: dto.customerId,
        createdById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "Project",
      entityId: created.id,
      action: "CREATE",
      payload: { name: created.name },
    });

    return created;
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    actorId?: string,
    companyId?: string,
  ) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        status: dto.status,
        kWp: dto.kWp,
        utilityCompany: dto.utilityCompany,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        zipCode: dto.zipCode,
        productsUsed: dto.productsUsed
          ? (dto.productsUsed as unknown as Prisma.InputJsonValue)
          : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        customerId: dto.customerId,
        updatedById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "Project",
      entityId: updated.id,
      action: "UPDATE",
      payload: { name: updated.name },
    });

    return updated;
  }

  async remove(id: string, actorId?: string, companyId?: string) {
    const project = await this.findOne(id, companyId);
    const deleted = await this.prisma.project.delete({ where: { id } });
    await this.audit.log({
      actorId,
      companyId: project.companyId ?? undefined,
      entityName: "Project",
      entityId: deleted.id,
      action: "DELETE",
      payload: { name: deleted.name },
    });
    return deleted;
  }
}
