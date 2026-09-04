import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { RolesService } from './roles.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

/**
 * Controlador de Roles y Permisos (RolesController).
 *
 * Expone endpoints protegidos para que los administradores puedan
 * consultar qué roles y qué permisos existen en el sistema.
 */
@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * Lista todos los roles disponibles para el consultorio del usuario autenticado.
   */
  @Get()
  async listarRoles(@Request() req: any) {
    const consultorioId = req.user?.consultorioId;
    return this.rolesService.listarRoles(consultorioId);
  }

  /**
   * Lista el catálogo completo de permisos del sistema agrupados.
   */
  @Get('permisos')
  async listarPermisos() {
    return this.rolesService.listarPermisos();
  }
}
