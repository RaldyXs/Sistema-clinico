import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';
import { Usuario } from './entities/usuario.entity.js';
import { Rol } from '../roles/entities/rol.entity.js';
import { Suscripcion } from '../saas/entities/suscripcion.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Rol, Suscripcion])],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
