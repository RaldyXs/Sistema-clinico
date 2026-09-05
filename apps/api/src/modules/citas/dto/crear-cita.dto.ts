import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

/**
 * DTO para el agendamiento de una nueva cita médica.
 *
 * Principios de diseño:
 * - `consultorioId` NO se recibe aquí. Siempre se inyecta de forma segura desde el JWT
 *   mediante `@ConsultorioActual()` en el controlador.
 * - `estado` no se acepta en la creación: toda cita nace con estado `PROGRAMADA` automáticamente.
 * - `fechaHoraInicio` en formato ISO 8601 con zona horaria (ej. "2026-09-10T09:00:00-04:00").
 *   Esto garantiza que el backend almacene siempre en UTC, sin ambigüedad de huso horario.
 * - `duracionMinutos` por defecto es 30, pero la recepcionista puede cambiarlo según el tipo
 *   de consulta (15 min para control, 60 min para consulta nueva con exámenes, etc.).
 */
export class CrearCitaDto {
  @IsNotEmpty({ message: 'El ID del paciente es obligatorio' })
  @IsUUID('4', { message: 'El ID del paciente debe ser un UUID v4 válido' })
  pacienteId: string;

  @IsNotEmpty({ message: 'El ID del profesional de salud es obligatorio' })
  @IsUUID('4', { message: 'El ID del profesional debe ser un UUID v4 válido' })
  profesionalId: string;

  @IsNotEmpty({ message: 'La fecha y hora de inicio de la cita es obligatoria' })
  @IsDateString({}, {
    message: 'La fecha/hora de inicio debe tener formato ISO 8601 con zona horaria (ej. 2026-09-10T09:00:00-04:00)',
  })
  fechaHoraInicio: string;

  @IsOptional()
  @IsInt({ message: 'La duración debe ser un número entero de minutos' })
  @Min(5, { message: 'La duración mínima de una cita es de 5 minutos' })
  @Max(480, { message: 'La duración máxima de una cita es de 480 minutos (8 horas)' })
  duracionMinutos?: number;

  @IsNotEmpty({ message: 'El motivo de la consulta es obligatorio' })
  @IsString({ message: 'El motivo debe ser texto' })
  @MaxLength(255, { message: 'El motivo no puede exceder 255 caracteres' })
  motivo: string;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  notas?: string;
}
