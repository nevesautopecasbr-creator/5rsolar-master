import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CompanyId } from "../../common/decorators/company-id.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PurchaseReceiptsService } from "./purchase-receipts.service";
import { CreatePurchaseReceiptDto } from "./dto/create-purchase-receipt.dto";
import { UpdatePurchaseReceiptDto } from "./dto/update-purchase-receipt.dto";

@ApiTags("Compras")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("purchase-receipts")
export class PurchaseReceiptsController {
  constructor(private readonly service: PurchaseReceiptsService) {}

  @Get()
  @Permissions("compras.read")
  findAll(@CompanyId() companyId?: string) {
    return this.service.findAll(companyId);
  }

  @Get(":id")
  @Permissions("compras.read")
  findOne(@Param("id") id: string, @CompanyId() companyId?: string) {
    return this.service.findOne(id, companyId);
  }

  @Post()
  @Permissions("compras.write")
  create(
    @CompanyId() companyId: string | undefined,
    @Body() dto: CreatePurchaseReceiptDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.create(companyId, dto, user?.sub);
  }

  @Patch(":id")
  @Permissions("compras.write")
  update(
    @Param("id") id: string,
    @Body() dto: UpdatePurchaseReceiptDto,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.update(id, dto, user?.sub, companyId);
  }

  @Delete(":id")
  @Permissions("compras.write")
  remove(
    @Param("id") id: string,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.remove(id, user?.sub, companyId);
  }
}
