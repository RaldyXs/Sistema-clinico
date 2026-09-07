import { IsOptional, IsDateString, IsUUID } from 'class-validator';

export class FiltrosReporteDto {
  /**
   * Fecha de inicio para el rango analítico (formato ISO YYYY-MM-DD).
   * Por defecto, toma 30 días atrás.
   */
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe tener formato de fecha válido (YYYY-MM-DD)' })
  fechaInicio?: string;

  /**
   * Fecha de fin para el rango analítico (formato ISO YYYY-MM-DD).
   * Por defecto, toma la fecha actual.
   */
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe tener formato de fecha válido (YYYY-MM-DD)' })
  fechaFin?: string;

  /**
   * Filtrar métricas por un profesional de la salud específico.
   */
  @IsOptional()
  @IsUUID('4', { message: 'El ID del profesional debe ser un UUID válido' })
  profesionalId?: string;
}
