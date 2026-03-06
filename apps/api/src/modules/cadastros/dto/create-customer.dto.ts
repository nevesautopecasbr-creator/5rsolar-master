import { IsArray, IsEmail, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ConsumerUnitDto } from "./consumer-unit.dto";

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsString()
  document: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  phone: string;

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

  /** Unidades consumidoras (pode ter mais de uma). */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsumerUnitDto)
  consumerUnits?: ConsumerUnitDto[];
}
