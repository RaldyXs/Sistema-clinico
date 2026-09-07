import {
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsDateString,
  IsEnum,
  IsString,
  IsObject,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { TipoEcografia } from '../entities/ecografia.entity.js';
import type { BiometriaHadlock } from '../entities/ecografia.entity.js';

/**
 * DTO para la emisión y registro de un informe ecográfico obstétrico o ginecológico.
 */
export class CrearEcografiaDto {
  @IsNotEmpty({ message: 'El ID de la paciente es obligatorio' })
  @IsUUID('4', { message: 'El ID de la paciente debe ser un UUID v4 válido' })
  pacienteId: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID del embarazo debe ser un UUID v4 válido' })
  embarazoId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de la consulta debe ser un UUID v4 válido' })
  consultaId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID del profesional debe ser un UUID v4 válido' })
  profesionalId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID del documento adjunto debe ser un UUID v4 válido' })
  documentoId?: string;

  @IsNotEmpty({ message: 'El tipo de ecografía es obligatorio' })
  @IsEnum(TipoEcografia, { message: 'Tipo de ecografía no válido' })
  tipoEcografia: TipoEcografia;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha del estudio debe tener formato ISO 8601' })
  fechaEstudio?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Las semanas de gestación deben ser un número' })
  @Min(0)
  @Max(44)
  edadGestacionalSemanas?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Los días de gestación deben ser un número' })
  @Min(0)
  @Max(6)
  edadGestacionalDias?: number;

  @IsOptional()
  @IsObject({ message: 'La biometría fetal debe ser un objeto estructurado' })
  biometriaFetal?: BiometriaHadlock;

  @IsOptional()
  @IsString({ message: 'La localización de la placenta debe ser texto' })
  placentaLocalizacion?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El grado placentario debe ser un número entero (0 a 3)' })
  @Min(0)
  @Max(3)
  placentaGrado?: number;

  @IsOptional()
  @IsString({ message: 'El estado del líquido amniótico debe ser texto' })
  liquidoAmniotico?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El ILA debe ser un número en centímetros' })
  ilaCm?: number;

  @IsOptional()
  @IsString({ message: 'Las medidas uterinas deben ser texto' })
  uteroMedidas?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El grosor endometrial debe ser un número en mm' })
  endometrioGrosorMm?: number;

  @IsOptional()
  @IsString({ message: 'Los detalles de ovarios deben ser texto' })
  ovariosDetalles?: string;

  @IsNotEmpty({ message: 'La conclusión diagnóstica es obligatoria' })
  @IsString({ message: 'La conclusión diagnóstica debe ser texto' })
  conclusionDiagnostica: string;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;
}
