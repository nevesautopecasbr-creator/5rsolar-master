import { ProjectStatus } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
} from "class-validator";

class ProjectProductSelectionDto {
  @IsString()
  productId: string;

  @IsString()
  name: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;
}

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  kWp?: number;

  @IsOptional()
  @IsString()
  utilityCompany?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectProductSelectionDto)
  productsUsed?: ProjectProductSelectionDto[];

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  customerId?: string;
}
