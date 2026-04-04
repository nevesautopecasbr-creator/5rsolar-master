import { IsString } from "class-validator";

export class UploadTemplateImageDto {
  @IsString()
  fileBase64: string;

  @IsString()
  fileName: string;
}
