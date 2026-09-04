import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { TipoDocumento, Genero, GrupoSanguineo } from '../entities/paciente.entity.js';

/**
 * DTO para la creación de un nuevo paciente.
 *
 * Aplica validaciones estrictas en la API:
 * - Sanitiza y valida longitudes máximas para proteger PostgreSQL.
 * - Enums tipados para evitar datos inválidos (género, tipo de documento, grupo sanguíneo).
 * - No incluye `consultorioId` porque este se inyecta de forma segura desde el JWT.
 */
export class CrearPacienteDto {
  @IsNotEmpty({ message: 'El nombre del paciente es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombre: string;

  @IsNotEmpty({ message: 'El apellido del paciente es obligatorio' })
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El apellido no puede exceder 100 caracteres' })
  apellido: string;

  @IsNotEmpty({ message: 'El tipo de documento es obligatorio' })
  @IsEnum(TipoDocumento, {
    message: 'El tipo de documento debe ser CEDULA, DNI, PASAPORTE u OTRO',
  })
  tipoDocumento: TipoDocumento;

  @IsOptional()
  @IsString({ message: 'El documento de identidad debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El documento no puede exceder 50 caracteres' })
  documentoIdentidad?: string;

  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
  @IsDateString({}, { message: 'La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)' })
  fechaNacimiento: string;

  @IsNotEmpty({ message: 'El género es obligatorio' })
  @IsEnum(Genero, {
    message: 'El género debe ser FEMENINO, MASCULINO u OTRO',
  })
  genero: Genero;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  @MaxLength(50, { message: 'El teléfono no puede exceder 50 caracteres' })
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico debe tener un formato válido' })
  @MaxLength(150, { message: 'El correo electrónico no puede exceder 150 caracteres' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'La dirección debe ser texto' })
  direccion?: string;

  @IsOptional()
  @IsEnum(GrupoSanguineo, {
    message: 'Grupo sanguíneo no válido (ej. A+, O+, B-, etc.)',
  })
  grupoSanguineo?: GrupoSanguineo;

  @IsOptional()
  @IsString({ message: 'Las alergias deben ser texto' })
  alergias?: string;

  @IsOptional()
  @IsString({ message: 'Los antecedentes médicos deben ser texto' })
  antecedentesMedicos?: string;

  @IsOptional()
  @IsString({ message: 'Los antecedentes familiares deben ser texto' })
  antecedentesFamiliares?: string;

  @IsOptional()
  @IsString({ message: 'El nombre del contacto de emergencia debe ser texto' })
  @MaxLength(150, { message: 'El nombre del contacto de emergencia no puede exceder 150 caracteres' })
  contactoEmergenciaNombre?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono del contacto de emergencia debe ser texto' })
  @MaxLength(50, { message: 'El teléfono de emergencia no puede exceder 50 caracteres' })
  contactoEmergenciaTelefono?: string;
}
