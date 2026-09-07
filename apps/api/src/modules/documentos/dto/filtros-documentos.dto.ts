import {
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CategoriaDocumento } from '../entities/documento-clinico.entity.js';

/**
 * DTO para la consulta filtrada y paginada de documentos clínicos.
 */
export class FiltrosDocumentosDto {
  @IsOptional()
  @IsEnum(CategoriaDocumento, {
    message: 'La categoría no es un valor válido',
  })
  categoria?: CategoriaDocumento;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página mínima es 1' })
  pagina?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(100, { message: 'El límite máximo es 100' })
  limite?: number = 20;
}
