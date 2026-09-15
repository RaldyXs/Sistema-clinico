import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MetodoPago } from '../entities/pago.entity.js';

export class RegistrarPagoDto {
  @IsUUID('4', { message: 'El ID de paciente debe ser un UUID válido' })
  pacienteId: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de cita debe ser un UUID válido' })
  citaId?: string;

  @IsString({ message: 'El concepto es obligatorio' })
  concepto: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'El monto total debe ser un número válido' })
  @Min(0.01, { message: 'El monto total debe ser mayor a 0' })
  montoTotal: number;

  @IsEnum(MetodoPago, { message: 'Método de pago no válido' })
  metodoPago: MetodoPago;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montoRecibido?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  montoCopago?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  coberturaSeguro?: number;

  @IsOptional()
  @IsString()
  nombreAseguradora?: string;

  @IsOptional()
  @IsString()
  numeroPoliza?: string;

  @IsOptional()
  @IsString()
  numeroAutorizacion?: string;

  @IsOptional()
  @IsString()
  referenciaTransaccion?: string;

  @IsOptional()
  @IsString()
  notas?: string;
}
