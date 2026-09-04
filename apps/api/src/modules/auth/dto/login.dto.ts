import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Data Transfer Object (DTO) para el inicio de sesión.
 *
 * ¿Por qué usamos un DTO en lugar de recibir los datos directamente?
 * 1. Validación preventiva: `class-validator` intercepta la petición antes de que
 *    llegue al controlador. Si el email no es válido o la clave está vacía, NestJS
 *    devuelve automáticamente un error HTTP 400 (Bad Request) con un mensaje claro.
 * 2. Seguridad: Evita inyecciones de campos inesperados en el cuerpo de la petición.
 */
export class LoginDto {
  @IsEmail({}, { message: 'El correo electrónico debe ser una dirección de email válida' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
