import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CajaService } from './caja.service.js';
import { AbrirCajaDto } from './dto/abrir-caja.dto.js';
import { CerrarCajaDto } from './dto/cerrar-caja.dto.js';
import { RegistrarPagoDto } from './dto/registrar-pago.dto.js';
import { AnularPagoDto } from './dto/anular-pago.dto.js';
import { FiltrosCajaDto } from './dto/filtros-caja.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { ConsultorioActual } from '../../common/decorators/consultorio-actual.decorator.js';

@UseGuards(JwtAuthGuard)
@Controller('caja')
export class CajaController {
  constructor(private readonly cajaService: CajaService) {}

  /**
   * Obtiene la sesión de caja activa del consultorio con los totales de arqueo en tiempo real.
   */
  @Get('sesion-activa')
  async obtenerSesionActiva(
    @ConsultorioActual() consultorioId: string,
    @Request() req: any,
  ) {
    return this.cajaService.obtenerSesionActiva(consultorioId, req.user?.id);
  }

  /**
   * Abre un nuevo turno de caja con fondo inicial en efectivo.
   */
  @Post('abrir')
  async abrirCaja(
    @ConsultorioActual() consultorioId: string,
    @Request() req: any,
    @Body() dto: AbrirCajaDto,
  ) {
    return this.cajaService.abrirCaja(
      consultorioId,
      req.user.id,
      dto,
      req.user,
      req.ip,
      req.headers?.['user-agent'],
    );
  }

  /**
   * Cierra el turno de caja y realiza el arqueo final.
   */
  @Post('cerrar')
  async cerrarCaja(
    @ConsultorioActual() consultorioId: string,
    @Request() req: any,
    @Body() dto: CerrarCajaDto,
  ) {
    return this.cajaService.cerrarCaja(
      consultorioId,
      req.user.id,
      dto,
      req.user,
      req.ip,
      req.headers?.['user-agent'],
    );
  }

  /**
   * Registra un pago o cobro de consulta, estudio o servicio médico.
   */
  @Post('pagos')
  async registrarPago(
    @ConsultorioActual() consultorioId: string,
    @Request() req: any,
    @Body() dto: RegistrarPagoDto,
  ) {
    return this.cajaService.registrarPago(
      consultorioId,
      req.user.id,
      dto,
      req.user,
      req.ip,
      req.headers?.['user-agent'],
    );
  }

  /**
   * Lista todos los pagos con filtros y paginación.
   */
  @Get('pagos')
  async listarPagos(
    @ConsultorioActual() consultorioId: string,
    @Query() filtros: FiltrosCajaDto,
  ) {
    return this.cajaService.listarPagos(consultorioId, filtros);
  }

  /**
   * Obtiene los datos detallados de un comprobante de pago para impresión.
   */
  @Get('pagos/:id')
  async obtenerPago(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
  ) {
    return this.cajaService.obtenerPagoPorId(consultorioId, id);
  }

  /**
   * Anula un cobro con justificación obligatoria.
   * Restringido a Administradores de la clínica o SuperAdmin por control de auditoría financiera.
   */
  @Patch('pagos/:id/anular')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  async anularPago(
    @ConsultorioActual() consultorioId: string,
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: AnularPagoDto,
  ) {
    return this.cajaService.anularPago(
      consultorioId,
      id,
      req.user.id,
      dto,
      req.user,
      req.ip,
      req.headers?.['user-agent'],
    );
  }

  /**
   * Lista el histórico de turnos y cierres de caja.
   */
  @Get('sesiones')
  async listarSesiones(
    @ConsultorioActual() consultorioId: string,
    @Query('pagina') pagina?: number,
    @Query('limite') limite?: number,
  ) {
    return this.cajaService.listarSesiones(consultorioId, pagina ? Number(pagina) : 1, limite ? Number(limite) : 10);
  }

  /**
   * Obtiene el reporte consolidado y expedientes de reclamación para ARS dominicanas.
   */
  @Get('reclamaciones-ars')
  async obtenerReporteReclamacionesArs(
    @ConsultorioActual() consultorioId: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('ars') ars?: string,
    @Query('profesionalId') profesionalId?: string,
    @Query('estado') estado?: string,
    @Query('pagina') pagina?: number,
    @Query('limite') limite?: number,
  ) {
    return this.cajaService.obtenerReporteReclamacionesArs(consultorioId, {
      desde,
      hasta,
      ars,
      profesionalId,
      estado,
      pagina: pagina ? Number(pagina) : 1,
      limite: limite ? Number(limite) : 50,
    });
  }

  /**
   * Exporta las reclamaciones de ARS a archivo CSV compatible con Excel y portales de aseguradoras.
   */
  @Get('reclamaciones-ars/exportar-csv')
  async exportarReclamacionesArsCsv(
    @ConsultorioActual() consultorioId: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('ars') ars?: string,
    @Query('profesionalId') profesionalId?: string,
    @Query('estado') estado?: string,
    @Res() res?: Response,
  ) {
    const csvContent = await this.cajaService.exportarReclamacionesArsCsv(consultorioId, {
      desde,
      hasta,
      ars,
      profesionalId,
      estado,
    });

    res?.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res?.setHeader('Content-Disposition', `attachment; filename="reclamaciones_ars_${Date.now()}.csv"`);
    res?.send(`\uFEFF${csvContent}`);
  }
}
