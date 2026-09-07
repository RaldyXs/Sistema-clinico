import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Plan } from './entities/plan.entity.js';
import { Suscripcion } from './entities/suscripcion.entity.js';
import { Consultorio } from '../consultorios/entities/consultorio.entity.js';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import { Rol } from '../roles/entities/rol.entity.js';
import { Paciente } from '../pacientes/entities/paciente.entity.js';
import { Consulta } from '../consultas/entities/consulta.entity.js';
import { SaasService } from './saas.service.js';
import { SaasController } from './saas.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Plan,
      Suscripcion,
      Consultorio,
      Usuario,
      Rol,
      Paciente,
      Consulta,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h') as any,
        },
      }),
    }),
  ],
  controllers: [SaasController],
  providers: [SaasService],
  exports: [SaasService],
})
export class SaasModule {}
