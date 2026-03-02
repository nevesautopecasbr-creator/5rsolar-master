import { Type } from "class-transformer";
import { IsNumber, IsString } from "class-validator";

export class CreateVariableExpenseDto {
  @IsString()
  description: string;

  @Type(() => Number)
  @IsNumber()
  pct: number;
}
