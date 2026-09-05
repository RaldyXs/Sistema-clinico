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
import { CitasService } from './citas.service.js';
import { CrearCitaDto } from './dto/crear-cita.dto.js';
import { ActualizarCitaDto } from './dto/actualizar-cita.dto.js';
import { CancelarCitaDto } from './dto/cancelar-cita.dto.js';
import { FiltrosAgendaDto } from './dto/filtros-agenda.dto.js';
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
   * Consulta la agenda de citas de la clínica.
   *
   * Admite múltiples modos de vista según los filtros enviados:
   * - Vista diaria:    ?fecha=2026-09-10
   * - Vista semanal:   ?fechaDesde=2026-09-10&fechaHasta=2026-09-16
   * - Sala de espera:  ?estado=EN_ESPERA
   * - Agenda de médico: ?profesionalId=<uuid>
   *
   * La respuesta incluye la lista de citas, metadatos de paginación
   * y un resumen de conteo por estado para el dashboard de recepción.
   */
  @Get()
  async obtenerAgenda(
    @ConsultorioActual() consultorioId: string,
    @Query() filtros: FiltrosAgendaDto,
  ) {
    return this.citasService.obtenerAgenda(consultorioId, filtros);
  }

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

  // ─── FLUJO DE ESTADOS CLÍNICOS ────────────────────────────────────────────

  /**
   * Marca la cita como CONFIRMADA.
   * Ejecutado por recepcionista cuando el paciente confirma su asistencia.
   * Solo válido desde estado PROGRAMADA.
   */
  @Patch(':id/confirmar')
  async confirmar(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
  ) {
    return this.citasService.confirmar(consultorioId, id);
  }

  /**
   * Registra la llegada del paciente a la clínica (sala de espera).
   * Ejecutado por recepcionista cuando el paciente se presenta físicamente.
   * Válido desde estado PROGRAMADA o CONFIRMADA.
   */
  @Patch(':id/registrar-llegada')
  async registrarLlegada(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
  ) {
    return this.citasService.registrarLlegada(consultorioId, id);
  }

  /**
   * Inicia la consulta médica — el médico llama al paciente de la sala.
   * Solo válido desde estado EN_ESPERA.
   */
  @Patch(':id/iniciar-consulta')
  async iniciarConsulta(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
  ) {
    return this.citasService.iniciarConsulta(consultorioId, id);
  }

  /**
   * Finaliza la consulta médica satisfactoriamente.
   * Marca la cita como ATENDIDA. Solo válido desde EN_CONSULTA.
   * En Fase 4, este evento disparará la creación del registro de Historia Clínica.
   */
  @Patch(':id/finalizar')
  async finalizar(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
  ) {
    return this.citasService.finalizar(consultorioId, id);
  }

  /**
   * Cancela la cita con un motivo obligatorio.
   * Válido desde PROGRAMADA, CONFIRMADA, EN_ESPERA o EN_CONSULTA.
   * El horario queda liberado en la agenda del profesional.
   */
  @Patch(':id/cancelar')
  async cancelar(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
    @Body() dto: CancelarCitaDto,
  ) {
    return this.citasService.cancelar(consultorioId, id, dto);
  }

  /**
   * Registra que el paciente no asistió a su turno.
   * Solo válido desde PROGRAMADA o CONFIRMADA.
   */
  @Patch(':id/no-asistio')
  async noAsistio(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
  ) {
    return this.citasService.registrarNoAsistio(consultorioId, id);
  }
}
