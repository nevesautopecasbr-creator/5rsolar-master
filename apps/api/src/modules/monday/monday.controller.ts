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

/**
 * Webhook Monday.com (Módulo 00).
 * Endpoint público: lead qualificado no Monday dispara criação de projeto + proposta + notificação.
 */
@Controller("webhooks/monday")
export class MondayController {
  constructor(private readonly monday: MondayService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async webhook(@Body() body: MondayWebhookPayloadDto) {
    if (!body?.leadName && !body?.company) {
      throw new BadRequestException(
        "Payload inválido: informe ao menos leadName ou company.",
      );
    }
    return this.monday.processLeadFromWebhook(body);
  }
}
