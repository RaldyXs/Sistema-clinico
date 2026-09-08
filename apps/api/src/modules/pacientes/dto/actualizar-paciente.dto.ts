import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  IsDateString,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TipoDocumento, Genero, GrupoSanguineo } from '../entities/paciente.entity.js';

/**
 * DTO para la actualización de un paciente existente.
 * Todos los campos son opcionales (actualización parcial PATCH).
 */
export class ActualizarPacienteDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El apellido no puede exceder 100 caracteres' })
  apellido?: string;

  @Transform(({ value }) => {
    if (!value) return undefined;
    const v = String(value).toUpperCase().trim();
    return (TipoDocumento as any)[v] || v;
  })
  @IsOptional()
  @IsEnum(TipoDocumento, {
    message: 'El tipo de documento debe ser CEDULA, DNI, PASAPORTE u OTRO',
  })
  tipoDocumento?: TipoDocumento;

  @Transform(({ value, obj }) => {
    const doc = value || obj.dni;
    return doc ? String(doc).trim() : undefined;
  })
  @IsOptional()
  @IsString({ message: 'El documento de identidad debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El documento no puede exceder 50 caracteres' })
  documentoIdentidad?: string;

  @IsOptional()
  @IsString()
  dni?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)' })
  fechaNacimiento?: string;

  @Transform(({ value, obj }) => {
    const raw = value || obj.sexo;
    if (!raw) return undefined;
    if (typeof raw === 'string') {
      const v = raw.toUpperCase().trim();
      return (Genero as any)[v] || v;
    }
    return raw;
  })
  @IsOptional()
  @IsEnum(Genero, {
    message: 'El género debe ser FEMENINO, MASCULINO u OTRO',
  })
  genero?: Genero;

  @IsOptional()
  @IsString()
  sexo?: string;

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

  @Transform(({ value }) => {
    if (!value || value === '' || value === 'null' || value === 'DESCONOCIDO') return undefined;
    const map: Record<string, GrupoSanguineo> = {
      'O_POSITIVO': GrupoSanguineo.O_POSITIVO,
      'O_NEGATIVO': GrupoSanguineo.O_NEGATIVO,
      'A_POSITIVO': GrupoSanguineo.A_POSITIVO,
      'A_NEGATIVO': GrupoSanguineo.A_NEGATIVO,
      'B_POSITIVO': GrupoSanguineo.B_POSITIVO,
      'B_NEGATIVO': GrupoSanguineo.B_NEGATIVO,
      'AB_POSITIVO': GrupoSanguineo.AB_POSITIVO,
      'AB_NEGATIVO': GrupoSanguineo.AB_NEGATIVO,
    };
    return map[value] || value;
  })
  @IsOptional()
  @IsEnum(GrupoSanguineo, {
    message: 'Grupo sanguíneo no válido (ej. A+, O+, B-, etc.)',
  })
  grupoSanguineo?: GrupoSanguineo;

  @Transform(({ value }) => {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  })
  @IsOptional()
  @IsString({ message: 'Las alergias deben ser texto' })
  alergias?: string | null;

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

  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  activo?: boolean;
}
