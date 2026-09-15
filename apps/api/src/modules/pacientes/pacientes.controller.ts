import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PacientesService } from './pacientes.service.js';
import { CrearPacienteDto } from './dto/crear-paciente.dto.js';
import { ActualizarPacienteDto } from './dto/actualizar-paciente.dto.js';
import { FiltrosPacienteDto } from './dto/filtros-paciente.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ConsultorioActual } from '../../common/decorators/consultorio-actual.decorator.js';

/**
 * Controlador de Pacientes (PacientesController).
 *
 * Expone las operaciones CRUD para el manejo de pacientes.
 * Todos los endpoints están protegidos por `JwtAuthGuard` y aplican
 * aislamiento multi-tenant mediante `@ConsultorioActual()`.
 */
@UseGuards(JwtAuthGuard)
@Controller('pacientes')
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  /**
   * Lista los pacientes de la clínica aplicando búsqueda rápida, filtros y paginación.
   */
  @Get()
  async listar(
    @ConsultorioActual() consultorioId: string,
    @Query() filtros: FiltrosPacienteDto,
  ) {
    return this.pacientesService.listar(consultorioId, filtros);
  }

  /**
   * Registra un nuevo paciente en la clínica del usuario autenticado.
   */
  @Post()
  async crear(
    @ConsultorioActual() consultorioId: string,
    @Request() req: any,
    @Body() dto: CrearPacienteDto,
  ) {
    return this.pacientesService.crear(
      consultorioId,
      dto,
      req.user,
      req.ip,
      req.headers?.['user-agent'],
    );
  }

  /**
   * Obtiene la Ficha Médica Integral 360° del paciente con cálculos clínicos
   * en tiempo real (edad exacta, alertas de alergias, antecedentes y contactos).
   */
  @Get(':id/ficha')
  async obtenerFicha(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
  ) {
    return this.pacientesService.obtenerFichaCompleta(consultorioId, id);
  }

  /**
   * Obtiene los datos base de un paciente por su ID, validando que pertenezca a la clínica.
   */
  @Get(':id')
  async obtenerPorId(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
  ) {
    return this.pacientesService.obtenerPorId(consultorioId, id);
  }

  /**
   * Actualiza los datos de un paciente o cambia su estado (soft delete).
   */
  @Patch(':id')
  async actualizar(
    @ConsultorioActual() consultorioId: string,
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ActualizarPacienteDto,
  ) {
    return this.pacientesService.actualizar(
      consultorioId,
      id,
      dto,
      req.user,
      req.ip,
      req.headers?.['user-agent'],
    );
  }
}
