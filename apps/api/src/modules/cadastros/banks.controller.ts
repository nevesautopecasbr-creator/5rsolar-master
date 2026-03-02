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
import { BanksService } from "./banks.service";
import { CreateBankDto } from "./dto/create-bank.dto";
import { UpdateBankDto } from "./dto/update-bank.dto";

@ApiTags("Cadastros")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("banks")
export class BanksController {
  constructor(private readonly banksService: BanksService) {}

  @Get()
  @Permissions("cadastros.read")
  findAll(@CompanyId() companyId?: string) {
    return this.banksService.findAll(companyId);
  }

  @Get(":id")
  @Permissions("cadastros.read")
  findOne(@Param("id") id: string, @CompanyId() companyId?: string) {
    return this.banksService.findOne(id, companyId);
  }

  @Post()
  @Permissions("cadastros.write")
  create(
    @CompanyId() companyId: string | undefined,
    @Body() dto: CreateBankDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.banksService.create(companyId, dto, user?.sub);
  }

  @Patch(":id")
  @Permissions("cadastros.write")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateBankDto,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.banksService.update(id, dto, user?.sub, companyId);
  }

  @Delete(":id")
  @Permissions("cadastros.write")
  remove(
    @Param("id") id: string,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.banksService.remove(id, user?.sub, companyId);
  }
}