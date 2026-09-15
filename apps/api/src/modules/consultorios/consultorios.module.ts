import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultorio } from './entities/consultorio.entity.js';
import { ConsultoriosService } from './consultorios.service.js';
import { ConsultoriosController } from './consultorios.controller.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { AuditoriaModule } from '../auditoria/auditoria.module.js';

/**
 * Módulo de Consultorios (ConsultoriosModule).
 *
 * Encapsula la administración de la organización (tenant).
 */
@Module({
  imports: [TypeOrmModule.forFeature([Consultorio]), AuditoriaModule],
  controllers: [ConsultoriosController],
  providers: [ConsultoriosService, TenantGuard],
  exports: [ConsultoriosService, TypeOrmModule],
})
export class ConsultoriosModule {}
