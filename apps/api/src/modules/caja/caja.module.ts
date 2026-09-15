import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CajaController } from './caja.controller.js';
import { CajaService } from './caja.service.js';
import { SesionCaja } from './entities/sesion-caja.entity.js';
import { Pago } from './entities/pago.entity.js';
import { Paciente } from '../pacientes/entities/paciente.entity.js';
import { Cita } from '../citas/entities/cita.entity.js';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import { AuditoriaModule } from '../auditoria/auditoria.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SesionCaja,
      Pago,
      Paciente,
      Cita,
      Usuario,
    ]),
    AuditoriaModule,
  ],
  controllers: [CajaController],
  providers: [CajaService],
  exports: [CajaService],
})
export class CajaModule {}
