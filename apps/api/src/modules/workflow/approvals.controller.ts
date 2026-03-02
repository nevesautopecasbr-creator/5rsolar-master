import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { CompanyId } from "../../common/decorators/company-id.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { DecideApprovalDto } from "./dto/decide-approval.dto";
import { ApprovalsService } from "./approvals.service";

@ApiTags("Workflow")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("approvals")
export class ApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  @Get()
  list(
    @CompanyId() companyId: string | undefined,
    @Query("status") status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED",
    @CurrentUser() user?: { sub: string },
  ) {
    return this.approvals.list(companyId, status, user?.sub);
  }

  @Get(":id")
  findOne(
    @Param("id") id: string,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user?: { sub: string },
  ) {
    return this.approvals.findOne(id, companyId, user?.sub);
  }

  @Post(":id/decide")
  decide(
    @Param("id") id: string,
    @Body() dto: DecideApprovalDto,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user?: { sub: string },
  ) {
    return this.approvals.decide(id, dto.decision, dto.note, user?.sub, companyId);
  }
}
