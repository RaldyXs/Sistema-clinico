import {
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';
import { TipoEmbarazo, FactorRh } from '../entities/embarazo.entity.js';

/**
 * DTO para la apertura de un nuevo episodio de embarazo / control obstétrico.
 */
export class CrearEmbarazoDto {
  @IsNotEmpty({ message: 'El ID de la paciente es obligatorio' })
  @IsUUID('4', { message: 'El ID de la paciente debe ser un UUID v4 válido' })
  pacienteId: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID del profesional debe ser un UUID v4 válido' })
  profesionalId?: string;

  @IsNotEmpty({ message: 'La Fecha de Última Regla (FUR) es obligatoria' })
  @IsDateString({}, { message: 'La FUR debe tener formato ISO 8601 (YYYY-MM-DD)' })
  fur: string;

  @IsOptional()
  @IsBoolean({ message: 'La confiabilidad de la FUR debe ser un booleano' })
  furConfiable?: boolean = true;

  @IsOptional()
  @IsDateString({}, { message: 'La FPP ecográfica debe tener formato ISO 8601' })
  fppEcoPrecoz?: string;

  @IsOptional()
  @IsInt({ message: 'El número de gravidez debe ser un número entero' })
  @Min(1, { message: 'La gravidez mínima es 1' })
  gravidezNumero?: number = 1;

  @IsOptional()
  @IsEnum(TipoEmbarazo, { message: 'Tipo de embarazo no válido' })
  tipoEmbarazo?: TipoEmbarazo = TipoEmbarazo.UNICO;

  @IsOptional()
  @IsString({ message: 'El grupo sanguíneo debe ser texto' })
  @MaxLength(10, { message: 'El grupo sanguíneo no debe exceder 10 caracteres' })
  grupoSanguineo?: string;

  @IsOptional()
  @IsEnum(FactorRh, { message: 'Factor Rh no válido (POSITIVO o NEGATIVO)' })
  factorRh?: FactorRh;

  @IsOptional()
  @IsBoolean({ message: 'sensibilizadaRh debe ser un valor booleano' })
  sensibilizadaRh?: boolean = false;

  @IsOptional()
  @IsNumber({}, { message: 'El peso pregestacional debe ser un número' })
  @Min(30, { message: 'El peso pregestacional mínimo es 30 kg' })
  @Max(250, { message: 'El peso pregestacional máximo es 250 kg' })
  pesoPregestacionalKg?: number;

  @IsOptional()
  @IsInt({ message: 'La talla debe ser un número entero en cm' })
  @Min(120, { message: 'La talla mínima es 120 cm' })
  @Max(220, { message: 'La talla máxima es 220 cm' })
  tallaCm?: number;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;
}

/**
 * DTO para finalizar formalmente una gestación con desenlace obstétrico.
 */
export class FinalizarEmbarazoDto {
  @IsNotEmpty({ message: 'El estado de finalización es obligatorio' })
  @IsEnum(
    [
      'FINALIZADO_PARTO',
      'FINALIZADO_CESAREA',
      'FINALIZADO_ABORTO',
    ],
    { message: 'El estado debe ser FINALIZADO_PARTO, FINALIZADO_CESAREA o FINALIZADO_ABORTO' },
  )
  estado: any;

  @IsNotEmpty({ message: 'La fecha de término es obligatoria' })
  @IsDateString({}, { message: 'La fecha de término debe tener formato ISO 8601' })
  fechaTermino: string;

  @IsNotEmpty({ message: 'Los detalles y desenlace obstétrico son obligatorios' })
  @IsString({ message: 'Los detalles del desenlace deben ser texto' })
  desenlaceDetalles: string;
}
