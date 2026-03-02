import { IsDateString, IsOptional, IsString } from "class-validator";

export class CreateWorkMilestoneDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
