import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ConsultasService } from './consultas.service.js';
import { CrearConsultaDto } from './dto/crear-consulta.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ConsultorioActual } from '../../common/decorators/consultorio-actual.decorator.js';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator.js';

/**
 * Controlador de Consultas Clínicas (ConsultasController).
 *
 * Expone los endpoints para el registro y gestión de la historia clínica digital.
 * Todos los endpoints están protegidos por `JwtAuthGuard` y aplican
 * aislamiento multi-tenant estricto mediante `@ConsultorioActual()`.
 *
 * Rutas:
 * - POST /consultas      → Registrar una nueva consulta médica (en borrador)
 * - GET  /consultas/:id  → Consultar detalle completo del acto médico
 */
@UseGuards(JwtAuthGuard)
@Controller('consultas')
export class ConsultasController {
  constructor(private readonly consultasService: ConsultasService) {}

  /**
   * Registra una nueva consulta clínica en el consultorio del usuario autenticado.
   *
   * Realiza validaciones automáticas:
   * - Paciente y médico pertenecen al mismo consultorio.
   * - Cita vinculada (si aplica) pertenece a la clínica y al paciente.
   * - Previene consultas duplicadas para una misma cita.
   * - Calcula automáticamente el IMC a partir del peso y la talla.
   */
  @Post()
  async crear(
    @ConsultorioActual() consultorioId: string,
    @UsuarioActual('id') usuarioId: string,
    @Body() dto: CrearConsultaDto,
  ) {
    return this.consultasService.crear(consultorioId, usuarioId, dto);
  }

  /**
   * Obtiene el detalle clínico completo de una consulta (anamnesis, signos vitales,
   * examen físico, diagnóstico CIE-10 y plan terapéutico), incluyendo los datos
   * del paciente y del médico tratante.
   */
  @Get(':id')
  async obtenerPorId(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
  ) {
    return this.consultasService.obtenerPorId(consultorioId, id);
  }
}
