import { IsOptional, IsString } from "class-validator";

export class AssignWorkUserDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  role?: string;
}
