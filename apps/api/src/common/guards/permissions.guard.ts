import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.ALLOW_ANONYMOUS === "true") {
      return true;
    }
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub as string | undefined;
    const companyId = request.companyId as string | undefined;
    if (!userId) {
      return false;
    }

    if (companyId) {
      const membership = await this.prisma.companyMembership.findFirst({
        where: { userId, companyId, isActive: true },
      });
      if (!membership) {
        return false;
      }
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        ...(companyId ? { companyId } : {}),
      },
      include: { role: { include: { grants: { include: { permission: true } } } } },
    });

    const userPermissions = new Set<string>();
    for (const userRole of userRoles) {
      for (const grant of userRole.role.grants) {
        if (!companyId || !grant.permission.companyId || grant.permission.companyId === companyId) {
          userPermissions.add(grant.permission.name);
        }
      }
    }

    return required.every((permission) => userPermissions.has(permission));
  }
}
