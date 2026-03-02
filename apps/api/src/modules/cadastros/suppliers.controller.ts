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
import { SuppliersService } from "./suppliers.service";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";

@ApiTags("Cadastros")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("suppliers")
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @Permissions("cadastros.read")
  findAll(@CompanyId() companyId?: string) {
    return this.suppliersService.findAll(companyId);
  }

  @Get(":id")
  @Permissions("cadastros.read")
  findOne(@Param("id") id: string, @CompanyId() companyId?: string) {
    return this.suppliersService.findOne(id, companyId);
  }

  @Post()
  @Permissions("cadastros.write")
  create(
    @CompanyId() companyId: string | undefined,
    @Body() dto: CreateSupplierDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.suppliersService.create(companyId, dto, user?.sub);
  }

  @Patch(":id")
  @Permissions("cadastros.write")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateSupplierDto,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.suppliersService.update(id, dto, user?.sub, companyId);
  }

  @Delete(":id")
  @Permissions("cadastros.write")
  remove(
    @Param("id") id: string,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.suppliersService.remove(id, user?.sub, companyId);
  }
}