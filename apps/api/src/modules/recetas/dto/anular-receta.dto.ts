import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO para la anulación justificada de una receta médica.
 */
export class AnularRecetaDto {
  @IsNotEmpty({ message: 'El motivo de anulación es obligatorio' })
  @IsString({ message: 'El motivo de anulación debe ser una cadena de texto' })
  @MinLength(5, { message: 'El motivo de anulación debe contener al menos 5 caracteres' })
  motivoAnulacion: string;
}
