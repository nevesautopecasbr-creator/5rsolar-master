import { Type } from "class-transformer";
import { IsNumber, IsString } from "class-validator";

export class CreateFixedExpenseDto {
  @IsString()
  description: string;

  @Type(() => Number)
  @IsNumber()
  monthlyValue: number;
}
