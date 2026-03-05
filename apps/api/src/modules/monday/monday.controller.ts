import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from "@nestjs/common";
import { ApiExcludeEndpoint } from "@nestjs/swagger";
import { MondayService } from "./monday.service";
import { MondayWebhookPayloadDto } from "./dto/monday-webhook.dto";

/** Body pode ser o challenge do Monday (verificação) ou o payload de lead. */
type MondayWebhookBody = MondayWebhookPayloadDto | { challenge?: string };

/**
 * Webhook Monday.com (Módulo 00).
 * Endpoint público: lead qualificado no Monday dispara criação de projeto + proposta + notificação.
 * Na configuração do webhook, o Monday envia { challenge: "token" } e exige a mesma resposta para validar.
 */
@Controller("webhooks/monday")
export class MondayController {
  constructor(private readonly monday: MondayService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async webhook(@Body() body: MondayWebhookBody) {
    const challenge = body && typeof body === "object" && "challenge" in body ? (body as { challenge: string }).challenge : undefined;
    if (typeof challenge === "string") {
      return { challenge };
    }
    const payload = body as MondayWebhookPayloadDto;
    if (!payload?.leadName && !payload?.company) {
      throw new BadRequestException(
        "Payload inválido: informe ao menos leadName ou company.",
      );
    }
    return this.monday.processLeadFromWebhook(payload);
  }
}
