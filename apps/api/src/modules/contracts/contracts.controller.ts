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
import { ContractsService } from "./contracts.service";
import { CreateContractDto } from "./dto/create-contract.dto";
import { UpdateContractDto } from "./dto/update-contract.dto";
import { CreateAddendumDto } from "./dto/create-addendum.dto";

@ApiTags("Contratos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("contracts")
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  @Permissions("contratos.read")
  findAll(@CompanyId() companyId?: string) {
    return this.contractsService.findAll(companyId);
  }

  @Get(":id")
  @Permissions("contratos.read")
  findOne(@Param("id") id: string, @CompanyId() companyId?: string) {
    return this.contractsService.findOne(id, companyId);
  }

  @Post()
  @Permissions("contratos.write")
  create(
    @CompanyId() companyId: string | undefined,
    @Body() dto: CreateContractDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.contractsService.create(companyId, dto, user?.sub);
  }

  @Patch(":id")
  @Permissions("contratos.write")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateContractDto,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.contractsService.update(id, dto, user?.sub, companyId);
  }

  @Delete(":id")
  @Permissions("contratos.write")
  remove(
    @Param("id") id: string,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.contractsService.remove(id, user?.sub, companyId);
  }

  @Post(":id/addenda")
  @Permissions("contratos.write")
  addAddendum(
    @Param("id") id: string,
    @Body() dto: CreateAddendumDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.contractsService.addAddendum(id, dto, user?.sub);
  }
}