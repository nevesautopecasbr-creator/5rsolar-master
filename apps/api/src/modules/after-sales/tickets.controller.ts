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
import { TicketsService } from "./tickets.service";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";

@ApiTags("Pos-venda")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("tickets")
export class TicketsController {
  constructor(private readonly service: TicketsService) {}

  @Get()
  @Permissions("posvenda.read")
  findAll(@CompanyId() companyId?: string) {
    return this.service.findAll(companyId);
  }

  @Get(":id")
  @Permissions("posvenda.read")
  findOne(@Param("id") id: string, @CompanyId() companyId?: string) {
    return this.service.findOne(id, companyId);
  }

  @Post()
  @Permissions("posvenda.write")
  create(
    @CompanyId() companyId: string | undefined,
    @Body() dto: CreateTicketDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.create(companyId, dto, user?.sub);
  }

  @Patch(":id")
  @Permissions("posvenda.write")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateTicketDto,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.update(id, dto, user?.sub, companyId);
  }

  @Delete(":id")
  @Permissions("posvenda.write")
  remove(
    @Param("id") id: string,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.remove(id, user?.sub, companyId);
  }
}