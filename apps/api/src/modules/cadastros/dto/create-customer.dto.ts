import { IsEmail, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  /** Consumo atual em kWh (obrigatório para orçamento 5R). */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  currentConsumptionKwh?: number;

  /** Código da Unidade Consumidora (UC) na concessionária. */
  @IsOptional()
  @IsString()
  consumerUnitCode?: string;
}