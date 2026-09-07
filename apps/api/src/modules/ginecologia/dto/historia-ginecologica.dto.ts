import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsDateString,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * DTO para el registro o actualización de la Historia Ginecológica de una paciente.
 */
export class GuardarHistoriaGinecologicaDto {
  @IsOptional()
  @IsInt({ message: 'La edad de menarquía debe ser un número entero' })
  @Min(8, { message: 'La edad de menarquía mínima es 8 años' })
  @Max(25, { message: 'La edad de menarquía máxima es 25 años' })
  menarquiaEdad?: number;

  @IsOptional()
  @IsInt({ message: 'La duración del ciclo debe ser un número entero de días' })
  @Min(15, { message: 'El ciclo mínimo es de 15 días' })
  @Max(60, { message: 'El ciclo máximo es de 60 días' })
  cicloDias?: number = 28;

  @IsOptional()
  @IsBoolean({ message: 'La regularidad del ciclo debe ser verdadero o falso' })
  cicloRegular?: boolean = true;

  @IsOptional()
  @IsDateString({}, { message: 'La FUM debe tener formato ISO 8601 (YYYY-MM-DD)' })
  fum?: string;

  @IsOptional()
  @IsBoolean({ message: 'La dismenorrea debe ser un valor booleano' })
  dismenorrea?: boolean = false;

  @IsOptional()
  @IsString({ message: 'El método anticonceptivo actual debe ser texto' })
  @MaxLength(100, { message: 'El método anticonceptivo no debe exceder 100 caracteres' })
  anticonceptivoActual?: string;

  @IsOptional()
  @IsString({ message: 'Los métodos previos deben ser texto' })
  @MaxLength(255, { message: 'Los métodos previos no deben exceder 255 caracteres' })
  metodosPrevios?: string;

  @IsOptional()
  @IsInt({ message: 'El total de gestas debe ser un número entero' })
  @Min(0, { message: 'Las gestas no pueden ser negativas' })
  gestas?: number = 0;

  @IsOptional()
  @IsInt({ message: 'El total de partos debe ser un número entero' })
  @Min(0, { message: 'Los partos no pueden ser negativos' })
  partos?: number = 0;

  @IsOptional()
  @IsInt({ message: 'El total de cesáreas debe ser un número entero' })
  @Min(0, { message: 'Las cesáreas no pueden ser negativas' })
  cesareas?: number = 0;

  @IsOptional()
  @IsInt({ message: 'El total de abortos debe ser un número entero' })
  @Min(0, { message: 'Los abortos no pueden ser negativos' })
  abortos?: number = 0;

  @IsOptional()
  @IsInt({ message: 'El total de ectópicos debe ser un número entero' })
  @Min(0, { message: 'Los ectópicos no pueden ser negativos' })
  ectopicos?: number = 0;

  @IsOptional()
  @IsInt({ message: 'La edad de inicio sexual debe ser un número entero' })
  @Min(10, { message: 'Edad de inicio sexual no válida' })
  @Max(50, { message: 'Edad de inicio sexual no válida' })
  inicioVidaSexualEdad?: number;

  @IsOptional()
  @IsInt({ message: 'El número de parejas sexuales debe ser un número entero' })
  @Min(0, { message: 'El número de parejas no puede ser negativo' })
  parejasSexuales?: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha del PAP debe tener formato ISO 8601 (YYYY-MM-DD)' })
  papUltimoFecha?: string;

  @IsOptional()
  @IsString({ message: 'El resultado del PAP debe ser texto' })
  @MaxLength(255, { message: 'El resultado del PAP no debe exceder 255 caracteres' })
  papUltimoResultado?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de la mamografía debe tener formato ISO 8601 (YYYY-MM-DD)' })
  mamografiaUltimaFecha?: string;

  @IsOptional()
  @IsString({ message: 'El resultado de la mamografía debe ser texto' })
  @MaxLength(100, { message: 'El resultado de la mamografía no debe exceder 100 caracteres' })
  mamografiaUltimaResultado?: string;

  @IsOptional()
  @IsString({ message: 'Las patologías ginecológicas deben ser texto' })
  patologiasGinecologicas?: string;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;
}
