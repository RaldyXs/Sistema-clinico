import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ConsultoriosService } from './consultorios.service.js';
import { ActualizarConsultorioDto } from './dto/actualizar-consultorio.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { ConsultorioActual } from '../../common/decorators/consultorio-actual.decorator.js';

/**
 * Controlador de Consultorios (ConsultoriosController).
 *
 * Aplica los principios de seguridad multi-tenant:
 * 1. `@UseGuards(JwtAuthGuard)`: Exige sesión activa y token válido.
 * 2. `@ConsultorioActual()`: Inyecta el ID del consultorio sin confiar en datos enviados por el cliente.
 * 3. `@UseGuards(TenantGuard)`: Bloquea cualquier intento de consultar o modificar datos de otro consultorio.
 */
@UseGuards(JwtAuthGuard)
@Controller('consultorios')
export class ConsultoriosController {
  constructor(private readonly consultoriosService: ConsultoriosService) {}

  /**
   * Obtiene la información del consultorio del usuario autenticado.
   * La organización se obtiene de forma 100% segura desde la firma del JWT.
   */
  @Get('mi-consultorio')
  async obtenerMiConsultorio(@ConsultorioActual() consultorioId: string) {
    return this.consultoriosService.obtenerPorId(consultorioId);
  }

  /**
   * Consulta un consultorio por su ID en la URL.
   * `TenantGuard` valida que el ID solicitado coincida con el consultorio del usuario.
   * Si intenta consultar otra clínica, NestJS rechaza con HTTP 403 Forbidden.
   */
  @UseGuards(TenantGuard)
  @Get(':id')
  async obtenerPorId(@Param('id') id: string) {
    return this.consultoriosService.obtenerPorId(id);
  }

  /**
   * Actualiza los datos del consultorio propio.
   */
  @UseGuards(TenantGuard)
  @Patch(':id')
  async actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarConsultorioDto,
  ) {
    return this.consultoriosService.actualizar(id, dto);
  }
}
