import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { DocumentosService } from './documentos.service.js';
import { SubirDocumentoDto } from './dto/subir-documento.dto.js';
import { FiltrosDocumentosDto } from './dto/filtros-documentos.dto.js';
import type { ArchivoSubido } from './interfaces/archivo-subido.interface.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ConsultorioActual } from '../../common/decorators/consultorio-actual.decorator.js';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator.js';

/**
 * Controlador de Documentos y Estudios Clínicos.
 *
 * Expone las operaciones para adjuntar exámenes, imágenes y estudios
 * complementarios al paciente o consulta médica.
 */
@UseGuards(JwtAuthGuard)
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  /**
   * Sube un archivo adjunto (laboratorio, imagen, etc.) y lo asocia al paciente.
   */
  @Post('subir')
  @UseInterceptors(
    FileInterceptor('archivo', {
      limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB máximo por archivo
    }),
  )
  async subir(
    @ConsultorioActual() consultorioId: string,
    @UsuarioActual('id') profesionalId: string,
    @UploadedFile() file: ArchivoSubido,
    @Body() dto: SubirDocumentoDto,
  ) {
    return this.documentosService.subir(consultorioId, profesionalId, file, dto);
  }

  /**
   * Obtiene el listado de documentos asociados a un paciente con filtros por categoría.
   */
  @Get('paciente/:pacienteId')
  async listarPorPaciente(
    @ConsultorioActual() consultorioId: string,
    @Param('pacienteId') pacienteId: string,
    @Query() filtros: FiltrosDocumentosDto,
  ) {
    return this.documentosService.listarPorPaciente(consultorioId, pacienteId, filtros);
  }

  /**
   * Obtiene los documentos adjuntos a una consulta clínica específica.
   */
  @Get('consulta/:consultaId')
  async listarPorConsulta(
    @ConsultorioActual() consultorioId: string,
    @Param('consultaId') consultaId: string,
  ) {
    return this.documentosService.listarPorConsulta(consultorioId, consultaId);
  }

  /**
   * Descarga de forma segura el archivo adjunto conservando su nombre original.
   */
  @Get(':id/descargar')
  async descargar(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { rutaAbsoluta, documento } = await this.documentosService.descargar(
      consultorioId,
      id,
    );

    res.download(rutaAbsoluta, documento.nombreOriginal);
  }

  /**
   * Obtiene los metadatos de un documento clínico por ID.
   */
  @Get(':id')
  async obtenerPorId(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
  ) {
    return this.documentosService.obtenerPorId(consultorioId, id);
  }

  /**
   * Elimina un archivo adjunto del historial clínico.
   */
  @Delete(':id')
  async eliminar(
    @ConsultorioActual() consultorioId: string,
    @Param('id') id: string,
  ) {
    return this.documentosService.eliminar(consultorioId, id);
  }
}
