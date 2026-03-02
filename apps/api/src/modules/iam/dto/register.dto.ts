import { IsEmail, IsString, Matches, MinLength } from "class-validator";

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^\(\d{2}\)\s?\d{4,5}\s?\d{4}$/, {
    message: "Telefone deve estar no formato (XX) XXXXX XXXX",
  })
  phone: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message: "Senha deve conter maiuscula, minuscula, numero e especial",
  })
  password: string;
}
