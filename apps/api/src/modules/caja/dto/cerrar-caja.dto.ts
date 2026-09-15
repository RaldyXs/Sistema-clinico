import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CerrarCajaDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto real contado debe ser un valor numérico' })
  @Min(0, { message: 'El monto real contado no puede ser negativo' })
  montoRealEfectivo: number;

  @IsOptional()
  @IsString()
  observacionesCierre?: string;
}
