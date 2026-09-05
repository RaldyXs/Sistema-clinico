import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CitasService } from './citas.service.js';
import { CrearCitaDto } from './dto/crear-cita.dto.js';
import { ActualizarCitaDto } from './dto/actualizar-cita.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ConsultorioActual } from '../../common/decorators/consultorio-actual.decorator.js';

/**
 * Controlador de Citas (CitasController).
 *
 * Expone los endpoints de gestión de agenda médica.
 * Todos los endpoints están protegidos por `JwtAuthGuard` y aplican
 * aislamiento multi-tenant estricto mediante `@ConsultorioActual()`.
 *
 * Rutas disponibles:
 * - POST   /citas           → Agendar nueva cita
 * - GET    /citas/:id       → Consultar detalle de una cita
 * - PATCH  /citas/:id       → Reprogramar o actualizar una cita
 */
@UseGuards(JwtAuthGuard)
@Controller('citas')
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  /**
   * Agenda una nueva cita médica en el consultorio del usuario autenticado.
   *
   * El sistema valida automáticamente:
   * - Que el paciente y el médico pertenezcan a este consultorio.
   * - Que el médico no tenga otra cita activa en ese horario (anti-solapamiento).
   * - Que la fecha no sea en el pasado.
   */
  @Post()
  async crear(
    @ConsultorioActual() consultorioId: string,
    @Body() dto: CrearCitaDto,
  ) {
    return this.citasService.crear(consultorioId, dto);
  }

  /**
   * Obtiene el detalle completo de una cita, incluyendo datos del paciente y del médico.
   * Retorna 404 si la cita no existe o pertenece a otro consultorio.
   */
  @Get(':id')
  async obtenerPorId(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
  ) {
    return this.citasService.obtenerPorId(consultorioId, id);
  }

  /**
   * Reprograma o actualiza los datos de una cita existente.
   *
   * Solo se pueden modificar citas en estado PROGRAMADA o CONFIRMADA.
   * Al cambiar el horario, el sistema vuelve a ejecutar la validación de solapamiento.
   */
  @Patch(':id')
  async actualizar(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
    @Body() dto: ActualizarCitaDto,
  ) {
    return this.citasService.actualizar(consultorioId, id, dto);
  }
}
