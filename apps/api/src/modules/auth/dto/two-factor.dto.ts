import { IsString, Length } from 'class-validator';

export class Verify2faDto {
  @IsString()
  @Length(6, 6, { message: 'El código 2FA debe tener exactamente 6 dígitos' })
  codigo: string;
}

export class Disable2faDto {
  @IsString()
  password: string;

  @IsString()
  codigo: string;
}

export class Login2faDto {
  @IsString()
  tempToken: string;

  @IsString()
  codigo: string;
}
