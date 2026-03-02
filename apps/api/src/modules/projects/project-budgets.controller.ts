import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CompanyId } from "../../common/decorators/company-id.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { CreateProjectBudgetDto } from "./dto/create-project-budget.dto";
import { UpdateProjectBudgetDto } from "./dto/update-project-budget.dto";
import { ProjectBudgetsService } from "./project-budgets.service";

@ApiTags("Projetos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("project-budgets")
export class ProjectBudgetsController {
  constructor(private readonly service: ProjectBudgetsService) {}

  @Get()
  @Permissions("projetos.read")
  findAll(
    @CompanyId() companyId?: string,
    @Query("projectId") projectId?: string,
  ) {
    return this.service.findAll(companyId, projectId);
  }

  @Get(":id")
  @Permissions("projetos.read")
  findOne(@Param("id") id: string, @CompanyId() companyId?: string) {
    return this.service.findOne(id, companyId);
  }

  @Post()
  @Permissions("projetos.write")
  create(
    @CompanyId() companyId: string | undefined,
    @Body() dto: CreateProjectBudgetDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.create(companyId, dto, user?.sub);
  }

  @Patch(":id")
  @Permissions("projetos.write")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateProjectBudgetDto,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.update(id, dto, user?.sub, companyId);
  }

  @Delete(":id")
  @Permissions("projetos.write")
  remove(
    @Param("id") id: string,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.remove(id, user?.sub, companyId);
  }
}
