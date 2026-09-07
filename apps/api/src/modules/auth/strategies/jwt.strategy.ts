import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';
import { SesionUsuario } from '../entities/sesion-usuario.entity.js';

/**
 * Interfaz que define la estructura interna del Token JWT (Payload).
 */
export interface JwtPayload {
  sub: string;
  email: string;
  rol: string;
  consultorioId: string;
  sessionId?: string;
  temp2fa?: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(SesionUsuario)
    private readonly sesionRepo: Repository<SesionUsuario>,
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
  async validate(payload: JwtPayload): Promise<Usuario & { sessionId?: string }> {
    // Si es un token temporal de 2FA, no puede acceder a endpoints generales
    if (payload.temp2fa) {
      throw new UnauthorizedException('Token temporal de verificación 2FA');
    }

    const usuario = await this.usuarioRepo.findOne({
      where: { id: payload.sub, activo: true },
      relations: {
        consultorio: true,
        rol: {
          permisos: true,
        },
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('El token no es válido o el usuario ha sido desactivado');
    }

    if (usuario.consultorio && !usuario.consultorio.activo) {
      throw new UnauthorizedException('El consultorio asociado se encuentra suspendido');
    }

    // Si el token cuenta con sessionId, verificamos que la sesión no haya sido revocada
    if (payload.sessionId) {
      const sesion = await this.sesionRepo.findOne({
        where: { id: payload.sessionId, activa: true },
      });

      if (!sesion) {
        throw new UnauthorizedException('La sesión ha sido cerrada o revocada remotamente');
      }

      // Actualizamos el timestamp del último acceso de manera asíncrona
      this.sesionRepo.update(sesion.id, { ultimoAcceso: new Date() }).catch(() => {});
    }

    return Object.assign(usuario, { sessionId: payload.sessionId });
  }
}

