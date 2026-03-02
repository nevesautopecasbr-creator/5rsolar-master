import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";

export class SignContractDto {
  @IsString()
  signatureType: "DRAWN" | "UPLOAD";

  @IsOptional()
  @IsString()
  signatureImageBase64?: string;

  @IsOptional()
  @IsString()
  signatureFileUrl?: string;

  @IsString()
  signedName: string;

  @IsString()
  signedDocument: string;

  @IsBoolean()
  consent: boolean;

  @IsInt()
  @Min(0)
  version: number;
}
