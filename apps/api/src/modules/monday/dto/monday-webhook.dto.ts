import { IsEmail, IsOptional, IsString } from "class-validator";

/**
 * Payload esperado do webhook Monday.com (Módulo 00).
 * Dados que chegam do Monday: nome do lead, empresa, contato, estágio do funil,
 * responsável comercial, observações da qualificação.
 */
export class MondayWebhookPayloadDto {
  @IsString({ message: "Nome do lead é obrigatório" })
  leadName: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsEmail({}, { message: "E-mail inválido" })
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  funnelStage?: string;

  @IsOptional()
  @IsString()
  commercialResponsible?: string;

  @IsOptional()
  @IsString()
  qualificationNotes?: string;

  /** ID do item no Monday (evita duplicidade de projeto) */
  @IsOptional()
  @IsString()
  mondayId?: string;
}
