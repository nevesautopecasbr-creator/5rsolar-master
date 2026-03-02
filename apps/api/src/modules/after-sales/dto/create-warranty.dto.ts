import { IsDateString, IsOptional, IsString } from "class-validator";

export class CreateWarrantyDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  terms?: string;
}