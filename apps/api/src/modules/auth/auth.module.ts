import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import { Consultorio } from '../consultorios/entities/consultorio.entity.js';
import { Rol } from '../roles/entities/rol.entity.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

/**
 * Módulo de Autenticación Global (AuthModule).
 *
 * Al marcarse con `@Global()`:
 * Todos los demás módulos (Roles, Pacientes, Citas, Consultas) pueden utilizar
 * `@UseGuards(JwtAuthGuard)` y acceder a la estrategia JWT sin tener que re-importar
 * Passport en cada módulo individual.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Consultorio, Rol]),
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
  exports: [AuthService, JwtModule, PassportModule, JwtStrategy],
})
export class AuthModule {}
