import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Guard de Aislamiento Multi-Tenant (TenantGuard).
 *
 * ¿Qué función cumple este portero de seguridad?
 * Intercepta las solicitudes HTTP dirigidas a recursos identificados por ID de consultorio
 * y verifica que el consultorio solicitado coincida exactamente con el consultorio del usuario autenticado.
 *
 * Si el Dr. Carlos (Consultorio A) intenta consultar:
 * `GET /consultorios/<UUID-del-Consultorio-B>`
 * este Guard lo detecta y rechaza la petición con HTTP 403 Forbidden antes de que toque la base de datos.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 1. Verificamos que el usuario esté autenticado y tenga consultorio
    if (!user || !user.consultorioId) {
      throw new UnauthorizedException(
        'Acceso no autorizado: se requiere sesión activa con consultorio asignado',
      );
    }

    // 2. Buscamos si la URL contiene un parámetro de consultorio (:id o :consultorioId)
    const paramConsultorioId = request.params?.consultorioId ?? request.params?.id;

    // 3. Si la ruta incluye un ID de consultorio, validamos que sea el suyo
    if (paramConsultorioId && paramConsultorioId !== user.consultorioId) {
      throw new ForbiddenException(
        'Acceso denegado: no tienes permiso para acceder o modificar los datos de otra organización',
      );
    }

    return true;
  }
}
