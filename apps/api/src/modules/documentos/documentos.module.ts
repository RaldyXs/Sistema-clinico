import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentoClinico } from './entities/documento-clinico.entity.js';
import { Paciente } from '../pacientes/entities/paciente.entity.js';
import { Consulta } from '../consultas/entities/consulta.entity.js';
import { DocumentosService } from './documentos.service.js';
import { AlmacenamientoService } from './services/almacenamiento.service.js';
import { DocumentosController } from './documentos.controller.js';

/**
 * Módulo de Documentos y Archivos Clínicos (DocumentosModule).
 *
 * Encapsula el almacenamiento de archivos (estudios de laboratorio, ecografías,
 * imágenes diagnósticas, informes y consentimientos) con particionamiento por clínica.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentoClinico, Paciente, Consulta]),
  ],
  controllers: [DocumentosController],
  providers: [DocumentosService, AlmacenamientoService],
  exports: [DocumentosService, AlmacenamientoService, TypeOrmModule],
})
export class DocumentosModule {}
