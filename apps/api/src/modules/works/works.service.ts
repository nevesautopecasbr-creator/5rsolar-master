import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateWorkOrderDto } from "./dto/create-work-order.dto";
import { UpdateWorkOrderDto } from "./dto/update-work-order.dto";
import { CreateChecklistItemDto } from "./dto/create-checklist-item.dto";
import { CreateWorkPhotoDto } from "./dto/create-work-photo.dto";
import { CreateWorkDiaryDto } from "./dto/create-work-diary.dto";
import { CreateWorkMilestoneDto } from "./dto/create-work-milestone.dto";
import { AssignWorkUserDto } from "./dto/assign-work-user.dto";
import { AuditService } from "../iam/audit.service";

@Injectable()
export class WorksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.workOrder.findMany({
      where: companyId ? { companyId } : undefined,
      include: {
        checklist: true,
        photos: true,
        diary: true,
        milestones: true,
        assignees: true,
      },
    });
  }

  async findOne(id: string, companyId?: string) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: companyId ? { id, companyId } : { id },
      include: {
        checklist: true,
        photos: true,
        diary: true,
        milestones: true,
        assignees: true,
      },
    });
    if (!workOrder) {
      throw new NotFoundException("Ordem de serviço não encontrada");
    }
    return workOrder;
  }

  async create(
    companyId: string | undefined,
    dto: CreateWorkOrderDto,
    actorId?: string,
  ) {
    const created = await this.prisma.workOrder.create({
      data: {
        companyId,
        projectId: dto.projectId,
        status: dto.status,
        title: dto.title,
        description: dto.description,
        scheduledStart: dto.scheduledStart
          ? new Date(dto.scheduledStart)
          : undefined,
        scheduledEnd: dto.scheduledEnd
          ? new Date(dto.scheduledEnd)
          : undefined,
        actualStart: dto.actualStart ? new Date(dto.actualStart) : undefined,
        actualEnd: dto.actualEnd ? new Date(dto.actualEnd) : undefined,
        createdById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "WorkOrder",
      entityId: created.id,
      action: "CREATE",
      payload: { title: created.title },
    });

    return this.findOne(created.id, companyId);
  }

  async update(
    id: string,
    dto: UpdateWorkOrderDto,
    actorId?: string,
    companyId?: string,
  ) {
    await this.findOne(id, companyId);
    const updated = await this.prisma.workOrder.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        status: dto.status,
        title: dto.title,
        description: dto.description,
        scheduledStart: dto.scheduledStart
          ? new Date(dto.scheduledStart)
          : undefined,
        scheduledEnd: dto.scheduledEnd
          ? new Date(dto.scheduledEnd)
          : undefined,
        actualStart: dto.actualStart ? new Date(dto.actualStart) : undefined,
        actualEnd: dto.actualEnd ? new Date(dto.actualEnd) : undefined,
        updatedById: actorId,
      },
    });

    await this.audit.log({
      actorId,
      companyId: updated.companyId ?? undefined,
      entityName: "WorkOrder",
      entityId: updated.id,
      action: "UPDATE",
      payload: { title: updated.title },
    });

    return this.findOne(updated.id, companyId);
  }

  async remove(id: string, actorId?: string, companyId?: string) {
    const workOrder = await this.findOne(id, companyId);
    const deleted = await this.prisma.workOrder.delete({ where: { id } });
    await this.audit.log({
      actorId,
      companyId: workOrder.companyId ?? undefined,
      entityName: "WorkOrder",
      entityId: deleted.id,
      action: "DELETE",
      payload: { title: deleted.title },
    });
    return deleted;
  }

  async addChecklistItem(
    workOrderId: string,
    dto: CreateChecklistItemDto,
    actorId?: string,
  ) {
    const created = await this.prisma.workChecklistItem.create({
      data: {
        workOrderId,
        title: dto.title,
      },
    });
    await this.audit.log({
      actorId,
      entityName: "WorkChecklistItem",
      entityId: created.id,
      action: "CREATE",
      payload: { title: created.title },
    });
    return created;
  }

  async addPhoto(workOrderId: string, dto: CreateWorkPhotoDto, actorId?: string) {
    const created = await this.prisma.workPhoto.create({
      data: {
        workOrderId,
        url: dto.url,
        caption: dto.caption,
      },
    });
    await this.audit.log({
      actorId,
      entityName: "WorkPhoto",
      entityId: created.id,
      action: "CREATE",
      payload: { url: created.url },
    });
    return created;
  }

  async addDiaryEntry(
    workOrderId: string,
    dto: CreateWorkDiaryDto,
    actorId?: string,
  ) {
    const created = await this.prisma.workDiaryEntry.create({
      data: {
        workOrderId,
        entryDate: dto.entryDate ? new Date(dto.entryDate) : undefined,
        notes: dto.notes,
        createdById: actorId,
      },
    });
    await this.audit.log({
      actorId,
      entityName: "WorkDiaryEntry",
      entityId: created.id,
      action: "CREATE",
      payload: { entryDate: created.entryDate },
    });
    return created;
  }

  async addMilestone(
    workOrderId: string,
    dto: CreateWorkMilestoneDto,
    actorId?: string,
  ) {
    const created = await this.prisma.workMilestone.create({
      data: {
        workOrderId,
        title: dto.title,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
    await this.audit.log({
      actorId,
      entityName: "WorkMilestone",
      entityId: created.id,
      action: "CREATE",
      payload: { title: created.title },
    });
    return created;
  }

  async assignUser(
    workOrderId: string,
    dto: AssignWorkUserDto,
    actorId?: string,
  ) {
    const created = await this.prisma.workOrderAssignee.create({
      data: {
        workOrderId,
        userId: dto.userId,
        role: dto.role,
      },
    });
    await this.audit.log({
      actorId,
      entityName: "WorkOrderAssignee",
      entityId: created.id,
      action: "CREATE",
      payload: { userId: created.userId },
    });
    return created;
  }
}