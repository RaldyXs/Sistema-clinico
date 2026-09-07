import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ConsultorioActual } from '../../common/decorators/consultorio-actual.decorator.js';

/**
 * Controlador del Dashboard Principal Clínico y Administrativo.
 *
 * Expone las rutas de métricas en tiempo real, muro cronológico de actividad
 * y estadísticas epidemiológicas inmediatas del tenant autenticado.
 */
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Obtiene los indicadores clave de rendimiento (KPIs) del consultorio:
   * pacientes activos, citas del día desglose por estado, consultas del mes,
   * recetas emitidas, embarazos activos y próximas citas inmediatas.
   */
  @Get('resumen')
  async obtenerResumen(@ConsultorioActual() consultorioId: string) {
    return this.dashboardService.obtenerResumen(consultorioId);
  }

  /**
   * Obtiene la cronología en tiempo real de los eventos clínicos y operativos
   * recientes del consultorio (citas creadas, consultas atendidas, recetas emitidas).
   */
  @Get('actividad')
  async obtenerActividad(@ConsultorioActual() consultorioId: string) {
    return this.dashboardService.obtenerActividadReciente(consultorioId);
  }

  /**
   * Obtiene los diagnósticos CIE-10 más frecuentes del mes actual.
   */
  @Get('top-diagnosticos')
  async obtenerTopDiagnosticos(@ConsultorioActual() consultorioId: string) {
    return this.dashboardService.obtenerTopDiagnosticos(consultorioId);
  }
}
