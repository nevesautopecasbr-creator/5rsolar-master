import { IsOptional, IsString } from "class-validator";

export class CreatePhotoDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  caption?: string;
}
