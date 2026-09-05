import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO para cancelar una cita médica.
 *
 * La cancelación requiere un motivo obligatorio por dos razones:
 * 1. Trazabilidad médico-legal: queda registrado quién canceló y por qué.
 * 2. Estadísticas operativas: la clínica puede analizar los motivos de cancelación
 *    más frecuentes para mejorar procesos (ej. enviar recordatorios con más anticipación).
 */
export class CancelarCitaDto {
  @IsNotEmpty({ message: 'El motivo de cancelación es obligatorio' })
  @IsString({ message: 'El motivo de cancelación debe ser texto' })
  motivoCancelacion: string;
}
