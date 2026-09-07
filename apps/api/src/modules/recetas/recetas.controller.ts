import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { RecetasService } from './recetas.service.js';
import { CrearRecetaDto } from './dto/crear-receta.dto.js';
import { FiltrosRecetasDto } from './dto/filtros-recetas.dto.js';
import { AnularRecetaDto } from './dto/anular-receta.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ConsultorioActual } from '../../common/decorators/consultorio-actual.decorator.js';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator.js';

/**
 * Controlador del Módulo de Recetas y Prescripciones Médicas Digitales.
 *
 * Expone las rutas de emisión, consulta, anulación y descarga en PDF.
 * Todo acceso está blindado con `JwtAuthGuard` y el decorador `@ConsultorioActual()`
 * para garantizar aislamiento multi-tenant sin fugas de metadatos.
 */
@UseGuards(JwtAuthGuard)
@Controller('recetas')
export class RecetasController {
  constructor(private readonly recetasService: RecetasService) {}

  /**
   * Emite una nueva receta médica con numeración correlativa garantizada por clínica.
   */
  @Post()
  async crear(
    @ConsultorioActual() consultorioId: string,
    @UsuarioActual('id') profesionalId: string,
    @Body() dto: CrearRecetaDto,
  ) {
    return this.recetasService.crear(consultorioId, profesionalId, dto);
  }

  /**
   * Obtiene el listado paginado de recetas del consultorio con filtros opcionales.
   */
  @Get()
  async listar(
    @ConsultorioActual() consultorioId: string,
    @Query() filtros: FiltrosRecetasDto,
  ) {
    return this.recetasService.listar(consultorioId, filtros);
  }

  /**
   * Descarga o visualiza en el navegador el PDF oficial de la receta médica.
   */
  @Get(':id/pdf')
  async generarPdf(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { buffer, receta } = await this.recetasService.generarPdf(consultorioId, id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="receta-${receta.numeroReceta}.pdf"`,
      'Content-Length': buffer.length.toString(),
    });

    res.end(buffer);
  }

  /**
   * Obtiene el detalle completo de una receta médica por su ID.
   */
  @Get(':id')
  async obtenerPorId(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
  ) {
    return this.recetasService.obtenerPorId(consultorioId, id);
  }

  /**
   * Invalida formalmente una receta médica especificando el motivo médico o administrativo.
   */
  @Patch(':id/anular')
  async anular(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
    @Body() dto: AnularRecetaDto,
  ) {
    return this.recetasService.anular(consultorioId, id, dto);
  }
}
