import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Receta } from './entities/receta.entity.js';

/**
 * Módulo de Recetas y Prescripciones Médicas Digitales (RecetasModule).
 *
 * Encapsula la gestión de prescripciones farmacológicas, folios por clínica,
 * ciclo de vida de la receta (EMITIDA, DISPENSADA, ANULADA) y preparación para
 * generación de documentos médicos oficiales en PDF.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Receta])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class RecetasModule {}
