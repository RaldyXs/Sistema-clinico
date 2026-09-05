import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConsultasService } from './consultas.service.js';
import { CrearConsultaDto } from './dto/crear-consulta.dto.js';
import { FiltrosSignosVitalesDto } from './dto/filtros-signos-vitales.dto.js';
import { FiltrosHistorialClinicoDto } from './dto/filtros-historial-clinico.dto.js';
import { ActualizarDiagnosticoTratamientoDto } from './dto/actualizar-diagnostico-tratamiento.dto.js';
import { AnularConsultaDto } from './dto/anular-consulta.dto.js';
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
   * Obtiene la serie temporal histórica de signos vitales y biometría de un paciente.
   *
   * Diseñado para visualización de gráficas de evolución clínica:
   * - Curva de peso y variación de IMC (con clasificación OMS).
   * - Curva de presión arterial sistólica y diastólica.
   * - Frecuencia cardíaca, temperatura y saturación de oxígeno.
   * - Resumen del último control registrado.
   */
  @Get('paciente/:pacienteId/signos-vitales')
  async obtenerSignosVitalesHistoricos(
    @ConsultorioActual() consultorioId: string,
    @Param('pacienteId') pacienteId: string,
    @Query() filtros: FiltrosSignosVitalesDto,
  ) {
    return this.consultasService.obtenerSignosVitalesHistoricos(
      consultorioId,
      pacienteId,
      filtros,
    );
  }

  /**
   * Obtiene la Historia Clínica integral y cronológica del paciente (Timeline 360°).
   *
   * Consolida:
   * - Ficha médica del paciente (demográficos, edad, alergias, grupo sanguíneo).
   * - Estadísticas del expediente (total consultas, diagnósticos recurrentes).
   * - Línea de tiempo cronológica paginada con cada acto médico detallado.
   * - Filtros por fecha, médico, código CIE-10 y estado.
   */
  @Get('paciente/:pacienteId/historial')
  async obtenerHistorialClinico(
    @ConsultorioActual() consultorioId: string,
    @Param('pacienteId') pacienteId: string,
    @Query() filtros: FiltrosHistorialClinicoDto,
  ) {
    return this.consultasService.obtenerHistorialClinico(
      consultorioId,
      pacienteId,
      filtros,
    );
  }

  /**
   * Catálogo médico internacional CIE-10 para autocompletado en tiempo real.
   * Admite búsquedas por código (ej. "I10", "K29") o texto clínico (ej. "gastritis", "hipertension").
   */
  @Get('catalogo/cie10')
  buscarCie10(
    @Query('termino') termino?: string,
    @Query('limite') limite?: string,
  ) {
    const lim = limite ? parseInt(limite, 10) : 15;
    return this.consultasService.buscarCie10(termino, lim);
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

  /**
   * Actualiza el diagnóstico, plan de tratamiento, notas o signos vitales de una consulta médica.
   * Regla médico-legal: solo se permite modificar consultas en estado BORRADOR.
   */
  @Patch(':id')
  async actualizar(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
    @Body() dto: ActualizarDiagnosticoTratamientoDto,
  ) {
    return this.consultasService.actualizar(consultorioId, id, dto);
  }

  /**
   * Completa y sella formalmente el acto médico.
   *
   * Acciones ejecutadas:
   * - Verifica que exista diagnóstico principal registrado.
   * - Cambia el estado a COMPLETADA y sella con cerradaEn.
   * - Bloquea la consulta contra futuras modificaciones.
   * - Si proviene de una cita en agenda, marca automáticamente la cita como ATENDIDA.
   */
  @Patch(':id/completar')
  async completar(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
  ) {
    return this.consultasService.completar(consultorioId, id);
  }

  /**
   * Anula una consulta médica de forma excepcional requiriendo justificación.
   */
  @Patch(':id/anular')
  async anular(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
    @Body() dto: AnularConsultaDto,
  ) {
    return this.consultasService.anular(consultorioId, id, dto);
  }
}


