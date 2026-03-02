import { IsDateString, IsOptional, IsString } from "class-validator";

export class CreateDiaryEntryDto {
  @IsOptional()
  @IsDateString()
  entryDate?: string;

  @IsString()
  notes: string;
}
