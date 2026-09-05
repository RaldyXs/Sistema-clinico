import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cita } from './entities/cita.entity.js';
import { CitasService } from './citas.service.js';
import { CitasController } from './citas.controller.js';

/**
 * Módulo de Citas (CitasModule).
 *
 * Encapsula la gestión de la agenda médica, turnos, flujo de estados clínicos
 * y control de concurrencia/solapamiento de citas en la clínica.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Cita])],
  controllers: [CitasController],
  providers: [CitasService],
  exports: [CitasService, TypeOrmModule],
})
export class CitasModule {}

