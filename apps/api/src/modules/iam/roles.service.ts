import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { AssignPermissionsDto } from "./dto/assign-permissions.dto";
import { AuditService } from "./audit.service";

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.role.findMany({
      where: { companyId },
      include: { grants: { include: { permission: true } } },
    });
  }

  async create(companyId: string | undefined, dto: CreateRoleDto, actorId?: string) {
    const created = await this.prisma.role.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });

    await this.audit.log({
      actorId,
      companyId,
      entityName: "Role",
      entityId: created.id,
      action: "CREATE",
      payload: { name: created.name },
    });

    return created;
  }

  async update(id: string, dto: UpdateRoleDto, actorId?: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException("Role não encontrado");
    }

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive,
      },
    });

    await this.audit.log({
      actorId,
      companyId: role.companyId ?? undefined,
      entityName: "Role",
      entityId: updated.id,
      action: "UPDATE",
      payload: { name: updated.name },
    });

    return updated;
  }

  async remove(id: string, actorId?: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException("Role não encontrado");
    }

    const deleted = await this.prisma.role.delete({ where: { id } });
    await this.audit.log({
      actorId,
      companyId: role.companyId ?? undefined,
      entityName: "Role",
      entityId: deleted.id,
      action: "DELETE",
      payload: { name: deleted.name },
    });
    return deleted;
  }

  async assignPermissions(
    id: string,
    dto: AssignPermissionsDto,
    actorId?: string,
  ) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException("Role não encontrado");
    }

    const permissions = await this.prisma.permission.findMany({
      where: { name: { in: dto.permissions } },
    });

    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await this.prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });

    await this.audit.log({
      actorId,
      companyId: role.companyId ?? undefined,
      entityName: "Role",
      entityId: role.id,
      action: "ASSIGN_PERMISSIONS",
      payload: { permissions: dto.permissions },
    });

    return this.prisma.role.findUnique({
      where: { id },
      include: { grants: { include: { permission: true } } },
    });
  }
}
