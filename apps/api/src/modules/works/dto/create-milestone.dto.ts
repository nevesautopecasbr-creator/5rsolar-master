import { IsDateString, IsOptional, IsString } from "class-validator";

export class CreateMilestoneDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;
}
