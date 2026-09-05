import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * DTO para anular una consulta médica.
 *
 * La anulación de un acto médico es un evento excepcional que requiere
 * obligatoriamente una justificación médico-legal detallada para auditoría
 * (ej. error de selección de paciente, duplicidad accidental, etc.).
 */
export class AnularConsultaDto {
  @IsNotEmpty({ message: 'El motivo de anulación es obligatorio' })
  @IsString({ message: 'El motivo de anulación debe ser texto' })
  @MaxLength(500, { message: 'El motivo de anulación no puede superar los 500 caracteres' })
  motivoAnulacion: string;
}
