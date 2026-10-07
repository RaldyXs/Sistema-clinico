import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TipoDocumento, Genero, GrupoSanguineo } from '../entities/paciente.entity.js';

/**
 * DTO para la creación de un nuevo paciente.
 *
 * Aplica validaciones estrictas y transformaciones tolerantes en la API:
 * - Soporta aliases como `dni` (mapeado a `documentoIdentidad`) y `sexo` (mapeado a `genero`).
 * - Mapea grupos sanguíneos tanto en formato enum ('O_POSITIVO') como clínico ('O+').
 * - Permite dejar alergias vacías o con texto 'Ninguna'.
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

  @Transform(({ value, obj }) => {
    const raw = value || obj.tipoDocumento;
    if (!raw) return TipoDocumento.DNI;
    const v = String(raw).toUpperCase().trim();
    return (TipoDocumento as any)[v] || v;
  })
  @IsOptional()
  @IsEnum(TipoDocumento, {
    message: 'El tipo de documento debe ser CEDULA, DNI, PASAPORTE u OTRO',
  })
  tipoDocumento?: TipoDocumento = TipoDocumento.DNI;

  @Transform(({ value, obj }) => {
    const doc = value || obj.dni;
    return doc ? String(doc).trim() : undefined;
  })
  @IsOptional()
  @IsString({ message: 'El documento de identidad debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El documento no puede exceder 50 caracteres' })
  documentoIdentidad?: string;

  /**
   * Alias compatible para peticiones que envíen `dni`.
   */
  @IsOptional()
  @IsString()
  dni?: string;

  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
  @IsDateString({}, { message: 'La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)' })
  fechaNacimiento: string;

  @Transform(({ value, obj }) => {
    const raw = value || obj.sexo || Genero.OTRO;
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
  genero?: Genero = Genero.FEMENINO;

  /**
   * Alias compatible para peticiones que envíen `sexo`.
   */
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
  @IsString()
  @MaxLength(50)
  numeroHistoria?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ars?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  numeroPoliza?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  planSeguro?: string;
}
