import { IsOptional, IsString } from "class-validator";

export class AssignAssigneeDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  role?: string;
}
