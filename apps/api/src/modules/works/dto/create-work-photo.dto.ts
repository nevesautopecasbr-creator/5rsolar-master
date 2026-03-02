import { IsOptional, IsString } from "class-validator";

export class CreateWorkPhotoDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  caption?: string;
}
