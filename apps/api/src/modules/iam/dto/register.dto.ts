import { IsEmail, IsString, Matches, MinLength } from "class-validator";

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^\d{10,11}$/, {
    message: "Telefone deve conter 10 ou 11 dígitos (DDD + número)",
  })
  phone: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message: "Senha deve conter maiuscula, minuscula, numero e especial",
  })
  password: string;
}
