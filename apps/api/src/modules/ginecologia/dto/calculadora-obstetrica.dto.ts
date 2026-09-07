import {
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

/**
 * DTO para la calculadora obstétrica de FUR, FPP y edad gestacional.
 */
export class CalculadoraObstetricaDto {
  @IsNotEmpty({ message: 'La Fecha de Última Regla (FUR) es obligatoria' })
  @IsDateString({}, { message: 'La FUR debe tener formato ISO 8601 (YYYY-MM-DD)' })
  fur: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de referencia debe tener formato ISO 8601' })
  fechaReferencia?: string;

  @IsOptional()
  @IsInt({ message: 'La duración del ciclo debe ser un número entero en días' })
  @Min(20)
  @Max(45)
  cicloDias?: number = 28;
}
