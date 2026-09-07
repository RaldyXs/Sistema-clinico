import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoReceta } from '../entities/receta.entity.js';

/**
 * DTO para la filtración y paginación del listado de recetas médicas.
 */
export class FiltrosRecetasDto {
  @IsOptional()
  @IsUUID('4', { message: 'El ID del paciente debe ser un UUID v4 válido' })
  pacienteId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID del profesional debe ser un UUID v4 válido' })
  profesionalId?: string;

  @IsOptional()
  @IsEnum(EstadoReceta, { message: 'El estado no es un valor de EstadoReceta válido' })
  estado?: EstadoReceta;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha "desde" debe tener formato ISO 8601' })
  desde?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha "hasta" debe tener formato ISO 8601' })
  hasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser mayor o igual a 1' })
  pagina?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite debe ser al menos 1' })
  @Max(100, { message: 'El límite máximo permitido por página es 100' })
  limite?: number = 10;
}
