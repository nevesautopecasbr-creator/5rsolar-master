import { IsOptional, IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class CreateAddendumDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  valueChange?: number;
}