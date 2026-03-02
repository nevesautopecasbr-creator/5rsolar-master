import { IsDateString, IsNumber, IsString } from "class-validator";
import { Type } from "class-transformer";

export class CreateBoletoDto {
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @IsDateString()
  dueDate: string;

  @IsString()
  payerName: string;
}
