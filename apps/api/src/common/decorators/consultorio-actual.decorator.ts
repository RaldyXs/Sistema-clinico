import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Decorador `@ConsultorioActual()`.
 *
 * ¿Qué problema resuelve?
 * Evita tener que escribir en cada método del controlador:
 * `const consultorioId = req.user.consultorioId;`
 *
 * Principio de Seguridad:
 * El ID del consultorio NUNCA se toma de los parámetros que envía el usuario (como query o body).
 * Se extrae DIRECTAMENTE de la información validada por la pulsera criptográfica (JWT)
 * que Passport inyectó en `req.user`.
 *
 * Uso en un controlador:
 * ```typescript
 * @Get('pacientes')
 * listar(@ConsultorioActual() consultorioId: string) {
 *   return this.pacientesService.listarPorConsultorio(consultorioId);
 * }
 * ```
 */
export const ConsultorioActual = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.consultorioId) {
      throw new UnauthorizedException(
        'Acceso no autorizado: la sesión no contiene un consultorio asociado',
      );
    }

    return user.consultorioId;
  },
);
