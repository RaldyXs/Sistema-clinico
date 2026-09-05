import {
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

/**
 * DTO para la reprogramación o actualización de una cita existente.
 *
 * Todos los campos son opcionales (PATCH parcial).
 *
 * Casos de uso:
 * - Reprogramar fecha y hora (modificando `fechaHoraInicio` y opcionalmente `duracionMinutos`).
 * - Actualizar el motivo o añadir notas de recepción.
 *
 * Lo que NO se puede modificar por este DTO:
 * - `pacienteId`: El paciente de una cita no cambia.
 * - `profesionalId`: El médico asignado solo puede modificarse mediante reprogramación explícita.
 * - `estado`: El estado se gestiona mediante el flujo de estados clínicos (Tarea 14).
 * - `consultorioId`: Siempre viene del JWT, nunca de la petición.
 */
export class ActualizarCitaDto {
  @IsOptional()
  @IsDateString({}, {
    message: 'La nueva fecha/hora debe tener formato ISO 8601 con zona horaria (ej. 2026-09-10T11:00:00-04:00)',
  })
  fechaHoraInicio?: string;

  @IsOptional()
  @IsInt({ message: 'La duración debe ser un número entero de minutos' })
  @Min(5, { message: 'La duración mínima de una cita es de 5 minutos' })
  @Max(480, { message: 'La duración máxima de una cita es de 480 minutos (8 horas)' })
  duracionMinutos?: number;

  @IsOptional()
  @IsString({ message: 'El motivo debe ser texto' })
  @MaxLength(255, { message: 'El motivo no puede exceder 255 caracteres' })
  motivo?: string;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  notas?: string;
}
