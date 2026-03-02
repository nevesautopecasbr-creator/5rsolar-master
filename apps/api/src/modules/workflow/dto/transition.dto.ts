import { IsInt, IsObject, IsOptional, IsString, Min } from "class-validator";

export class TransitionDto {
  @IsString()
  action: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsInt()
  @Min(0)
  version: number;
}
