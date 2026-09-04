import { IsString, IsOptional, MaxLength } from 'class-validator';

/**
 * DTO para la actualización de datos del consultorio.
 */
export class ActualizarConsultorioDto {
  @IsOptional()
  @IsString({ message: 'El nombre del consultorio debe ser texto' })
  @MaxLength(150, { message: 'El nombre no puede exceder 150 caracteres' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  @MaxLength(50, { message: 'El teléfono no puede exceder 50 caracteres' })
  telefono?: string;

  @IsOptional()
  @IsString({ message: 'La dirección debe ser texto' })
  @MaxLength(255, { message: 'La dirección no puede exceder 255 caracteres' })
  direccion?: string;
}
