import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';

/**
 * DTO para la definición de cada medicamento atómico prescrito en la receta médica.
 */
export class MedicamentoRecetaDto {
  @IsNotEmpty({ message: 'El nombre del medicamento es obligatorio' })
  @IsString({ message: 'El nombre del medicamento debe ser una cadena de texto' })
  @MaxLength(150, { message: 'El nombre del medicamento no debe exceder 150 caracteres' })
  medicamento: string;

  @IsNotEmpty({ message: 'La presentación farmacéutica es obligatoria' })
  @IsString({ message: 'La presentación debe ser una cadena de texto' })
  @MaxLength(100, { message: 'La presentación no debe exceder 100 caracteres' })
  presentacion: string;

  @IsNotEmpty({ message: 'La dosis es obligatoria' })
  @IsString({ message: 'La dosis debe ser una cadena de texto' })
  @MaxLength(100, { message: 'La dosis no debe exceder 100 caracteres' })
  dosis: string;

  @IsNotEmpty({ message: 'La vía de administración es obligatoria' })
  @IsString({ message: 'La vía debe ser una cadena de texto' })
  @MaxLength(50, { message: 'La vía no debe exceder 50 caracteres' })
  via: string;

  @IsNotEmpty({ message: 'La frecuencia es obligatoria' })
  @IsString({ message: 'La frecuencia debe ser una cadena de texto' })
  @MaxLength(100, { message: 'La frecuencia no debe exceder 100 caracteres' })
  frecuencia: string;

  @IsNotEmpty({ message: 'La duración del tratamiento es obligatoria' })
  @IsString({ message: 'La duración debe ser una cadena de texto' })
  @MaxLength(100, { message: 'La duración no debe exceder 100 caracteres' })
  duracion: string;

  @IsOptional()
  @IsString({ message: 'Las indicaciones deben ser texto' })
  indicaciones?: string;

  @IsOptional()
  @IsNumber({}, { message: 'La cantidad a despachar debe ser un número' })
  @Min(1, { message: 'La cantidad a despachar debe ser al menos 1' })
  cantidad?: number;
}
