import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consulta } from './entities/consulta.entity.js';
import { ConsultasService } from './consultas.service.js';
import { ConsultasController } from './consultas.controller.js';

/**
 * Módulo de Consultas Clínicas (ConsultasModule).
 *
 * Encapsula la gestión de la historia clínica digital, consultas asistenciales,
 * registro de signos vitales, diagnósticos CIE-10 y planes terapéuticos.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Consulta])],
  controllers: [ConsultasController],
  providers: [ConsultasService],
  exports: [ConsultasService, TypeOrmModule],
})
export class ConsultasModule {}

