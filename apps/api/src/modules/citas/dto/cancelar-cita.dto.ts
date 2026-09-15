import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO para cancelar una cita médica.
 *
 * La cancelación requiere un motivo por dos razones:
 * 1. Trazabilidad médico-legal: queda registrado quién canceló y por qué.
 * 2. Estadísticas operativas: la clínica puede analizar los motivos de cancelación.
 */
export class CancelarCitaDto {
  @Transform(({ value }) => {
    if (!value || typeof value !== 'string') return 'Cancelada a solicitud del paciente';
    const trimmed = value.trim();
    return trimmed === '' ? 'Cancelada a solicitud del paciente' : trimmed;
  })
  @IsOptional()
  @IsString({ message: 'El motivo de cancelación debe ser texto' })
  motivoCancelacion?: string = 'Cancelada a solicitud del paciente';
}
