import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cita } from './entities/cita.entity.js';

/**
 * Módulo de Citas (CitasModule).
 *
 * Encapsula la gestión de la agenda médica, turnos, flujo de estados clínicos
 * y control de concurrencia/solapamiento de citas en la clínica.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Cita])],
  exports: [TypeOrmModule],
})
export class CitasModule {}
