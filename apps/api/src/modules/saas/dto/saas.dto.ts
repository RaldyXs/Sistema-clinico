import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsBoolean,
  IsIn,
} from 'class-validator';

export class OnboardingDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la clínica o consultorio es obligatorio' })
  nombreConsultorio: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  especialidadPrincipal?: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre del administrador es obligatorio' })
  adminNombre: string;

  @IsString()
  @IsOptional()
  adminApellido?: string;

  @IsEmail({}, { message: 'El correo electrónico del administrador debe ser válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  adminEmail: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  adminPassword: string;

  @IsString()
  @IsIn(['BASICO', 'PROFESIONAL', 'ENTERPRISE'], {
    message: 'El plan debe ser BASICO, PROFESIONAL o ENTERPRISE',
  })
  planCodigo: string;

  @IsString()
  @IsOptional()
  @IsIn(['MENSUAL', 'ANUAL'])
  periodo?: string = 'MENSUAL';
}

export class CambiarPlanDto {
  @IsString()
  @IsIn(['BASICO', 'PROFESIONAL', 'ENTERPRISE'])
  planCodigo: string;

  @IsString()
  @IsOptional()
  @IsIn(['MENSUAL', 'ANUAL'])
  periodo?: string = 'MENSUAL';
}

export class CambiarEstadoTenantDto {
  @IsBoolean()
  activo: boolean;
}

export class SolicitarPlanDto {
  @IsString()
  @IsIn(['BASICO', 'PROFESIONAL', 'ENTERPRISE'], {
    message: 'El plan debe ser BASICO, PROFESIONAL o ENTERPRISE',
  })
  planCodigo: string;

  @IsString()
  @IsOptional()
  @IsIn(['MENSUAL', 'ANUAL'])
  periodo?: string = 'MENSUAL';

  @IsString()
  @IsNotEmpty({ message: 'El número de referencia o comprobante de la transferencia es obligatorio' })
  referenciaTransferencia: string;

  @IsString()
  @IsOptional()
  bancoOrigen?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}

export class RechazarSolicitudPlanDto {
  @IsString()
  @IsOptional()
  motivo?: string;
}
