import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { CategoriaDocumento } from '../entities/documento-clinico.entity.js';

/**
 * DTO para la subida de un archivo o estudio médico adjunto.
 */
export class SubirDocumentoDto {
  @IsNotEmpty({ message: 'El ID del paciente es obligatorio' })
  @IsUUID('4', { message: 'El ID del paciente debe ser un UUID v4 válido' })
  pacienteId: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de la consulta debe ser un UUID v4 válido' })
  consultaId?: string;

  @IsOptional()
  @IsEnum(CategoriaDocumento, {
    message: 'La categoría debe ser LABORATORIO, IMAGENOLOGIA, INFORME_EXTERNO, CONSENTIMIENTO u OTRO',
  })
  categoria?: CategoriaDocumento = CategoriaDocumento.OTRO;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(500, { message: 'La descripción no debe exceder 500 caracteres' })
  descripcion?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha del documento debe tener formato ISO 8601 (YYYY-MM-DD)' })
  fechaDocumento?: string;
}
