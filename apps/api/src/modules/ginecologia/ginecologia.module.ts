import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoriaGinecologica } from './entities/historia-ginecologica.entity.js';
import { Embarazo } from './entities/embarazo.entity.js';
import { ControlPrenatal } from './entities/control-prenatal.entity.js';
import { Ecografia } from './entities/ecografia.entity.js';
import { Paciente } from '../pacientes/entities/paciente.entity.js';
import { Consulta } from '../consultas/entities/consulta.entity.js';
import { DocumentoClinico } from '../documentos/entities/documento-clinico.entity.js';
import { GinecologiaService } from './ginecologia.service.js';
import { GinecologiaController } from './ginecologia.controller.js';

/**
 * Módulo Satélite de Ginecología y Obstetricia (GinecologiaModule).
 *
 * Módulo de especialidad médica que opera sobre los cimientos del Core
 * (Pacientes, Consultas, Usuarios) sin acoplarlos ni alterarlos.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      HistoriaGinecologica,
      Embarazo,
      ControlPrenatal,
      Ecografia,
      Paciente,
      Consulta,
      DocumentoClinico,
    ]),
  ],
  controllers: [GinecologiaController],
  providers: [GinecologiaService],
  exports: [GinecologiaService, TypeOrmModule],
})
export class GinecologiaModule {}
