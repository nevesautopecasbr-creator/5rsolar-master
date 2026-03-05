import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { MondayService } from "./monday.service";
import { MondayWebhookPayloadDto } from "./dto/monday-webhook.dto";

/**
 * Entrada manual de lead (mesmo fluxo do webhook Monday: projeto + proposta + notificação).
 */
@ApiTags("Monday / Leads")
@Controller("monday/leads")
@UseGuards(JwtAuthGuard)
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
