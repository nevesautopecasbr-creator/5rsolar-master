import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CompanyId } from "../../common/decorators/company-id.decorator";

@ApiTags("IAM")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("audit-logs")
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Permissions("iam.read")
  findAll(
    @CompanyId() companyId?: string,
    @Query("entityName") entityName?: string,
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        companyId,
        entityName,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }
}
