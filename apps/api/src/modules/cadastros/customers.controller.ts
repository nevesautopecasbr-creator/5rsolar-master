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
import { CustomersService } from "./customers.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";

@ApiTags("Cadastros")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Permissions("cadastros.read")
  findAll(@CompanyId() companyId?: string) {
    return this.customersService.findAll(companyId);
  }

  @Get(":id")
  @Permissions("cadastros.read")
  findOne(@Param("id") id: string, @CompanyId() companyId?: string) {
    return this.customersService.findOne(id, companyId);
  }

  @Post()
  @Permissions("cadastros.write")
  create(
    @CompanyId() companyId: string | undefined,
    @Body() dto: CreateCustomerDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.customersService.create(companyId, dto, user?.sub);
  }

  @Patch(":id")
  @Permissions("cadastros.write")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateCustomerDto,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.customersService.update(id, dto, user?.sub, companyId);
  }

  @Delete(":id")
  @Permissions("cadastros.write")
  remove(
    @Param("id") id: string,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.customersService.remove(id, user?.sub, companyId);
  }
}