import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

/**
 * Guard de Autorización Basada en Roles (RolesGuard).
 *
 * Evalúa los roles configurados mediante `@Roles(...)` en el controlador o método.
 * Si el usuario autenticado no cuenta con el rol requerido, bloquea la petición con HTTP 403 Forbidden.
 * El rol `SUPERADMIN` cuenta con bypass administrativo automático.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si el endpoint no requiere roles específicos, permite el paso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Acceso no autorizado: No se ha encontrado el usuario.');
    }

    const userRole = user.rolCodigo ?? user.rol?.codigo;
    if (!userRole) {
      throw new ForbiddenException('Acceso no autorizado: El usuario no tiene un rol asignado.');
    }

    // SuperAdmin tiene acceso global irrestricto
    if (userRole === 'SUPERADMIN') {
      return true;
    }

    const hasRole = requiredRoles.includes(userRole);
    if (!hasRole) {
      throw new ForbiddenException(
        `Acceso restringido: Se requiere uno de los siguientes roles: [${requiredRoles.join(', ')}]. Tu rol actual es "${userRole}".`,
      );
    }

    return true;
  }
}
