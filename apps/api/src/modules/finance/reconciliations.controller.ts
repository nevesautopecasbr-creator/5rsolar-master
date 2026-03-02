import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CompanyId } from "../../common/decorators/company-id.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ReconciliationsService } from "./reconciliations.service";
import { CreateReconciliationDto } from "./dto/create-reconciliation.dto";

@ApiTags("Financeiro")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("reconciliations")
export class ReconciliationsController {
  constructor(private readonly service: ReconciliationsService) {}

  @Get()
  @Permissions("financeiro.read")
  findAll(@CompanyId() companyId?: string) {
    return this.service.findAll(companyId);
  }

  @Post()
  @Permissions("financeiro.write")
  create(
    @CompanyId() companyId: string | undefined,
    @Body() dto: CreateReconciliationDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.create(companyId, dto, user?.sub);
  }
}
