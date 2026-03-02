import { IsOptional, IsString, IsBoolean } from "class-validator";

export class CreateContractTemplateDto {
  @IsString()
  name: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}