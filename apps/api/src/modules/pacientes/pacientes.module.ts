import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paciente } from './entities/paciente.entity.js';

/**
 * Módulo de Pacientes (PacientesModule).
 *
 * Encapsula la gestión de fichas clínicas, filiación, antecedentes y búsqueda de pacientes.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Paciente])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class PacientesModule {}
