import {
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsNumber,
  IsString,
  IsEnum,
  IsArray,
} from 'class-validator';
import {
  PresentacionFetal,
  EdemaGrado,
} from '../entities/control-prenatal.entity.js';

/**
 * DTO para el registro de un control prenatal periódico.
 */
export class CrearControlPrenatalDto {
  @IsNotEmpty({ message: 'El ID del embarazo es obligatorio' })
  @IsUUID('4', { message: 'El ID del embarazo debe ser un UUID v4 válido' })
  embarazoId: string;

  @IsNotEmpty({ message: 'El ID de la paciente es obligatorio' })
  @IsUUID('4', { message: 'El ID de la paciente debe ser un UUID v4 válido' })
  pacienteId: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de la consulta debe ser un UUID v4 válido' })
  consultaId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID del profesional debe ser un UUID v4 válido' })
  profesionalId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha del control debe tener formato ISO 8601' })
  fechaControl?: string;

  @IsOptional()
  @IsInt({ message: 'Las semanas de gestación deben ser un número entero' })
  @Min(0, { message: 'Semanas de gestación mínimas: 0' })
  @Max(44, { message: 'Semanas de gestación máximas: 44' })
  edadGestacionalSemanas?: number;

  @IsOptional()
  @IsInt({ message: 'Los días de gestación deben ser entre 0 y 6' })
  @Min(0)
  @Max(6)
  edadGestacionalDias?: number;

  @IsNotEmpty({ message: 'El peso materno es obligatorio' })
  @IsNumber({}, { message: 'El peso materno debe ser un número en kg' })
  @Min(30, { message: 'El peso mínimo permitido es 30 kg' })
  @Max(250, { message: 'El peso máximo permitido es 250 kg' })
  pesoMaternoKg: number;

  @IsNotEmpty({ message: 'La presión arterial sistólica es obligatoria' })
  @IsInt({ message: 'La presión sistólica debe ser un número entero' })
  @Min(60, { message: 'Presión sistólica mínima fisiológica: 60 mmHg' })
  @Max(250, { message: 'Presión sistólica máxima fisiológica: 250 mmHg' })
  presionSistolica: number;

  @IsNotEmpty({ message: 'La presión arterial diastólica es obligatoria' })
  @IsInt({ message: 'La presión diastólica debe ser un número entero' })
  @Min(30, { message: 'Presión diastólica mínima fisiológica: 30 mmHg' })
  @Max(160, { message: 'Presión diastólica máxima fisiológica: 160 mmHg' })
  presionDiastolica: number;

  @IsOptional()
  @IsInt({ message: 'La altura uterina debe ser un entero en centímetros' })
  @Min(5, { message: 'Altura uterina mínima: 5 cm' })
  @Max(50, { message: 'Altura uterina máxima: 50 cm' })
  alturaUterinaCm?: number;

  @IsOptional()
  @IsInt({ message: 'La frecuencia cardíaca fetal debe ser un entero en lpm' })
  @Min(60, { message: 'FCF mínima fisiológica: 60 lpm' })
  @Max(220, { message: 'FCF máxima fisiológica: 220 lpm' })
  frecuenciaCardiacaFetalLpm?: number;

  @IsOptional()
  @IsString({ message: 'Los movimientos fetales deben ser texto' })
  movimientosFetales?: string;

  @IsOptional()
  @IsEnum(PresentacionFetal, { message: 'Presentación fetal no válida' })
  presentacionFetal?: PresentacionFetal = PresentacionFetal.NO_EVALUABLE;

  @IsOptional()
  @IsEnum(EdemaGrado, { message: 'Grado de edema no válido' })
  edema?: EdemaGrado = EdemaGrado.AUSENTE;

  @IsOptional()
  @IsString({ message: 'La proteinuria debe ser texto' })
  proteinuria?: string;

  @IsOptional()
  @IsArray({ message: 'Los síntomas de alarma deben ser un listado' })
  sintomasAlarma?: string[];

  @IsOptional()
  @IsString({ message: 'Las indicaciones deben ser texto' })
  indicaciones?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha del próximo control debe tener formato ISO 8601' })
  proximoControlFecha?: string;
}
