import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { RolUsuario } from '../entities/usuario.entity.js';

export class FiltrosUsuariosDto {
  @IsOptional()
  @IsEnum(RolUsuario)
  rolCodigo?: RolUsuario;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsString()
  especialidad?: string;

  @IsOptional()
  @IsString()
  busqueda?: string;
}
