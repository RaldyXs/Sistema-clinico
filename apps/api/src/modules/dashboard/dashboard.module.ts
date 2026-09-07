import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';
import { Paciente } from '../pacientes/entities/paciente.entity.js';
import { Cita } from '../citas/entities/cita.entity.js';
import { Consulta } from '../consultas/entities/consulta.entity.js';
import { Receta } from '../recetas/entities/receta.entity.js';
import { Embarazo } from '../ginecologia/entities/embarazo.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Paciente,
      Cita,
      Consulta,
      Receta,
      Embarazo,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
