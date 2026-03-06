import { IsNumber, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export class ConsumerUnitDto {
  @IsString()
  consumerUnitCode: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  currentConsumptionKwh?: number;
}
