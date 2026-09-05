import {
  IsOptional,
  IsDateString,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { EstadoCita } from '../entities/cita.entity.js';

/**
 * DTO para consultar la agenda de citas con filtros.
 *
 * Soporta dos modos de consulta:
 *
 * 1. VISTA DIARIA: Enviar solo `fecha` (ej. "2026-09-10")
 *    → Retorna todas las citas del día especificado.
 *
 * 2. VISTA SEMANAL / POR RANGO: Enviar `fechaDesde` y `fechaHasta`
 *    → Retorna todas las citas dentro del rango de fechas.
 *
 * Filtros opcionales combinables:
 * - `profesionalId`: Filtra la agenda de un médico específico.
 * - `estado`: Útil para la vista de sala de espera (ej. estado=EN_ESPERA).
 * - `pagina` y `limite`: Paginación para agendas con muchas citas.
 */
export class FiltrosAgendaDto {
  /**
   * Vista diaria: fecha específica en formato YYYY-MM-DD.
   * Si se provee, se ignoran fechaDesde y fechaHasta.
   */
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe estar en formato YYYY-MM-DD' })
  fecha?: string;

  /**
   * Inicio del rango de fechas para vista semanal o por rango.
   */
  @IsOptional()
  @IsDateString({}, { message: 'fechaDesde debe estar en formato YYYY-MM-DD' })
  fechaDesde?: string;

  /**
   * Fin del rango de fechas para vista semanal o por rango.
   */
  @IsOptional()
  @IsDateString({}, { message: 'fechaHasta debe estar en formato YYYY-MM-DD' })
  fechaHasta?: string;

  /**
   * Filtrar por médico o profesional de salud específico.
   * Útil cuando la clínica tiene múltiples profesionales.
   */
  @IsOptional()
  @IsUUID('4', { message: 'El profesionalId debe ser un UUID v4 válido' })
  profesionalId?: string;

  /**
   * Filtrar por estado del flujo clínico.
   * Ejemplo: estado=EN_ESPERA → Vista de sala de espera de recepción.
   */
  @IsOptional()
  @IsEnum(EstadoCita, {
    message: 'El estado debe ser uno de: PROGRAMADA, CONFIRMADA, EN_ESPERA, EN_CONSULTA, ATENDIDA, CANCELADA, NO_ASISTIO',
  })
  estado?: EstadoCita;

  /**
   * Número de página para la paginación de resultados (por defecto: 1).
   */
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página mínima es 1' })
  pagina?: number = 1;

  /**
   * Cantidad de citas por página (por defecto: 20, máximo: 100).
   */
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(100, { message: 'El límite máximo es 100 citas por página' })
  limite?: number = 20;
}
