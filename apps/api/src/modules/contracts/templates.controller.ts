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
import { TemplatesService } from "./templates.service";
import { CreateContractTemplateDto } from "./dto/create-contract-template.dto";
import { UpdateContractTemplateDto } from "./dto/update-contract-template.dto";

@ApiTags("Contratos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("contract-templates")
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @Permissions("contratos.read")
  findAll(@CompanyId() companyId?: string) {
    return this.templatesService.findAll(companyId);
  }

  @Get(":id")
  @Permissions("contratos.read")
  findOne(@Param("id") id: string, @CompanyId() companyId?: string) {
    return this.templatesService.findOne(id, companyId);
  }

  @Post()
  @Permissions("contratos.write")
  create(
    @CompanyId() companyId: string | undefined,
    @Body() dto: CreateContractTemplateDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.templatesService.create(companyId, dto, user?.sub);
  }

  @Patch(":id")
  @Permissions("contratos.write")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateContractTemplateDto,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.templatesService.update(id, dto, user?.sub, companyId);
  }

  @Delete(":id")
  @Permissions("contratos.write")
  remove(
    @Param("id") id: string,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.templatesService.remove(id, user?.sub, companyId);
  }
}