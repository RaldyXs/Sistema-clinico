import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Guard de Aislamiento Multi-Tenant (TenantGuard).
 *
 * Principio de Seguridad: "Ceguera de Tenant" (Blind Isolation / Zero Information Disclosure).
 *
 * Si un usuario curioso o atacante intenta acceder a un consultorio ajeno (ej. GET /consultorios/<id-ajeno>),
 * el sistema responde con HTTP 404 "Consultorio no encontrado" en lugar de HTTP 403 "Acceso denegado a otra organización".
 *
 * ¿Por qué?
 * Porque un HTTP 403 le confirma al atacante que ese consultorio SÍ existe.
 * Al responder HTTP 404 idéntico a si el ID no existiera, se previene por completo
 * la enumeración de organizaciones y el usuario nunca sabrá si existen otros consultorios en el sistema.
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

    // 3. Si la ruta incluye un ID que no es el suyo, fingimos que no existe (404)
    if (paramConsultorioId && paramConsultorioId !== user.consultorioId) {
      throw new NotFoundException('Consultorio no encontrado');
    }

    return true;
  }
}

