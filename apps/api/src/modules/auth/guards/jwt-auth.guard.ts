import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard de Autenticación JWT.
 *
 * ¿Qué es un Guard en NestJS?
 * Es una clase que implementa la interfaz `CanActivate`. Actúa como un "portero"
 * que intercepta las peticiones HTTP antes de que lleguen a la lógica del controlador.
 *
 * Al extender `AuthGuard('jwt')`:
 * - Invoca automáticamente la estrategia `JwtStrategy` que creamos antes.
 * - Si el token no viene, está vencido o la firma no coincide, rechaza la petición
 *   inmediatamente con un error `HTTP 401 Unauthorized`.
 * - Si el token es válido, permite el paso y adjunta el usuario a `req.user`.
 *
 * Ejemplo de uso en cualquier endpoint privado:
 * ```ts
 * @UseGuards(JwtAuthGuard)
 * @Get('consultas')
 * listarConsultas() { ... }
 * ```
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
