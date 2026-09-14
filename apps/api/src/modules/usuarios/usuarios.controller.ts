import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service.js';
import { CrearUsuarioDto } from './dto/crear-usuario.dto.js';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto.js';
import { FiltrosUsuariosDto } from './dto/filtros-usuario.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ConsultorioActual } from '../../common/decorators/consultorio-actual.decorator.js';

/**
 * Controlador de Administración de Usuarios y Médicos.
 *
 * Permite a los administradores del consultorio gestionar el personal de la clínica:
 * alta de médicos, recepcionistas, edición de especialidades, matrículas y estados.
 * Todas las operaciones están protegidas con aislamiento multi-tenant estricto
 * y verificación rigurosa de roles (solo ADMIN y SUPERADMIN).
 */
@UseGuards(JwtAuthGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  /**
   * Helper para verificar si el usuario solicitante es Administrador o SuperAdmin.
   */
  private verificarAdmin(req: any) {
    const rol = req.user?.rol?.codigo || req.user?.rolCodigo;
    if (rol !== 'ADMIN' && rol !== 'SUPERADMIN') {
      throw new ForbiddenException(
        'Acceso restringido: Solo el Administrador de la clínica o SuperAdmin pueden realizar esta acción.',
      );
    }
  }

  /**
   * Registra un nuevo usuario en la clínica (médico, administrativo, recepcionista).
   * Restringido a Administradores.
   */
  @Post()
  async crear(
    @ConsultorioActual() consultorioId: string,
    @Request() req: any,
    @Body() dto: CrearUsuarioDto,
  ) {
    this.verificarAdmin(req);
    return this.usuariosService.crear(consultorioId, dto);
  }

  /**
   * Lista los usuarios del consultorio con filtros opcionales.
   * Restringido a Administradores (los médicos no deben visualizar la nómina completa de usuarios).
   */
  @Get()
  async listar(
    @ConsultorioActual() consultorioId: string,
    @Request() req: any,
    @Query() filtros: FiltrosUsuariosDto,
  ) {
    this.verificarAdmin(req);
    return this.usuariosService.listar(consultorioId, filtros);
  }

  /**
   * Obtiene la nómina de médicos para asignación de turnos y agendas clínicas.
   * Accesible por personal médico y administrativo debidamente autenticado.
   */
  @Get('medicos')
  async listarMedicos(@ConsultorioActual() consultorioId: string) {
    return this.usuariosService.listarMedicos(consultorioId);
  }

  /**
   * Obtiene el perfil de un usuario específico del consultorio.
   */
  @Get(':id')
  async obtenerPorId(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
  ) {
    return this.usuariosService.obtenerPorId(consultorioId, id);
  }

  /**
   * Actualiza el perfil, datos profesionales, credenciales o rol de un usuario.
   */
  @Patch(':id')
  async actualizar(
    @ConsultorioActual() consultorioId: string,
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ActualizarUsuarioDto,
  ) {
    const rol = req.user?.rol?.codigo || req.user?.rolCodigo;
    if (rol !== 'ADMIN' && rol !== 'SUPERADMIN' && req.user?.id !== id) {
      throw new ForbiddenException('No tienes permisos para modificar este usuario.');
    }
    return this.usuariosService.actualizar(
      consultorioId,
      id,
      dto,
      req.user,
      req.ip,
      req.headers?.['user-agent'],
    );
  }

  /**
   * Activa o suspende el acceso al sistema para un usuario del consultorio.
   * Restringido estrictamente a Administradores.
   */
  @Patch(':id/estado')
  async cambiarEstado(
    @ConsultorioActual() consultorioId: string,
    @Request() req: any,
    @Param('id') id: string,
    @Body('activo') activo: boolean,
  ) {
    this.verificarAdmin(req);
    return this.usuariosService.cambiarEstado(
      consultorioId,
      id,
      activo,
      req.user?.id,
      req.user?.rol?.codigo || req.user?.rolCodigo,
    );
  }

  /**
   * Elimina un usuario del consultorio y revoca sus accesos en todas las sesiones.
   * Restringido estrictamente a Administradores. La acción se registra en auditoría.
   */
  @Delete(':id')
  async eliminar(
    @ConsultorioActual() consultorioId: string,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    this.verificarAdmin(req);
    return this.usuariosService.eliminar(
      consultorioId,
      id,
      req.user,
      req.ip,
      req.headers?.['user-agent'],
    );
  }
}
