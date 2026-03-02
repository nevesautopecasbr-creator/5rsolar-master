import { IsDateString, IsString } from "class-validator";

export class CreateReconciliationDto {
  @IsString()
  cashAccountId: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;
}
