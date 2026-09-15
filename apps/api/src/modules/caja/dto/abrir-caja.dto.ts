import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AbrirCajaDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto inicial debe ser un valor numérico' })
  @Min(0, { message: 'El monto inicial no puede ser negativo' })
  montoInicial: number;

  @IsOptional()
  @IsString()
  observacionesApertura?: string;
}
