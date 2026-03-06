import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  isActive?: boolean;

  @IsUUID("4", { message: "Perfil (role) é obrigatório" })
  roleId: string;
}
