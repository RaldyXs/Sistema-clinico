import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller.js';
import { ReportesService } from './reportes.service.js';
import { Cita } from '../citas/entities/cita.entity.js';
import { Consulta } from '../consultas/entities/consulta.entity.js';
import { Paciente } from '../pacientes/entities/paciente.entity.js';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import { Receta } from '../recetas/entities/receta.entity.js';
import { ControlPrenatal } from '../ginecologia/entities/control-prenatal.entity.js';
import { Ecografia } from '../ginecologia/entities/ecografia.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cita,
      Consulta,
      Paciente,
      Usuario,
      Receta,
      ControlPrenatal,
      Ecografia,
    ]),
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}
