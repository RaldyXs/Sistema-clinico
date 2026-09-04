import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import { Consultorio } from '../consultorios/entities/consultorio.entity.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

/**
 * Módulo de Autenticación (AuthModule).
 *
 * En la arquitectura modular de NestJS, un módulo agrupa:
 * - `imports`: Módulos externos necesarios (TypeOrm para los repositorios,
 *   Passport para estrategias, JwtModule para emitir tokens con clave asíncrona de .env).
 * - `controllers`: AuthController (endpoints HTTP).
 * - `providers`: AuthService (lógica de negocio) y JwtStrategy (validación de tokens).
 * - `exports`: Permite que otros módulos (como Pacientes, Citas, Consultas)
 *   puedan importar AuthModule y usar `JwtAuthGuard` para proteger sus propias rutas.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Consultorio]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
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
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
