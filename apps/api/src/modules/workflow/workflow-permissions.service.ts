import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class WorkflowPermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async ensurePermission(
    userId: string | undefined,
    companyId: string | undefined,
    required: string[],
  ) {
    if (!userId) {
      throw new ForbiddenException("Usuário não autenticado.");
    }
    if (required.length === 0) {
      return;
    }
    if (companyId) {
      const membership = await this.prisma.companyMembership.findFirst({
        where: { userId, companyId, isActive: true },
      });
      if (!membership) {
        throw new ForbiddenException("Usuário não pertence à empresa.");
      }
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        ...(companyId ? { companyId } : {}),
      },
      include: {
        role: {
          include: {
            grants: { include: { permission: true } },
          },
        },
      },
    });

    const userPermissions = new Set<string>();
    for (const userRole of userRoles) {
      for (const grant of userRole.role.grants) {
        if (!companyId || !grant.permission.companyId || grant.permission.companyId === companyId) {
          userPermissions.add(grant.permission.name);
        }
      }
    }

    const allowed = required.every((permission) => userPermissions.has(permission));
    if (!allowed) {
      throw new ForbiddenException("Permissões insuficientes.");
    }
  }

  async ensureAnyPermission(
    userId: string | undefined,
    companyId: string | undefined,
    required: string[],
  ) {
    if (!userId) {
      throw new ForbiddenException("Usuário não autenticado.");
    }
    if (required.length === 0) {
      return;
    }
    if (companyId) {
      const membership = await this.prisma.companyMembership.findFirst({
        where: { userId, companyId, isActive: true },
      });
      if (!membership) {
        throw new ForbiddenException("Usuário não pertence à empresa.");
      }
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        ...(companyId ? { companyId } : {}),
      },
      include: {
        role: {
          include: {
            grants: { include: { permission: true } },
          },
        },
      },
    });

    const userPermissions = new Set<string>();
    for (const userRole of userRoles) {
      for (const grant of userRole.role.grants) {
        if (!companyId || !grant.permission.companyId || grant.permission.companyId === companyId) {
          userPermissions.add(grant.permission.name);
        }
      }
    }

    const allowed = required.some((permission) => userPermissions.has(permission));
    if (!allowed) {
      throw new ForbiddenException("Permissões insuficientes.");
    }
  }

  async ensureAdmin(userId: string | undefined, companyId: string | undefined) {
    if (!userId) {
      throw new ForbiddenException("Usuário não autenticado.");
    }
    const adminRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        ...(companyId ? { companyId } : {}),
        role: { name: "ADMIN" },
      },
      include: { role: true },
    });
    if (!adminRole) {
      throw new ForbiddenException("Apenas administradores podem aprovar ações.");
    }
  }
}
