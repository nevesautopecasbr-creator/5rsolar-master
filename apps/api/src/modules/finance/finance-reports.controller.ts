import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CompanyId } from "../../common/decorators/company-id.decorator";
import { FinanceReportsService } from "./finance-reports.service";

@ApiTags("Financeiro")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("finance/reports")
export class FinanceReportsController {
  constructor(private readonly service: FinanceReportsService) {}

  @Get("cashflow")
  @Permissions("financeiro.read")
  cashflow(
    @CompanyId() companyId: string | undefined,
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("projectId") projectId?: string,
  ) {
    return this.service.cashflow(
      companyId,
      new Date(start),
      new Date(end),
      projectId,
    );
  }

  @Get("dre")
  @Permissions("financeiro.read")
  dre(
    @CompanyId() companyId: string | undefined,
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("projectId") projectId?: string,
  ) {
    return this.service.dre(companyId, new Date(start), new Date(end), projectId);
  }

  @Get("margin")
  @Permissions("financeiro.read")
  margin(
    @CompanyId() companyId: string | undefined,
    @Query("projectId") projectId: string,
  ) {
    return this.service.marginByProject(companyId, projectId);
  }

  @Get("cost-by-customer")
  @Permissions("financeiro.read")
  costByCustomer(
    @CompanyId() companyId: string | undefined,
    @Query("start") start: string,
    @Query("end") end: string,
  ) {
    return this.service.costByCustomer(companyId, new Date(start), new Date(end));
  }
}
