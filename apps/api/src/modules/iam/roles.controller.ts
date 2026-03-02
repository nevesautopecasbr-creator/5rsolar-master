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
import { RolesService } from "./roles.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { AssignPermissionsDto } from "./dto/assign-permissions.dto";

@ApiTags("IAM")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions("iam.read")
  findAll(@CompanyId() companyId?: string) {
    return this.rolesService.findAll(companyId);
  }

  @Post()
  @Permissions("iam.write")
  create(
    @CompanyId() companyId: string | undefined,
    @Body() dto: CreateRoleDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.rolesService.create(companyId, dto, user?.sub);
  }

  @Patch(":id")
  @Permissions("iam.write")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.rolesService.update(id, dto, user?.sub);
  }

  @Delete(":id")
  @Permissions("iam.write")
  remove(@Param("id") id: string, @CurrentUser() user: { sub: string }) {
    return this.rolesService.remove(id, user?.sub);
  }

  @Post(":id/permissions")
  @Permissions("iam.write")
  assignPermissions(
    @Param("id") id: string,
    @Body() dto: AssignPermissionsDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.rolesService.assignPermissions(id, dto, user?.sub);
  }
}
