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
 * Todas las operaciones están protegidas con aislamiento multi-tenant estricto.
 */
@UseGuards(JwtAuthGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  /**
   * Registra un nuevo usuario en la clínica (médico, administrativo, recepcionista).
   */
  @Post()
  async crear(
    @ConsultorioActual() consultorioId: string,
    @Body() dto: CrearUsuarioDto,
  ) {
    return this.usuariosService.crear(consultorioId, dto);
  }

  /**
   * Lista los usuarios del consultorio con filtros opcionales por rol, especialidad o búsqueda.
   */
  @Get()
  async listar(
    @ConsultorioActual() consultorioId: string,
    @Query() filtros: FiltrosUsuariosDto,
  ) {
    return this.usuariosService.listar(consultorioId, filtros);
  }

  /**
   * Obtiene la nómina rápida de médicos y profesionales de la salud del consultorio.
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
    @Param('id') id: string,
    @Body() dto: ActualizarUsuarioDto,
  ) {
    return this.usuariosService.actualizar(consultorioId, id, dto);
  }

  /**
   * Activa o suspende el acceso al sistema para un usuario del consultorio.
   */
  @Patch(':id/estado')
  async cambiarEstado(
    @ConsultorioActual() consultorioId: string,
    @Request() req: any,
    @Param('id') id: string,
    @Body('activo') activo: boolean,
  ) {
    return this.usuariosService.cambiarEstado(consultorioId, id, activo, req.user?.id);
  }

  /**
   * Elimina un usuario del consultorio y revoca sus accesos en todas las sesiones.
   * La acción queda registrada inalterablemente en la auditoría del sistema.
   */
  @Delete(':id')
  async eliminar(
    @ConsultorioActual() consultorioId: string,
    @Request() req: any,
    @Param('id') id: string,
  ) {
    return this.usuariosService.eliminar(
      consultorioId,
      id,
      req.user,
      req.ip,
      req.headers?.['user-agent'],
    );
  }
}
