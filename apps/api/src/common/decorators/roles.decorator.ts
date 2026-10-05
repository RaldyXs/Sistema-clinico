import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorador para restringir el acceso a endpoints por roles de usuario (RBAC).
 * Ejemplo: `@Roles('ADMIN', 'MEDICO')`
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
