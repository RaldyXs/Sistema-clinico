import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { ConsultorioActual } from '../../common/decorators/consultorio-actual.decorator.js';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator.js';
import { AuditoriaService } from './auditoria.service.js';

@Controller('auditoria')
@UseGuards(JwtAuthGuard)
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  /**
   * Resumen analítico de eventos de seguridad y actividad para la clínica (o global para SuperAdmin).
   * Restringido a Administradores de la clínica o SuperAdmin.
   */
  @Get('resumen')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  async obtenerResumen(
    @ConsultorioActual() consultorioId: string,
    @UsuarioActual() usuario: any,
  ) {
    const esSuperAdmin = usuario?.rolCodigo === 'SUPERADMIN' || usuario?.rol?.codigo === 'SUPERADMIN';
    return this.auditoriaService.obtenerResumen(consultorioId, esSuperAdmin);
  }

  /**
   * Trazabilidad de acceso a la ficha clínica de un paciente (Cumplimiento HIPAA).
   * Restringido a Médicos y Administradores clínicos.
   */
  @Get('paciente/:pacienteId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MEDICO', 'SUPERADMIN')
  async obtenerHistorialPaciente(
    @ConsultorioActual() consultorioId: string,
    @Param('pacienteId', ParseUUIDPipe) pacienteId: string,
  ) {
    return this.auditoriaService.obtenerHistorialPaciente(consultorioId, pacienteId);
  }

  /**
   * Listado paginado y filtrable de eventos de auditoría del consultorio.
   * Restringido a Administradores de la clínica o SuperAdmin.
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  async listar(
    @ConsultorioActual() consultorioId: string,
    @UsuarioActual() usuario: any,
    @Query('modulo') modulo?: string,
    @Query('accion') accion?: string,
    @Query('usuarioId') usuarioId?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('limite') limite?: string,
    @Query('pagina') pagina?: string,
  ) {
    const esSuperAdmin = usuario?.rolCodigo === 'SUPERADMIN' || usuario?.rol?.codigo === 'SUPERADMIN';
    return this.auditoriaService.listar(
      consultorioId,
      {
        modulo,
        accion,
        usuarioId,
        fechaInicio,
        fechaFin,
        limite: limite ? parseInt(limite, 10) : undefined,
        pagina: pagina ? parseInt(pagina, 10) : undefined,
      },
      esSuperAdmin,
    );
  }
}
