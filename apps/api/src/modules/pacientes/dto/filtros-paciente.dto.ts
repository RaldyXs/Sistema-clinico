import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Genero, GrupoSanguineo } from '../entities/paciente.entity.js';

/**
 * DTO para la consulta, búsqueda y filtrado paginado de pacientes.
 */
export class FiltrosPacienteDto {
  /**
   * Término de búsqueda libre.
   * Busca coincidencias parciales (insensibles a mayúsculas) en:
   * nombre, apellido, nombre completo, documento de identidad y teléfono.
   */
  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto' })
  termino?: string;

  /**
   * Filtro por género biológico / filiación.
   */
  @IsOptional()
  @IsEnum(Genero, {
    message: 'El género debe ser FEMENINO, MASCULINO u OTRO',
  })
  genero?: Genero;

  /**
   * Filtro por grupo sanguíneo.
   */
  @IsOptional()
  @IsEnum(GrupoSanguineo, {
    message: 'Grupo sanguíneo no válido',
  })
  grupoSanguineo?: GrupoSanguineo;

  /**
   * Filtro por estado activo o inactivo (soft-deleted).
   * Se transforma desde string ('true' / 'false') enviado por query params.
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean({ message: 'El parámetro activo debe ser un valor booleano' })
  activo?: boolean;

  /**
   * Número de página (1-indexed). Por defecto 1.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página mínima es 1' })
  pagina: number = 1;

  /**
   * Cantidad máxima de registros por página. Por defecto 10, máximo 100.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(100, { message: 'El límite máximo por página es 100' })
  limite: number = 10;

  /**
   * Campo por el cual ordenar los resultados.
   */
  @IsOptional()
  @IsIn(['apellido', 'nombre', 'creadoEn', 'fechaNacimiento'], {
    message: 'El campo de ordenamiento debe ser apellido, nombre, creadoEn o fechaNacimiento',
  })
  ordenarPor: string = 'apellido';

  /**
   * Dirección del ordenamiento.
   */
  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'], {
    message: 'La dirección debe ser ASC o DESC',
  })
  direccion: 'ASC' | 'DESC' = 'ASC';
}
