import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MedicamentoRecetaDto } from './medicamento-receta.dto.js';

/**
 * DTO para la emisión de una nueva Receta Médica Digital.
 */
export class CrearRecetaDto {
  @IsNotEmpty({ message: 'El ID del paciente es obligatorio' })
  @IsUUID('4', { message: 'El ID del paciente debe ser un UUID v4 válido' })
  pacienteId: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID del profesional debe ser un UUID v4 válido' })
  profesionalId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de la consulta debe ser un UUID v4 válido' })
  consultaId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de emisión debe tener formato ISO 8601' })
  fechaEmision?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de vencimiento debe tener formato ISO 8601 (YYYY-MM-DD)' })
  fechaVencimiento?: string;

  @IsOptional()
  @IsString({ message: 'El diagnóstico de referencia debe ser texto' })
  @MaxLength(255, { message: 'El diagnóstico de referencia no debe exceder 255 caracteres' })
  diagnosticoReferencia?: string;

  @IsArray({ message: 'Los medicamentos deben ser un listado' })
  @ArrayMinSize(1, { message: 'Debe incluir al menos un medicamento en la receta' })
  @ValidateNested({ each: true })
  @Type(() => MedicamentoRecetaDto)
  medicamentos: MedicamentoRecetaDto[];

  @IsOptional()
  @IsString({ message: 'Las indicaciones generales deben ser texto' })
  indicacionesGenerales?: string;
}
