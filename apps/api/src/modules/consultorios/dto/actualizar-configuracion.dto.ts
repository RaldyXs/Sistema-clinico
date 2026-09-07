import {
  IsString,
  IsOptional,
  IsEmail,
  IsObject,
  MaxLength,
  Matches,
} from 'class-validator';

export class ActualizarConfiguracionDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email del consultorio debe ser válido' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([0-9a-fA-F]{3}){1,2}$/, {
    message: 'El color primario debe ser un código hexadecimal válido (ej. #0284c7)',
  })
  colorPrimario?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([0-9a-fA-F]{3}){1,2}$/, {
    message: 'El color secundario debe ser un código hexadecimal válido (ej. #0f172a)',
  })
  colorSecundario?: string;

  @IsOptional()
  @IsObject()
  horarioAtencion?: Record<string, any>;

  @IsOptional()
  @IsObject()
  modulosActivos?: Record<string, boolean>;

  @IsOptional()
  @IsObject()
  configuracionReceta?: Record<string, any>;
}
