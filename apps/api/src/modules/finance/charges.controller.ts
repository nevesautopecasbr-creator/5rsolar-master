import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CompanyId } from "../../common/decorators/company-id.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ChargesService } from "./charges.service";
import { ChargeRequest } from "./providers/payment-provider";

@ApiTags("Financeiro")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("charges")
export class ChargesController {
  constructor(private readonly service: ChargesService) {}

  @Post()
  @Permissions("financeiro.write")
  createCharge(
    @CompanyId() companyId: string | undefined,
    @Body() dto: ChargeRequest,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.createCharge(companyId, dto, user?.sub);
  }
}
