import {
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para la actualización clínica de una consulta en curso (estado BORRADOR).
 *
 * Permite al profesional de la salud registrar o modificar:
 * - Diagnóstico principal y código CIE-10.
 * - Diagnósticos secundarios o comorbilidades.
 * - Plan de tratamiento médico e indicaciones farmacológicas/dietéticas.
 * - Notas de evolución clínica y examen físico.
 * - Ajuste o corrección de signos vitales.
 * - Fecha sugerida para el próximo control médico.
 *
 * Principio médico-legal:
 * Este DTO solo puede ser procesado si la consulta se encuentra en estado `BORRADOR`.
 * Una vez `COMPLETADA`, queda sellada e inalterable.
 */
export class ActualizarDiagnosticoTratamientoDto {
  // ─── DIAGNÓSTICO Y TRATAMIENTO ─────────────────────────────────────────────

  @IsOptional()
  @IsString({ message: 'El diagnóstico principal debe ser texto' })
  @MaxLength(255, { message: 'El diagnóstico principal no puede superar 255 caracteres' })
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

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de próximo control debe tener formato YYYY-MM-DD' })
  proximoControl?: string;

  // ─── NOTAS CLÍNICAS Y EVOLUCIÓN ───────────────────────────────────────────

  @IsOptional()
  @IsString({ message: 'El motivo de consulta debe ser texto' })
  @MaxLength(255, { message: 'El motivo no puede superar 255 caracteres' })
  motivoConsulta?: string;

  @IsOptional()
  @IsString({ message: 'La enfermedad actual debe ser texto' })
  enfermedadActual?: string;

  @IsOptional()
  @IsString({ message: 'El examen físico debe ser texto' })
  examenFisico?: string;

  @IsOptional()
  @IsString({ message: 'Las notas de evolución deben ser texto' })
  notasEvolucion?: string;

  // ─── ACTUALIZACIÓN DE SIGNOS VITALES (OPCIONAL) ───────────────────────────

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El peso debe ser numérico' })
  @Min(0.5)
  @Max(500)
  pesoKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La talla debe ser numérica' })
  @Min(20)
  @Max(280)
  tallaCm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(40)
  @Max(300)
  presionSistolica?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(20)
  @Max(200)
  presionDiastolica?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(20)
  @Max(300)
  frecuenciaCardiaca?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(100)
  frecuenciaRespiratoria?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(25)
  @Max(45)
  temperatura?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(50)
  @Max(100)
  saturacionOxigeno?: number;
}
