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
import { ProjectsService } from "./projects.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";

@ApiTags("Projetos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @Permissions("projetos.read")
  findAll(@CompanyId() companyId?: string) {
    return this.projectsService.findAll(companyId);
  }

  @Get(":id")
  @Permissions("projetos.read")
  findOne(@Param("id") id: string, @CompanyId() companyId?: string) {
    return this.projectsService.findOne(id, companyId);
  }

  @Post()
  @Permissions("projetos.write")
  create(
    @CompanyId() companyId: string | undefined,
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.projectsService.create(companyId, dto, user?.sub);
  }

  @Patch(":id")
  @Permissions("projetos.write")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateProjectDto,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.projectsService.update(id, dto, user?.sub, companyId);
  }

  @Delete(":id")
  @Permissions("projetos.write")
  remove(
    @Param("id") id: string,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.projectsService.remove(id, user?.sub, companyId);
  }
}