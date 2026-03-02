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
import { ReceivablesService } from "./receivables.service";
import { CreateReceivableDto } from "./dto/create-receivable.dto";
import { UpdateReceivableDto } from "./dto/update-receivable.dto";

@ApiTags("Financeiro")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("receivables")
export class ReceivablesController {
  constructor(private readonly service: ReceivablesService) {}

  @Get()
  @Permissions("financeiro.read")
  findAll(@CompanyId() companyId?: string) {
    return this.service.findAll(companyId);
  }

  @Get(":id")
  @Permissions("financeiro.read")
  findOne(@Param("id") id: string, @CompanyId() companyId?: string) {
    return this.service.findOne(id, companyId);
  }

  @Post()
  @Permissions("financeiro.write")
  create(
    @CompanyId() companyId: string | undefined,
    @Body() dto: CreateReceivableDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.create(companyId, dto, user?.sub);
  }

  @Patch(":id")
  @Permissions("financeiro.write")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateReceivableDto,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.update(id, dto, user?.sub, companyId);
  }

  @Delete(":id")
  @Permissions("financeiro.write")
  remove(
    @Param("id") id: string,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.remove(id, user?.sub, companyId);
  }
}