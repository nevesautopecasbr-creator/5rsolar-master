import { BadRequestException, Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { CompanyId } from "../../common/decorators/company-id.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { WorkflowPermissionsService } from "./workflow-permissions.service";

@ApiTags("Workflow")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("audit")
export class WorkflowAuditController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: WorkflowPermissionsService,
  ) {}

  @Get()
  async list(
    @CompanyId() companyId: string | undefined,
    @Query("entityType") entityType?: string,
    @Query("entityId") entityId?: string,
    @CurrentUser() user?: { sub: string },
  ) {
    if (!companyId) {
      throw new BadRequestException("companyId obrigatório.");
    }
    if (!entityType || !entityId) {
      throw new BadRequestException("entityType e entityId são obrigatórios.");
    }
    const mappedType = this.mapEntityType(entityType);
    await this.permissions.ensurePermission(
      user?.sub,
      companyId,
      mappedType === "CHECKLIST" ? ["obras.read"] : ["contratos.read"],
    );

    return this.prisma.auditLog.findMany({
      where: {
        companyId,
        entityName: this.mapEntityName(mappedType),
        entityId,
      },
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  private mapEntityType(raw: string): "SALE" | "CONTRACT" | "CHECKLIST" {
    const upper = raw.toUpperCase();
    if (upper === "SALE" || upper === "CONTRACT" || upper === "CHECKLIST") {
      return upper as "SALE" | "CONTRACT" | "CHECKLIST";
    }
    throw new BadRequestException("Tipo de entidade inválido.");
  }

  private mapEntityName(entityType: "SALE" | "CONTRACT" | "CHECKLIST") {
    if (entityType === "SALE") return "Sale";
    if (entityType === "CONTRACT") return "Contract";
    return "ImplementationChecklist";
  }
}
