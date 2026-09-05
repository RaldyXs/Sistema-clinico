import { IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO para filtrar el historial biométrico y de signos vitales de un paciente.
 *
 * Permite al médico o al dashboard de Frontend solicitar los últimos N registros
 * o acotar un rango temporal (ej. evolución durante los últimos 6 meses de tratamiento).
 */
export class FiltrosSignosVitalesDto {
  /**
   * Cantidad máxima de registros a recuperar (por defecto 20, máximo 100).
   */
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(100, { message: 'El límite máximo es 100 registros' })
  limite?: number = 20;

  /**
   * Fecha de inicio para el análisis temporal (YYYY-MM-DD).
   */
  @IsOptional()
  @IsDateString({}, { message: 'fechaDesde debe tener formato YYYY-MM-DD' })
  fechaDesde?: string;

  /**
   * Fecha de fin para el análisis temporal (YYYY-MM-DD).
   */
  @IsOptional()
  @IsDateString({}, { message: 'fechaHasta debe tener formato YYYY-MM-DD' })
  fechaHasta?: string;
}
