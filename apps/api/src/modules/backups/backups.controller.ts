import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  Response,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ConsultorioActual } from '../../common/decorators/consultorio-actual.decorator.js';
import { BackupsService } from './backups.service.js';

@Controller('backups')
@UseGuards(JwtAuthGuard)
export class BackupsController {
  constructor(private readonly backupsService: BackupsService) {}

  /**
   * Helper de seguridad RBAC: solo el Administrador de la clínica o SuperAdmin
   * pueden generar, listar o descargar copias de seguridad de historias clínicas.
   */
  private verificarAdmin(req: any) {
    const rol = req.user?.rol?.codigo || req.user?.rolCodigo;
    if (rol !== 'ADMIN' && rol !== 'SUPERADMIN') {
      throw new ForbiddenException(
        'Acceso restringido: Solo el Administrador de la clínica o SuperAdmin pueden gestionar copias de seguridad.',
      );
    }
  }

  /**
   * Genera un nuevo respaldo lógico completo e independiente del consultorio.
   */
  @Post('generar')
  @HttpCode(HttpStatus.CREATED)
  async generarBackup(
    @ConsultorioActual() consultorioId: string,
    @Request() req: any,
  ) {
    this.verificarAdmin(req);
    const ip = req.ip || req.connection?.remoteAddress;
    const ua = req.headers['user-agent'];
    return this.backupsService.generarBackup(consultorioId, req.user.id, ip, ua);
  }

  /**
   * Lista los respaldos históricos generados para la clínica.
   */
  @Get()
  async listarBackups(
    @ConsultorioActual() consultorioId: string,
    @Request() req: any,
  ) {
    this.verificarAdmin(req);
    return this.backupsService.listarBackups(consultorioId);
  }

  /**
   * Verifica la integridad SHA-256 de una copia de seguridad específica.
   */
  @Get(':id/verificar')
  async verificarIntegridad(
    @ConsultorioActual() consultorioId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    this.verificarAdmin(req);
    return this.backupsService.verificarIntegridad(consultorioId, id);
  }

  /**
   * Descarga el archivo JSON de la copia de seguridad.
   */
  @Get(':id/descargar')
  async descargarBackup(
    @ConsultorioActual() consultorioId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Response() res: ExpressResponse,
  ) {
    this.verificarAdmin(req);
    const ip = req.ip || req.connection?.remoteAddress;
    const ua = req.headers['user-agent'];
    const info = await this.backupsService.obtenerRutaDescarga(consultorioId, id, req.user.id, ip, ua);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${info.nombreArchivo}"`);
    return res.download(info.rutaArchivo, info.nombreArchivo);
  }
}
