import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { RolUsuario } from '../entities/usuario.entity.js';

export class ActualizarUsuarioDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  apellido?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(100)
  password?: string;

  @IsOptional()
  @IsEnum(RolUsuario, { message: 'El rol debe ser ADMIN, MEDICO o RECEPCION' })
  rolCodigo?: RolUsuario;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de rol debe ser un UUID válido' })
  rolId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  especialidad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  matriculaProfesional?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefono?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
