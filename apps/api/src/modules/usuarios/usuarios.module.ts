import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';
import { Usuario } from './entities/usuario.entity.js';
import { Rol } from '../roles/entities/rol.entity.js';
import { Suscripcion } from '../saas/entities/suscripcion.entity.js';
import { SesionUsuario } from '../auth/entities/sesion-usuario.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Rol, Suscripcion, SesionUsuario])],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
