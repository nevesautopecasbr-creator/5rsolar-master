import { DocumentTemplateType } from "@prisma/client";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";

export class CreateDocumentTemplateDto {
  @IsString()
  name: string;

  @IsEnum(DocumentTemplateType)
  type: DocumentTemplateType;

  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
