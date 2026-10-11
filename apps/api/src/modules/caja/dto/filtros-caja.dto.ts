import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { MetodoPago, EstadoPago } from '../entities/pago.entity.js';

export class FiltrosCajaDto {
  @IsOptional()
  @IsUUID('4')
  sesionCajaId?: string;

  @IsOptional()
  @IsUUID('4')
  pacienteId?: string;

  @IsOptional()
  @IsEnum(MetodoPago)
  metodoPago?: MetodoPago;

  @IsOptional()
  @IsEnum(EstadoPago)
  estado?: EstadoPago;

  @IsOptional()
  @IsString()
  desde?: string;

  @IsOptional()
  @IsString()
  hasta?: string;

  @IsOptional()
  @IsString()
  ars?: string;

  @IsOptional()
  @IsString()
  profesionalId?: string;

  @IsOptional()
  soloSeguros?: boolean;

  @IsOptional()
  @Type(() => Number)
  pagina?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limite?: number = 20;
}
