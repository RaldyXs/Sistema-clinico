import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paciente } from './entities/paciente.entity.js';
import { PacientesService } from './pacientes.service.js';
import { PacientesController } from './pacientes.controller.js';

/**
 * Módulo de Pacientes (PacientesModule).
 *
 * Encapsula la gestión de fichas clínicas, filiación, antecedentes y búsqueda de pacientes.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Paciente])],
  controllers: [PacientesController],
  providers: [PacientesService],
  exports: [PacientesService, TypeOrmModule],
})
export class PacientesModule {}
