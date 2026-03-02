import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ContractAddendaService } from "./addenda.service";
import { CreateAddendumDto } from "./dto/create-addendum.dto";

@ApiTags("Contratos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("contracts/:contractId/addenda")
export class ContractAddendaController {
  constructor(private readonly service: ContractAddendaService) {}

  @Get()
  @Permissions("contratos.read")
  findAll(@Param("contractId") contractId: string) {
    return this.service.findAll(contractId);
  }

  @Post()
  @Permissions("contratos.write")
  create(
    @Param("contractId") contractId: string,
    @Body() dto: CreateAddendumDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.create(contractId, dto, user?.sub);
  }

  @Delete(":id")
  @Permissions("contratos.write")
  remove(@Param("id") id: string, @CurrentUser() user: { sub: string }) {
    return this.service.remove(id, user?.sub);
  }
}
