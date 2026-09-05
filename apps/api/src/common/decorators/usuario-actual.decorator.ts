import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Usuario } from '../../modules/usuarios/entities/usuario.entity.js';

/**
 * Decorador `@UsuarioActual()`.
 *
 * Permite extraer de manera tipada y segura el usuario autenticado (inyectado por JwtStrategy)
 * o una de sus propiedades específicas (ej. `@UsuarioActual('id') id: string`).
 *
 * Ejemplo de uso:
 * ```typescript
 * @Post()
 * crear(
 *   @ConsultorioActual() consultorioId: string,
 *   @UsuarioActual('id') usuarioId: string,
 *   @Body() dto: CrearConsultaDto,
 * ) { ... }
 * ```
 */
export const UsuarioActual = createParamDecorator(
  (propiedad: keyof Usuario | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Acceso no autorizado: sesión sin usuario válido');
    }

    return propiedad ? user[propiedad] : user;
  },
);
