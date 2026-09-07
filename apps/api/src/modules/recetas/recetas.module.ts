import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Receta } from './entities/receta.entity.js';
import { Paciente } from '../pacientes/entities/paciente.entity.js';
import { Consulta } from '../consultas/entities/consulta.entity.js';
import { Consultorio } from '../consultorios/entities/consultorio.entity.js';
import { RecetasService } from './recetas.service.js';
import { RecetasPdfService } from './services/recetas-pdf.service.js';
import { RecetasController } from './recetas.controller.js';

/**
 * Módulo de Recetas y Prescripciones Médicas Digitales (RecetasModule).
 *
 * Encapsula la gestión de prescripciones farmacológicas, folios únicos por clínica,
 * ciclo de vida de la receta (EMITIDA, DISPENSADA, ANULADA) y el motor de
 * generación de documentos médicos oficiales en PDF.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Receta, Paciente, Consulta, Consultorio]),
  ],
  controllers: [RecetasController],
  providers: [RecetasService, RecetasPdfService],
  exports: [RecetasService, RecetasPdfService, TypeOrmModule],
})
export class RecetasModule {}
