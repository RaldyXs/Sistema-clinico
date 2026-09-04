import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permiso } from './entities/permiso.entity.js';
import { Rol } from './entities/rol.entity.js';
import { RolesService } from './roles.service.js';
import { RolesController } from './roles.controller.js';

/**
 * Módulo de Roles y Permisos (RolesModule).
 *
 * Encapsula la gestión de RBAC y expone RolesService para que otros
 * módulos puedan consultar permisos o asignar roles.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Permiso, Rol])],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService, TypeOrmModule],
})
export class RolesModule {}
