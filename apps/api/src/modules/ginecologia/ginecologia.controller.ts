import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { GinecologiaService } from './ginecologia.service.js';
import { GuardarHistoriaGinecologicaDto } from './dto/historia-ginecologica.dto.js';
import {
  CrearEmbarazoDto,
  FinalizarEmbarazoDto,
} from './dto/crear-embarazo.dto.js';
import { CrearControlPrenatalDto } from './dto/crear-control-prenatal.dto.js';
import { CrearEcografiaDto } from './dto/crear-ecografia.dto.js';
import { CalculadoraObstetricaDto } from './dto/calculadora-obstetrica.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ConsultorioActual } from '../../common/decorators/consultorio-actual.decorator.js';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator.js';

/**
 * Controlador del Módulo Satélite de Ginecología y Obstetricia.
 *
 * Expone las rutas clínicas para el seguimiento de la mujer, control prenatal,
 * fórmulas obstétricas y reportes ecográficos fetales.
 */
@UseGuards(JwtAuthGuard)
@Controller('ginecologia')
export class GinecologiaController {
  constructor(private readonly gynService: GinecologiaService) {}

  // ─── CALCULADORA OBSTÉTRICA CLÍNICA ────────────────────────────────────────

  /**
   * Ejecuta el cálculo de Naegele, edad gestacional hoy y cronograma obstétrico.
   */
  @Post('calculadora-obstetrica')
  async calcularObstetricia(@Body() dto: CalculadoraObstetricaDto) {
    return this.gynService.calcularParametrosObstetricos(dto);
  }

  // ─── HISTORIA GINECOLÓGICA Y GPCA ──────────────────────────────────────────

  /**
   * Obtiene la historia ginecológica y antecedentes de una paciente.
   */
  @Get('pacientes/:pacienteId/historia-ginecologica')
  async obtenerHistoria(
    @ConsultorioActual() consultorioId: string,
    @Param('pacienteId') pacienteId: string,
  ) {
    return this.gynService.obtenerHistoriaGinecologica(consultorioId, pacienteId);
  }

  /**
   * Registra o actualiza la historia ginecológica de la paciente.
   */
  @Post('pacientes/:pacienteId/historia-ginecologica')
  async guardarHistoria(
    @ConsultorioActual() consultorioId: string,
    @Param('pacienteId') pacienteId: string,
    @Body() dto: GuardarHistoriaGinecologicaDto,
  ) {
    return this.gynService.guardarHistoriaGinecologica(consultorioId, pacienteId, dto);
  }

  // ─── EXPEDIENTES DE EMBARAZO ───────────────────────────────────────────────

  /**
   * Apertura un nuevo episodio de embarazo con cálculo automático de FPP e IMC.
   */
  @Post('embarazos')
  async crearEmbarazo(
    @ConsultorioActual() consultorioId: string,
    @UsuarioActual('id') profesionalId: string,
    @Body() dto: CrearEmbarazoDto,
  ) {
    return this.gynService.crearEmbarazo(consultorioId, profesionalId, dto);
  }

  /**
   * Obtiene el embarazo actualmente activo de la paciente con edad gestacional calculada hoy.
   */
  @Get('embarazos/paciente/:pacienteId/activo')
  async obtenerEmbarazoActivo(
    @ConsultorioActual() consultorioId: string,
    @Param('pacienteId') pacienteId: string,
  ) {
    return this.gynService.obtenerEmbarazoActivo(consultorioId, pacienteId);
  }

  /**
   * Obtiene el historial de todos los embarazos de la paciente.
   */
  @Get('embarazos/paciente/:pacienteId')
  async listarEmbarazos(
    @ConsultorioActual() consultorioId: string,
    @Param('pacienteId') pacienteId: string,
  ) {
    return this.gynService.listarEmbarazosPorPaciente(consultorioId, pacienteId);
  }

  /**
   * Obtiene el detalle de un embarazo por ID.
   */
  @Get('embarazos/:id')
  async obtenerEmbarazoPorId(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
  ) {
    return this.gynService.obtenerEmbarazoPorId(consultorioId, id);
  }

  /**
   * Finaliza formalmente un embarazo indicando desenlace y actualizando paridad.
   */
  @Patch('embarazos/:id/finalizar')
  async finalizarEmbarazo(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
    @Body() dto: FinalizarEmbarazoDto,
  ) {
    return this.gynService.finalizarEmbarazo(consultorioId, id, dto);
  }

  // ─── CONTROLES PRENATALES Y CURVA DE CRECIMIENTO ───────────────────────────

  /**
   * Registra un nuevo control prenatal periódico.
   */
  @Post('embarazos/:embarazoId/controles')
  async crearControl(
    @ConsultorioActual() consultorioId: string,
    @UsuarioActual('id') profesionalId: string,
    @Param('embarazoId') embarazoId: string,
    @Body() dto: CrearControlPrenatalDto,
  ) {
    return this.gynService.crearControlPrenatal(consultorioId, profesionalId, {
      ...dto,
      embarazoId,
    });
  }

  /**
   * Obtiene la cronología de controles prenatales de un embarazo.
   */
  @Get('embarazos/:embarazoId/controles')
  async listarControles(
    @ConsultorioActual() consultorioId: string,
    @Param('embarazoId') embarazoId: string,
  ) {
    return this.gynService.listarControlesPorEmbarazo(consultorioId, embarazoId);
  }

  /**
   * Obtiene las series de datos para graficar las curvas de AU y peso materno.
   */
  @Get('embarazos/:embarazoId/curva-crecimiento')
  async obtenerCurvaCrecimiento(
    @ConsultorioActual() consultorioId: string,
    @Param('embarazoId') embarazoId: string,
  ) {
    return this.gynService.obtenerCurvaCrecimiento(consultorioId, embarazoId);
  }

  // ─── ECOGRAFÍAS Y BIOMETRÍA FETAL ──────────────────────────────────────────

  /**
   * Registra un informe ecográfico con biometría Hadlock.
   */
  @Post('ecografias')
  async crearEcografia(
    @ConsultorioActual() consultorioId: string,
    @UsuarioActual('id') profesionalId: string,
    @Body() dto: CrearEcografiaDto,
  ) {
    return this.gynService.crearEcografia(consultorioId, profesionalId, dto);
  }

  /**
   * Obtiene el listado de ecografías de una paciente.
   */
  @Get('ecografias/paciente/:pacienteId')
  async listarEcografiasPorPaciente(
    @ConsultorioActual() consultorioId: string,
    @Param('pacienteId') pacienteId: string,
  ) {
    return this.gynService.listarEcografiasPorPaciente(consultorioId, pacienteId);
  }

  /**
   * Obtiene las ecografías vinculadas a un embarazo.
   */
  @Get('ecografias/embarazo/:embarazoId')
  async listarEcografiasPorEmbarazo(
    @ConsultorioActual() consultorioId: string,
    @Param('embarazoId') embarazoId: string,
  ) {
    return this.gynService.listarEcografiasPorEmbarazo(consultorioId, embarazoId);
  }

  /**
   * Obtiene el informe ecográfico completo por ID.
   */
  @Get('ecografias/:id')
  async obtenerEcografiaPorId(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
  ) {
    return this.gynService.obtenerEcografiaPorId(consultorioId, id);
  }
}
