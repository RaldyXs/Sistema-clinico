import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Data Transfer Object (DTO) para el registro inicial de un Consultorio y su Administrador.
 *
 * En un SaaS, el proceso de "Onboarding" suele crear simultáneamente:
 * 1. El Consultorio (Organización / Tenant).
 * 2. El primer Usuario administrador que gestionará dicha clínica.
 */
export class RegistroDto {
  @IsString({ message: 'El nombre es obligatorio' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  nombre: string;

  @IsString()
  @IsOptional()
  apellido?: string;

  @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres para mayor seguridad' })
  password: string;

  @IsString({ message: 'El nombre del consultorio es obligatorio' })
  @IsNotEmpty({ message: 'Debe especificar el nombre del consultorio o clínica' })
  nombreConsultorio: string;
}
