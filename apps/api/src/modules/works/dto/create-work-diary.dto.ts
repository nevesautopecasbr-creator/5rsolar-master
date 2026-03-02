import { IsOptional, IsString, IsDateString } from "class-validator";

export class CreateWorkDiaryDto {
  @IsOptional()
  @IsDateString()
  entryDate?: string;

  @IsString()
  notes: string;
}
