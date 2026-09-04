import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

/**
 * Interfaz que define la estructura interna del Token JWT (Payload).
 *
 * En el estándar JWT:
 * - `sub` (Subject): Identificador único del usuario (UUID).
 * - `email`: Correo del usuario.
 * - `rol`: Rol del usuario (ADMIN, MEDICO, RECEPCION).
 * - `consultorioId`: Contexto del tenant / clínica a la que pertenece.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  rol: string;
  consultorioId: string;
}

/**
 * Estrategia de Autenticación JWT (Passport Strategy).
 *
 * ¿Cómo funciona esta pieza en NestJS?
 * 1. `ExtractJwt.fromAuthHeaderAsBearerToken()`: Extrae automáticamente el token
 *    de la cabecera HTTP: `Authorization: Bearer <token>`.
 * 2. Valida criptográficamente la firma con la clave secreta `JWT_SECRET`.
 * 3. Comprueba que el token no haya expirado (`ignoreExpiration: false`).
 * 4. Ejecuta el método `validate(payload)`: Busca al usuario en PostgreSQL
 *    y lo inyecta automáticamente en `req.user` para que los controladores
 *    puedan saber qué médico o admin está haciendo la petición.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET no está configurado en las variables de entorno');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Método de validación ejecutado automáticamente tras verificar la firma del token.
   */
  async validate(payload: JwtPayload): Promise<Usuario> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: payload.sub, activo: true },
      relations: { consultorio: true },
    });

    if (!usuario) {
      throw new UnauthorizedException('El token no es válido o el usuario ha sido desactivado');
    }

    return usuario;
  }
}
