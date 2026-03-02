import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { PaymentsService } from "./payments.service";
import { CreateBoletoDto } from "./dto/create-boleto.dto";
import { CreatePixDto } from "./dto/create-pix.dto";

@ApiTags("Financeiro")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("payments")
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post("boleto")
  @Permissions("financeiro.write")
  createBoleto(@Body() dto: CreateBoletoDto) {
    return this.service.createBoleto(dto);
  }

  @Post("pix")
  @Permissions("financeiro.write")
  createPix(@Body() dto: CreatePixDto) {
    return this.service.createPix(dto);
  }
}
