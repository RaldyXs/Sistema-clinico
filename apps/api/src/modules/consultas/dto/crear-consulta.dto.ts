import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsNumber,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para la creación de una nueva Consulta Clínica (Acto Médico).
 *
 * Principios de diseño:
 * - `consultorioId` NO se envía en la petición. Se inyecta automáticamente desde el JWT.
 * - `pacienteId`: Obligatorio. Debe pertenecer a la misma clínica.
 * - `profesionalId`: Opcional. Si no se envía en el cuerpo, el servicio asume al médico autenticado.
 * - `citaId`: Opcional. Permite vincular la consulta con una cita previa o registrar atenciones espontáneas.
 * - `fechaAtencion`: Opcional. Por defecto toma la fecha y hora actual del sistema.
 * - Signos vitales: Validados con rangos fisiológicos realistas para prevenir errores de digitación.
 * - Cálculo automático: Si se envían `pesoKg` y `tallaCm`, el sistema calcula y almacena el IMC automáticamente.
 */
export class CrearConsultaDto {
  @IsNotEmpty({ message: 'El ID del paciente es obligatorio' })
  @IsUUID('4', { message: 'El ID del paciente debe ser un UUID v4 válido' })
  pacienteId: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID del profesional debe ser un UUID v4 válido' })
  profesionalId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de la cita debe ser un UUID v4 válido' })
  citaId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de atención debe tener formato ISO 8601' })
  fechaAtencion?: string;

  // ─── ANAMNESIS ─────────────────────────────────────────────────────────────

  @IsNotEmpty({ message: 'El motivo de la consulta es obligatorio' })
  @IsString({ message: 'El motivo debe ser texto' })
  @MaxLength(255, { message: 'El motivo no puede superar los 255 caracteres' })
  motivoConsulta: string;

  @IsOptional()
  @IsString({ message: 'La enfermedad actual debe ser texto' })
  enfermedadActual?: string;

  // ─── SIGNOS VITALES Y BIOMETRÍA ────────────────────────────────────────────

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El peso debe ser un valor numérico en kilogramos' })
  @Min(0.5, { message: 'El peso mínimo registrable es 0.5 kg' })
  @Max(500, { message: 'El peso máximo registrable es 500 kg' })
  pesoKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La talla debe ser un valor numérico en centímetros' })
  @Min(20, { message: 'La talla mínima registrable es 20 cm' })
  @Max(280, { message: 'La talla máxima registrable es 280 cm' })
  tallaCm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La presión arterial sistólica debe ser un número entero' })
  @Min(40, { message: 'Presión sistólica mínima fisiológica: 40 mmHg' })
  @Max(300, { message: 'Presión sistólica máxima: 300 mmHg' })
  presionSistolica?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La presión arterial diastólica debe ser un número entero' })
  @Min(20, { message: 'Presión diastólica mínima fisiológica: 20 mmHg' })
  @Max(200, { message: 'Presión diastólica máxima: 200 mmHg' })
  presionDiastolica?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La frecuencia cardíaca debe ser un número entero en lpm' })
  @Min(20, { message: 'Frecuencia cardíaca mínima fisiológica: 20 lpm' })
  @Max(300, { message: 'Frecuencia cardíaca máxima: 300 lpm' })
  frecuenciaCardiaca?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La frecuencia respiratoria debe ser un número entero en rpm' })
  @Min(5, { message: 'Frecuencia respiratoria mínima fisiológica: 5 rpm' })
  @Max(100, { message: 'Frecuencia respiratoria máxima: 100 rpm' })
  frecuenciaRespiratoria?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La temperatura corporal debe ser numérica (°C)' })
  @Min(25, { message: 'Temperatura corporal mínima fisiológica: 25 °C' })
  @Max(45, { message: 'Temperatura corporal máxima: 45 °C' })
  temperatura?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La saturación de oxígeno debe ser numérica (%)' })
  @Min(50, { message: 'Saturación de oxígeno mínima: 50 %' })
  @Max(100, { message: 'Saturación de oxígeno máxima: 100 %' })
  saturacionOxigeno?: number;

  // ─── EXPLORACIÓN Y EVOLUCIÓN ───────────────────────────────────────────────

  @IsOptional()
  @IsString({ message: 'El examen físico debe ser texto' })
  examenFisico?: string;

  @IsOptional()
  @IsString({ message: 'Las notas de evolución deben ser texto' })
  notasEvolucion?: string;

  // ─── DIAGNÓSTICO Y TRATAMIENTO ─────────────────────────────────────────────

  @IsOptional()
  @IsString({ message: 'El diagnóstico principal debe ser texto' })
  @MaxLength(255, { message: 'El diagnóstico principal no puede superar los 255 caracteres' })
  diagnosticoPrincipal?: string;

  @IsOptional()
  @IsString({ message: 'El código CIE-10 debe ser texto' })
  @MaxLength(20, { message: 'El código CIE-10 no puede superar 20 caracteres' })
  codigoCie10?: string;

  @IsOptional()
  @IsString({ message: 'Los diagnósticos secundarios deben ser texto' })
  diagnosticosSecundarios?: string;

  @IsOptional()
  @IsString({ message: 'El plan de tratamiento debe ser texto' })
  planTratamiento?: string;

  @IsOptional()
  @IsString({ message: 'Las indicaciones generales deben ser texto' })
  indicacionesGenerales?: string;

  // ─── CIERRE Y SEGUIMIENTO ──────────────────────────────────────────────────

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de próximo control debe tener formato YYYY-MM-DD' })
  proximoControl?: string;
}
