import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportesService } from './reportes.service.js';
import { FiltrosReporteDto } from './dto/filtros-reporte.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ConsultorioActual } from '../../common/decorators/consultorio-actual.decorator.js';

/**
 * Controlador del Módulo de Reportes y Estadísticas Clínicas y Operativas.
 *
 * Expone analíticas de rendimiento asistencial, ausentismo de turnos,
 * productividad por médico y perfiles epidemiológicos CIE-10 del consultorio.
 */
@UseGuards(JwtAuthGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  /**
   * Tarea 34: Reporte operativo de turnos, ausentismo, efectividad y horas pico.
   */
  @Get('operativo')
  async obtenerReporteOperativo(
    @ConsultorioActual() consultorioId: string,
    @Query() filtros: FiltrosReporteDto,
  ) {
    return this.reportesService.obtenerReporteOperativo(consultorioId, filtros);
  }

  /**
   * Tarea 35: Reporte de productividad individual y carga de trabajo por profesional médico.
   */
  @Get('medicos')
  async obtenerReporteMedicos(
    @ConsultorioActual() consultorioId: string,
    @Query() filtros: FiltrosReporteDto,
  ) {
    return this.reportesService.obtenerReporteMedicos(consultorioId, filtros);
  }

  /**
   * Tarea 35: Reporte epidemiológico de diagnósticos CIE-10 y consultas por especialidad.
   */
  @Get('epidemiologico')
  async obtenerReporteEpidemiologico(
    @ConsultorioActual() consultorioId: string,
    @Query() filtros: FiltrosReporteDto,
  ) {
    return this.reportesService.obtenerReporteEpidemiologico(consultorioId, filtros);
  }

  /**
   * Exportación de citas del período a archivo CSV estructurado.
   */
  @Get('exportar/citas-csv')
  async exportarCitasCsv(
    @ConsultorioActual() consultorioId: string,
    @Query() filtros: FiltrosReporteDto,
    @Res() res: Response,
  ) {
    const csvContent = await this.reportesService.exportarCitasCsv(consultorioId, filtros);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="citas_reporte_${Date.now()}.csv"`);
    // Enviamos con BOM UTF-8 para que Excel lo abra correctamente sin problemas de tildes
    res.send(`\uFEFF${csvContent}`);
  }
}
