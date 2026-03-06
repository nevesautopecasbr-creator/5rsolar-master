import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { MondayService } from "./monday.service";
import { MondayWebhookPayloadDto } from "./dto/monday-webhook.dto";

/**
 * Entrada manual de lead (mesmo fluxo do webhook Monday: projeto + proposta + notificação).
 * Apenas perfis autorizados (ex.: Vendedor externo, Tráfego pago, Diretores) podem inserir leads.
 */
@ApiTags("Monday / Leads")
@Controller("monday/leads")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions("leads.write")
@ApiBearerAuth()
export class MondayLeadsController {
  constructor(private readonly monday: MondayService) {}

  @Post()
  @ApiOperation({
    summary: "Criar lead manualmente",
    description:
      "Dispara o mesmo fluxo do webhook: cliente/projeto/venda/proposta e notificação.",
  })
  async createLead(@Body() body: MondayWebhookPayloadDto) {
    return this.monday.processLeadFromWebhook(body);
  }
}
