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
import { WorksService } from "./works.service";
import { CreateWorkOrderDto } from "./dto/create-work-order.dto";
import { UpdateWorkOrderDto } from "./dto/update-work-order.dto";
import { CreateChecklistItemDto } from "./dto/create-checklist-item.dto";
import { CreateWorkPhotoDto } from "./dto/create-work-photo.dto";
import { CreateWorkDiaryDto } from "./dto/create-work-diary.dto";
import { CreateWorkMilestoneDto } from "./dto/create-work-milestone.dto";
import { AssignWorkUserDto } from "./dto/assign-work-user.dto";

@ApiTags("Obras")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("work-orders")
export class WorksController {
  constructor(private readonly worksService: WorksService) {}

  @Get()
  @Permissions("obras.read")
  findAll(@CompanyId() companyId?: string) {
    return this.worksService.findAll(companyId);
  }

  @Get(":id")
  @Permissions("obras.read")
  findOne(@Param("id") id: string, @CompanyId() companyId?: string) {
    return this.worksService.findOne(id, companyId);
  }

  @Post()
  @Permissions("obras.write")
  create(
    @CompanyId() companyId: string | undefined,
    @Body() dto: CreateWorkOrderDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.worksService.create(companyId, dto, user?.sub);
  }

  @Patch(":id")
  @Permissions("obras.write")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateWorkOrderDto,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.worksService.update(id, dto, user?.sub, companyId);
  }

  @Delete(":id")
  @Permissions("obras.write")
  remove(
    @Param("id") id: string,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.worksService.remove(id, user?.sub, companyId);
  }

  @Post(":id/checklist")
  @Permissions("obras.write")
  addChecklistItem(
    @Param("id") id: string,
    @Body() dto: CreateChecklistItemDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.worksService.addChecklistItem(id, dto, user?.sub);
  }

  @Post(":id/photos")
  @Permissions("obras.write")
  addPhoto(
    @Param("id") id: string,
    @Body() dto: CreateWorkPhotoDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.worksService.addPhoto(id, dto, user?.sub);
  }

  @Post(":id/diary")
  @Permissions("obras.write")
  addDiaryEntry(
    @Param("id") id: string,
    @Body() dto: CreateWorkDiaryDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.worksService.addDiaryEntry(id, dto, user?.sub);
  }

  @Post(":id/milestones")
  @Permissions("obras.write")
  addMilestone(
    @Param("id") id: string,
    @Body() dto: CreateWorkMilestoneDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.worksService.addMilestone(id, dto, user?.sub);
  }

  @Post(":id/assignees")
  @Permissions("obras.write")
  assignUser(
    @Param("id") id: string,
    @Body() dto: AssignWorkUserDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.worksService.assignUser(id, dto, user?.sub);
  }
}