import {
  IsOptional,
  IsDateString,
  IsUUID,
  IsEnum,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { EstadoConsulta } from '../entities/consulta.entity.js';

/**
 * DTO para consultar y filtrar la línea de tiempo (Timeline 360°)
 * de la Historia Clínica del paciente.
 *
 * Permite al médico:
 * - Consultar toda la historia médica del paciente en orden cronológico inverso.
 * - Filtrar por rango de fechas (ej. último año de tratamiento).
 * - Filtrar por profesional tratante (ej. todas las atenciones del cardiólogo).
 * - Filtrar por diagnóstico CIE-10 (ej. buscar todas las visitas relacionadas con "I10").
 * - Filtrar por estado formal (ej. solo consultas COMPLETADAS).
 * - Paginación eficiente para expedientes médicos extensos.
 */
export class FiltrosHistorialClinicoDto {
  @IsOptional()
  @IsDateString({}, { message: 'fechaDesde debe tener formato YYYY-MM-DD' })
  fechaDesde?: string;

  @IsOptional()
  @IsDateString({}, { message: 'fechaHasta debe tener formato YYYY-MM-DD' })
  fechaHasta?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID del profesional debe ser un UUID v4 válido' })
  profesionalId?: string;

  @IsOptional()
  @IsString({ message: 'El código CIE-10 debe ser texto' })
  codigoCie10?: string;

  @IsOptional()
  @IsEnum(EstadoConsulta, {
    message: 'El estado debe ser BORRADOR, COMPLETADA o ANULADA',
  })
  estado?: EstadoConsulta;

  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página mínima es 1' })
  pagina?: number = 1;

  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(100, { message: 'El límite máximo es 100 registros por página' })
  limite?: number = 10;
}
