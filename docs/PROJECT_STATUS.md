# Estado Actual del Proyecto — Sistema Clínico

> Este archivo es la fuente de verdad sobre el estado actual del desarrollo.
> Debe actualizarse al cerrar cada tarea importante antes de realizar el commit.
> Su mantenimiento corresponde al asistente unificado Antigravity en colaboración con el desarrollador responsable.

---

## Proyecto

**Nombre:** Sistema Clínico

**Repositorio:**
https://github.com/RaldyXs/Sistema-clinico

**Ubicación local:**
`C:\Proyectos\Sistema-clinico`

**Arquitectura:**
Monorepo con npm workspaces.

**Stack principal:**

- React
- TypeScript
- Vite
- Node.js
- NestJS
- PostgreSQL
- TypeORM

**Frontend visual previsto:**

- Tailwind CSS
- Shadcn UI

**Aplicación móvil futura:**

- React Native
- Expo
- TypeScript

---

# Estado del Roadmap

## Fase actual

**Fase 1 — Fundamentos**

---

## Tarea 1 — Configurar repositorio y estructura del proyecto

**Estado:** COMPLETADA

### Implementado

- Repositorio Git creado y clonado.
- Estructura inicial del monorepo.
- npm workspaces configurado.
- Directorio `apps/`.
- Directorio `packages/`.
- Directorio `infra/`.
- Directorio `docs/`.
- `.gitignore`.
- `.editorconfig`.
- `.gitattributes`.
- `.env.example`.
- `package.json` raíz.
- `package-lock.json`.
- Documentación inicial de la arquitectura.

### Commit

`chore: Inicialización de la estructura del proyecto`

### Push

Realizado correctamente al repositorio remoto.

---

## Tarea 2 — Configurar React, TypeScript y Vite

**Estado:** COMPLETADA

### Ubicación

`apps/web`

### Implementado

- React.
- React DOM.
- TypeScript.
- Vite.
- Workspace `@sistema-clinico/web`.
- Integración con npm workspaces.
- Scripts de desarrollo, build y lint.
- Limpieza del boilerplate de Vite.
- Pantalla inicial propia del Sistema Clínico.
- Validación segura del elemento `root`.
- Estilos globales base.
- Eliminación de archivos demo innecesarios.
- Documentación técnica del frontend.

### Archivos creados o modificados

- `apps/web/src/App.tsx`
- `apps/web/src/main.tsx`
- `apps/web/src/index.css`
- `apps/web/src/App.css` — eliminado
- `apps/web/src/assets/react.svg` — eliminado
- `apps/web/public/vite.svg` — eliminado
- `docs/01-Fundamentos.md`

### Dependencias principales

- React `19.2.8`
- React DOM `19.2.8`
- TypeScript `6.0.2`
- Vite `8.2.0`

### Pruebas ejecutadas

```bash
npm install
npm ls --workspaces --depth=0
npm run dev:web
npm run lint --workspace=@sistema-clinico/web
npm run build --workspace=@sistema-clinico/web
```

### Resultado

- Servidor de desarrollo: correcto.
- Validación visual: correcta.
- ESLint: correcto.
- Build: correcto.
- Build de producción generado en `apps/web/dist/`.

### Commit

`chore(web): configuracion de react y limpieza de boilerplate`

### Push

Realizado correctamente al repositorio remoto.

---

## Tarea 3 — Configurar Node.js y NestJS

**Estado:** COMPLETADA

### Ubicación

`apps/api`

### Objetivo cumplido

Crear la base del backend principal de la Plataforma de Gestión Clínica utilizando Node.js, NestJS y TypeScript.

### Implementado

- Aplicación NestJS creada dentro de `apps/api`.
- Integración de la API con el monorepo.
- Workspace renombrado a `@sistema-clinico/api`.
- Servidor NestJS ejecutándose correctamente.
- Estructura inicial de módulos de NestJS.
- Limpieza de telemetría innecesaria.
- Eliminación de `ObserveModule`.
- Documentación técnica inicial de la arquitectura de la API.

### Archivos creados o modificados

- `apps/api/package.json`
- `apps/api/src/main.ts`
- `apps/api/src/app.module.ts`
- `docs/01-Fundamentos.md`

### Dependencias instaladas o modificadas

- Dependencias principales de NestJS administradas mediante npm workspaces.
- `@nestjs/observe` eliminado del workspace `@sistema-clinico/api`.

### Pruebas ejecutadas

```bash
npm install
npm ls --workspaces --depth=0
npm run dev:api
npm run lint --workspace=@sistema-clinico/api
```

### Resultado

- Workspace de la API reconocido correctamente.
- Servidor NestJS en modo watch: correcto.
- Compilación durante el arranque: cero errores.
- ESLint: correcto, sin errores de formato.

### Commit

`chore(api): configuracion de nestjs y limpieza de telemetria`

### Push

Realizado correctamente al repositorio remoto.

---

## Tarea 4 — Configurar PostgreSQL

**Estado:** COMPLETADA

### Objetivo cumplido

Configurar PostgreSQL como base de datos principal del Sistema Clínico y establecer la conexión inicial entre NestJS y PostgreSQL.

### Estrategia seleccionada

Para el entorno de desarrollo local se decidió utilizar:

**PostgreSQL 16 instalado de forma nativa en Windows mediante EnterpriseDB.**

Se descartó utilizar Docker para PostgreSQL en el entorno local actual.

Esto simplifica el desarrollo en la máquina Windows que se está utilizando actualmente.

Esta decisión corresponde únicamente al entorno local de desarrollo y no obliga a utilizar la misma estrategia posteriormente en producción.

### Base de datos

Base de datos creada:

`sistema_clinico`

### Usuario local

Actualmente se utiliza el usuario predeterminado de PostgreSQL:

`postgres`

La conexión se realiza mediante variables de entorno.

### Arquitectura implementada

El flujo actual es:

```text
React Web
    |
    | HTTP / HTTPS
    v
NestJS API
    |
    | TypeORM
    v
PostgreSQL 16
```

React no tiene acceso directo a PostgreSQL.

Toda interacción futura con los datos deberá pasar a través de NestJS.

### Integración con NestJS

La API utiliza:

- `@nestjs/config`
- `@nestjs/typeorm`
- `typeorm`
- `pg`

`ConfigModule` se utiliza para cargar las variables de entorno.

`TypeOrmModule` se utiliza para administrar la conexión entre NestJS y PostgreSQL.

La configuración se realiza de forma asíncrona para permitir que NestJS lea las variables de entorno antes de construir la conexión.

### Variables de entorno

Se creó:

`.env`

en la raíz del proyecto.

Este archivo contiene las credenciales reales utilizadas en el entorno local.

El archivo:

`.env`

no debe almacenarse en Git.

La configuración de ejemplo continúa documentándose mediante:

`.env.example`

### Seguridad de las credenciales

La relación continúa siendo:

```text
.env.example
    |
    | documentación
    |
    +---- se almacena en Git


.env
    |
    | credenciales reales
    |
    +---- NO se almacena en Git
```

### Archivos creados o modificados

- `apps/api/src/app.module.ts`
- `.env`
- `docs/01-Fundamentos.md`

### Infraestructura eliminada

Se eliminó:

`infra/docker/docker-compose.yml`

La razón fue la decisión de utilizar PostgreSQL instalado de forma nativa en Windows para el entorno local.

### Dependencias instaladas

En el workspace:

`@sistema-clinico/api`

se instalaron:

- `@nestjs/config`
- `@nestjs/typeorm`
- `typeorm`
- `pg`

### Pruebas ejecutadas

Se verificó:

- instalación nativa de PostgreSQL 16;
- creación de la base de datos `sistema_clinico` mediante pgAdmin;
- lectura correcta del archivo `.env`;
- arranque de NestJS;
- conexión de TypeORM con PostgreSQL.

Comando utilizado:

```bash
npm run dev:api
```

### Resultado

La API arrancó correctamente sin presentar:

- errores de autenticación;
- errores de conexión;
- errores de lectura de variables de entorno.

Esto confirma que NestJS puede comunicarse correctamente con PostgreSQL.

### Commit

`feat(api): integracion nativa de postgresql con typeorm y configuracion de entorno`

### Push

El HANDOFF recibido confirma el commit realizado, pero no indicó explícitamente el estado del push.

No debe asumirse información adicional hasta recibir confirmación.

---

## Tarea 5 — Configurar Tailwind CSS y Shadcn UI

**Estado:** COMPLETADA

### Objetivo cumplido

Establecer la base visual reutilizable del frontend utilizando Tailwind CSS y Shadcn UI con arquitectura modular y agnóstica para SaaS.

### Ubicación

`apps/web`

### Implementado

- Instalación de Tailwind CSS v4 mediante `@tailwindcss/vite` y `tailwindcss`.
- Integración nativa como plugin de Vite 8 sin necesidad de `postcss.config.js` ni `tailwind.config.js`.
- Configuración de Path Aliases (`@/*`) en `tsconfig.app.json` y `vite.config.ts`.
- Configuración de Design Tokens semánticos en `apps/web/src/index.css` con variables CSS en HSL (`:root` y `.dark`).
- Implementación de la función utilitaria maestra `cn()` en `apps/web/src/lib/utils.ts` (`clsx` + `tailwind-merge`).
- Creación del componente base `Button` (`apps/web/src/components/ui/button.tsx`) utilizando `cva` y `@radix-ui/react-slot`.
- Soporte para variantes (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`), tamaños (`sm`, `default`, `lg`, `icon`) y polimorfismo (`asChild`).
- Actualización de `apps/web/src/App.tsx` para validar utilidades, tokens de tema, alternancia de modo oscuro e interacción de componentes.
- Configuración de ESLint en `apps/web/eslint.config.js` para compatibilidad con Fast Refresh y exportación de variantes.
- Documentación técnica registrada en `docs/01-Fundamentos.md`.

### Archivos creados o modificados

- `apps/web/package.json`
- `apps/web/tsconfig.app.json`
- `apps/web/vite.config.ts`
- `apps/web/eslint.config.js`
- `apps/web/src/index.css`
- `apps/web/src/App.tsx`
- `apps/web/src/lib/utils.ts`
- `apps/web/src/components/ui/button.tsx`
- `docs/01-Fundamentos.md`

### Dependencias instaladas

En `@sistema-clinico/web`:
- `clsx`
- `tailwind-merge`
- `class-variance-authority`
- `lucide-react`
- `@radix-ui/react-slot`
- `@tailwindcss/vite` (dev)
- `tailwindcss` (dev)

### Pruebas ejecutadas

- `npm run lint --workspaces`: cero errores.
- `npm run build --workspaces`: compilación completa correcta de API y Web en menos de 1 segundo.
- `npm run dev:web`: servidor de desarrollo Vite operativo en `http://localhost:5173/` con respuesta HTTP 200.
- Alternancia interactiva entre modo claro y oscuro verificada.

### Commit sugerido

`feat(web): configuracion de tailwind css v4, shadcn ui y componente button base`

---

## Tarea 6 — Implementar autenticación y sesiones

**Estado:** COMPLETADA

### Objetivo cumplido

Implementar una arquitectura de autenticación segura, sin estado (*stateless*) y multi-consultorio en NestJS utilizando JSON Web Tokens (JWT) y hashing con bcryptjs.

### Ubicación

`apps/api/src/modules/auth/` y `apps/api/src/modules/`

### Implementado

- Instalación de `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcryptjs`, `class-validator` y `class-transformer`.
- Modelado de las entidades fundamentales de persistencia en TypeORM:
  - `Consultorio` (`apps/api/src/modules/consultorios/entities/consultorio.entity.ts`) con claves primarias UUID para protección anti-enumeración.
  - `Usuario` (`apps/api/src/modules/usuarios/entities/usuario.entity.ts`) con email indexado, hash seguro de contraseñas y enum tipado `RolUsuario`.
- Creación de DTOs con validación estricta:
  - `LoginDto` (`apps/api/src/modules/auth/dto/login.dto.ts`): validación de email y longitud mínima de contraseña.
  - `RegistroDto` (`apps/api/src/modules/auth/dto/registro.dto.ts`): onboarding de nuevo consultorio y usuario administrador.
- Implementación de `AuthService` (`apps/api/src/modules/auth/auth.service.ts`):
  - Hashing seguro de contraseñas con 10 rondas de salt mediante `bcryptjs`.
  - Emisión de tokens firmados mediante `JwtService` con payload multi-tenant (`sub`, `email`, `rol`, `consultorioId`).
  - Validación de credenciales con prevención de fuga de información (mensajes homogéneos en errores 401).
- Implementación de `JwtStrategy` (`apps/api/src/modules/auth/strategies/jwt.strategy.ts`):
  - Extracción automática desde cabecera `Authorization: Bearer <token>`.
  - Validación de firma y expiración con la clave secreta `JWT_SECRET`.
  - Inyección del usuario autenticado en `req.user`.
- Creación de `JwtAuthGuard` (`apps/api/src/modules/auth/guards/jwt-auth.guard.ts`) para proteger rutas privadas.
- Endpoints en `AuthController` (`apps/api/src/modules/auth/auth.controller.ts`):
  - `POST /auth/registro` (público)
  - `POST /auth/login` (público)
  - `GET /auth/perfil` (privado, protegido por `JwtAuthGuard`)
- Configuración global de `ValidationPipe` (con `whitelist` y `forbidNonWhitelisted`) y CORS en `apps/api/src/main.ts`.
- Documentación técnica registrada en `docs/01-Fundamentos.md`.

### Archivos creados o modificados

- `apps/api/package.json`
- `apps/api/src/main.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/modules/consultorios/entities/consultorio.entity.ts` (nuevo)
- `apps/api/src/modules/usuarios/entities/usuario.entity.ts` (nuevo)
- `apps/api/src/modules/auth/auth.module.ts` (nuevo)
- `apps/api/src/modules/auth/auth.service.ts` (nuevo)
- `apps/api/src/modules/auth/auth.controller.ts` (nuevo)
- `apps/api/src/modules/auth/guards/jwt-auth.guard.ts` (nuevo)
- `apps/api/src/modules/auth/strategies/jwt.strategy.ts` (nuevo)
- `apps/api/src/modules/auth/dto/login.dto.ts` (nuevo)
- `apps/api/src/modules/auth/dto/registro.dto.ts` (nuevo)
- `.env` y `.env.example` (variables `JWT_SECRET` y `JWT_EXPIRES_IN`)
- `docs/01-Fundamentos.md`

### Pruebas ejecutadas

- `npm run lint`: cero errores en backend y frontend.
- `npm run build`: compilación de producción exitosa en menos de 1 segundo.
- Pruebas HTTP funcionales en vivo con PostgreSQL 16:
  - `POST /auth/registro`: Registro de consultorio y admin correcto con UUIDs y retorno de JWT.
  - `POST /auth/login`: Login exitoso con credenciales correctas devolviendo token JWT.
  - `POST /auth/login`: Rechazado con HTTP 401 ante contraseña incorrecta.
  - `GET /auth/perfil` sin token: Rechazado con HTTP 401 Unauthorized.
  - `GET /auth/perfil` con token: Retorna HTTP 200 y datos del usuario y consultorio autenticados.

### Commit sugerido

`feat(api): arquitectura de autenticacion jwt, hashing bcryptjs y entidades base multi-tenant`

---

## Tarea 7 — Crear entidades Consultorio, Usuario, Rol y Permiso

**Estado:** COMPLETADA

### Objetivo cumplido

Construir la arquitectura de entidades relacionales para un sistema de control de acceso basado en roles (RBAC) multi-tenant desacoplado del dominio médico, separando roles universales del núcleo SaaS de plantillas de industria.

### Ubicación

`apps/api/src/modules/roles/`, `apps/api/src/modules/usuarios/` y `apps/api/src/modules/consultorios/`

### Implementado

- Creación de la entidad `Permiso` (`apps/api/src/modules/roles/entities/permiso.entity.ts`) con IDs UUID y formato atómico `recurso:accion` agrupado por módulos.
- Creación de la entidad `Rol` (`apps/api/src/modules/roles/entities/rol.entity.ts`) con relación Muchos a Muchos (`roles_permisos`), protección de roles de sistema (`es_sistema`) y soporte multi-tenant (`consultorio_id`).
- Actualización de la entidad `Usuario` para vincularla directamente a `Rol` mediante clave foránea `rol_id` y relación `ManyToOne` con carga automática (`eager: true`).
- Actualización de `Consultorio` con relación `OneToMany` a roles personalizados.
- Creación de `RolesModule` y `RolesService` con semillero automático (`onModuleInit`):
  - Inicialización automática de 14 permisos (Core SaaS + Dominio Clínico).
  - Creación del rol universal del núcleo: `ADMIN` (con el 100% de los permisos).
  - Creación de plantillas de industria: `PROFESIONAL_SALUD` (9 permisos) y `RECEPCION` (6 permisos).
- Exposición de endpoints protegidos en `RolesController`: `GET /roles` y `GET /roles/permisos`.
- Declaración de `AuthModule` como módulo `@Global()` para acceso universal a `JwtAuthGuard` y `JwtStrategy`.
- Documentación técnica registrada en `docs/01-Fundamentos.md`.

### Archivos creados o modificados

- `apps/api/src/app.module.ts`
- `apps/api/src/modules/consultorios/entities/consultorio.entity.ts`
- `apps/api/src/modules/usuarios/entities/usuario.entity.ts`
- `apps/api/src/modules/roles/entities/permiso.entity.ts` (nuevo)
- `apps/api/src/modules/roles/entities/rol.entity.ts` (nuevo)
- `apps/api/src/modules/roles/roles.service.ts` (nuevo)
- `apps/api/src/modules/roles/roles.controller.ts` (nuevo)
- `apps/api/src/modules/roles/roles.module.ts` (nuevo)
- `apps/api/src/modules/auth/auth.module.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `docs/01-Fundamentos.md`
- `docs/PROJECT_STATUS.md`

### Pruebas ejecutadas

- `npm run lint`: cero errores en todo el monorepo.
- `npm run build`: compilación de producción exitosa de todo el monorepo en 824 ms.
- Inspección directa en PostgreSQL 18:
  - 5 tablas relacionales verificadas: `consultorios`, `usuarios`, `roles`, `roles_permisos`, `permisos`.
  - 14 permisos catalogados y 3 roles vinculados en la tabla intermedia.
- Pruebas HTTP en vivo:
  - Registro de nuevo consultorio con asignación automática de rol `ADMIN` y retorno de JWT con permisos embebidos.
  - `GET /roles` con Bearer Token: Retorna HTTP 200 y catálogo de roles con conteo de permisos.
  - `GET /roles/permisos` con Bearer Token: Retorna HTTP 200 y lista agrupada de permisos.

### Commit sugerido

`feat(api): entidades rol y permiso rbac desacopladas, semillero automatico y modulo de roles`

---

## Tarea 8 — Implementar control de acceso por consultorio

## Tarea 8 — Implementar control de acceso por consultorio

**Estado:** COMPLETADA

### Objetivo cumplido

Garantizar el aislamiento estricto multi-tenant (*Multi-Tenant Data Isolation*) mediante decoradores, guards de seguridad y entidades base abstractas, impidiendo cualquier acceso o modificación de datos entre organizaciones ajenas (*Cross-Tenant Data Leakage*).

### Ubicación

`apps/api/src/common/` y `apps/api/src/modules/consultorios/`

### Implementado

- Creación de la clase abstracta `TenantBaseEntity` (`apps/api/src/common/entities/tenant-base.entity.ts`) con columnas estándar `consultorio_id` (clave foránea con eliminación en cascada), `creado_en` y `actualizado_en` para herencia en todos los módulos de negocio futuros.
- Creación del decorador de parámetro `@ConsultorioActual()` (`apps/api/src/common/decorators/consultorio-actual.decorator.ts`) para inyectar de forma segura el ID de la organización desde la firma del JWT sin confiar en parámetros del cliente.
- Implementación de `TenantGuard` (`apps/api/src/common/guards/tenant.guard.ts`):
  - Verifica que el usuario tenga un consultorio activo.
  - Compara el parámetro solicitado (`:id` o `:consultorioId`) contra el consultorio del usuario autenticado.
  - Bloquea accesos cruzados respondiendo de inmediato con HTTP 403 Forbidden.
- Módulo `ConsultoriosModule`:
  - `ConsultoriosService`: Métodos para consulta y actualización de la organización tenant.
  - `ConsultoriosController`:
    - `GET /consultorios/mi-consultorio` (acceso propio seguro vía `@ConsultorioActual()`).
    - `GET /consultorios/:id` (protegido por `TenantGuard`).
    - `PATCH /consultorios/:id` (actualización protegida por `TenantGuard` con DTO validado).
- Registro del módulo en `AppModule`.
- Documentación técnica registrada en `docs/01-Fundamentos.md`.

### Archivos creados o modificados

- `apps/api/src/common/entities/tenant-base.entity.ts` (nuevo)
- `apps/api/src/common/decorators/consultorio-actual.decorator.ts` (nuevo)
- `apps/api/src/common/guards/tenant.guard.ts` (nuevo)
- `apps/api/src/modules/consultorios/dto/actualizar-consultorio.dto.ts` (nuevo)
- `apps/api/src/modules/consultorios/consultorios.service.ts` (nuevo)
- `apps/api/src/modules/consultorios/consultorios.controller.ts` (nuevo)
- `apps/api/src/modules/consultorios/consultorios.module.ts` (nuevo)
- `apps/api/src/app.module.ts`
- `docs/01-Fundamentos.md`
- `docs/PROJECT_STATUS.md`

### Pruebas ejecutadas

- `npm run lint`: cero errores y cero advertencias en todo el monorepo.
- `npm run build`: compilación limpia en 830 ms.
- Pruebas de seguridad multi-tenant en vivo:
  - Dr. Carlos (`Centro Médico San Rafael`) consulta `mi-consultorio`: HTTP 200 OK.
  - Dra. Elena (`Policlínico Sur`) consulta `mi-consultorio`: HTTP 200 OK.
  - Dr. Carlos intenta consultar consultorio de Dra. Elena: HTTP 403 Forbidden ("Acceso denegado: no tienes permiso para acceder o modificar los datos de otra organización").
  - Dra. Elena intenta consultar consultorio de Dr. Carlos: HTTP 403 Forbidden.
  - Dr. Carlos actualiza datos de su propio consultorio: HTTP 200 OK.
  - Dr. Carlos intenta modificar datos del consultorio de Dra. Elena: HTTP 403 Forbidden.

### Commit sugerido

`feat(api): aislamiento multi-tenant con TenantGuard, decorador ConsultorioActual y modulo consultorios`

---

# Estado general de la Fase 1

Actualmente:

```text
Fase 1 — Fundamentos (100% COMPLETADA)

Tarea 1
Configurar repositorio y estructura
COMPLETADA

        ↓

Tarea 2
Configurar React, TypeScript y Vite
COMPLETADA

        ↓

Tarea 3
Configurar Node.js y NestJS
COMPLETADA

        ↓

Tarea 4
Configurar PostgreSQL
COMPLETADA

        ↓

Tarea 5
Configurar Tailwind CSS y Shadcn UI
COMPLETADA

        ↓

Tarea 6
Autenticación y sesiones
COMPLETADA

        ↓

Tarea 7
Consultorio, Usuario, Rol y Permiso
COMPLETADA

        ↓

Tarea 8
Control de acceso por consultorio
COMPLETADA
```

---

# Fase 2 — Pacientes

## Tarea 1 (Roadmap 8) — Diseñar módulo de pacientes

**Estado:** COMPLETADA

### Objetivo cumplido

Diseñar la arquitectura técnica, modelo relacional e índices en PostgreSQL para el módulo de Pacientes, aplicando herencia de `TenantBaseEntity`, reglas de soft-delete y aislamiento multi-tenant.

### Ubicación

`apps/api/src/modules/pacientes/` y `docs/02-Pacientes.md`

### Implementado

- Creación del documento de arquitectura clínica `docs/02-Pacientes.md`.
- Creación de la entidad `Paciente` (`apps/api/src/modules/pacientes/entities/paciente.entity.ts`) con 20 campos de filiación y datos clínicos esenciales (alergias, grupo sanguíneo, antecedentes).
- Índices especializados:
  - Índice compuesto único en `[consultorio_id, documento_identidad]` para validar duplicidad únicamente dentro de la misma clínica.
  - Índice compuesto en `[consultorio_id, apellido, nombre]` para autocompletado y búsqueda instantánea.
- Creación de `PacientesModule` y registro en `AppModule`.
- Sincronización automática con PostgreSQL 18 verificada.

### Archivos creados o modificados

- `docs/02-Pacientes.md` (nuevo)
- `apps/api/src/modules/pacientes/entities/paciente.entity.ts` (nuevo)
- `apps/api/src/modules/pacientes/pacientes.module.ts` (nuevo)
- `apps/api/src/app.module.ts`
- `docs/PROJECT_STATUS.md`

### Pruebas ejecutadas

- `npm run lint`: 0 errores y 0 advertencias.
- `npm run build`: compilación limpia en 1.23s.
- Verificación directa en PostgreSQL 18: tabla `pacientes` creada con sus 20 columnas y 3 índices (PK, unicidad de documento multi-tenant y búsqueda).

### Commit sugerido

`feat(api): diseño del modulo de pacientes, entidad paciente con tenantbaseentity e indices de busqueda`

---

## Tarea 2 (Roadmap 9) — Crear registro y edición de pacientes

**Estado:** COMPLETADA

### Objetivo cumplido

Implementar los endpoints y servicios de registro y edición de pacientes con validación preventiva de DTOs, inyección segura de organización mediante `@ConsultorioActual()`, prevención de duplicación de documentos por clínica y blindaje multi-tenant.

### Ubicación

`apps/api/src/modules/pacientes/`

### Implementado

- DTOs de validación con `class-validator`:
  - `CrearPacienteDto` (`apps/api/src/modules/pacientes/dto/crear-paciente.dto.ts`): Validación de campos obligatorios, fechas (`@IsDateString`), enums (`TipoDocumento`, `Genero`, `GrupoSanguineo`) y sanitización.
  - `ActualizarPacienteDto` (`apps/api/src/modules/pacientes/dto/actualizar-paciente.dto.ts`): Soporte de actualización parcial (PATCH) y control de estado `activo`.
- `PacientesService` (`apps/api/src/modules/pacientes/pacientes.service.ts`):
  - `crear()`: Valida no duplicidad de documento dentro de la misma clínica y asigna `consultorioId`.
  - `obtenerPorId()`: Retorna la ficha validando pertenencia al consultorio.
  - `actualizar()`: Actualiza campos opcionales verificando aislamiento de organización.
- `PacientesController` (`apps/api/src/modules/pacientes/pacientes.controller.ts`):
  - `POST /pacientes`: Registro con `@ConsultorioActual()`.
  - `GET /pacientes/:id`: Consulta individual segura.
  - `PATCH /pacientes/:id`: Edición segura.
- Documentación técnica registrada en `docs/02-Pacientes.md`.

### Archivos creados o modificados

- `apps/api/src/modules/pacientes/dto/crear-paciente.dto.ts` (nuevo)
- `apps/api/src/modules/pacientes/dto/actualizar-paciente.dto.ts` (nuevo)
- `apps/api/src/modules/pacientes/pacientes.service.ts` (nuevo)
- `apps/api/src/modules/pacientes/pacientes.controller.ts` (nuevo)
- `apps/api/src/modules/pacientes/pacientes.module.ts`
- `docs/02-Pacientes.md`
- `docs/PROJECT_STATUS.md`

### Pruebas ejecutadas

- `npm run lint`: 0 errores y 0 advertencias.
- `npm run build`: compilación limpia en 889 ms.
- Pruebas HTTP funcionales en vivo con PostgreSQL 18:
  - Registro de paciente con filiación completa y alergias (HTTP 201).
  - Rechazo de documento duplicado dentro del mismo consultorio (HTTP 409 Conflict).
  - Admisión del mismo documento en otro consultorio distinto (HTTP 201).
  - Actualización de alergias y teléfono en paciente propio (HTTP 200).
  - Bloqueo de modificación cruzada entre diferentes consultorios (HTTP 404 Not Found).

### Commit sugerido

`feat(api): endpoints de creacion y edicion de pacientes con validacion dtos y proteccion multi-tenant`

---

# Arquitectura actual del proyecto

La estructura principal actualmente es:

```text
Sistema-clinico/
│
├── apps/
│   │
│   ├── web/
│   │   └── React + TypeScript + Vite
│   │
│   └── api/
│       └── Node.js + NestJS + TypeScript + TypeORM
│
├── packages/
│   └── shared/
│
├── infra/
│
├── docs/
│   ├── 01-Fundamentos.md
│   └── PROJECT_STATUS.md
│
├── .editorconfig
├── .env
├── .env.example
├── .gitattributes
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

`.env` existe localmente pero no forma parte del repositorio Git.

### Arquitectura funcional actual

```text
React Web
    |
    | HTTP / HTTPS
    v
NestJS API
    |
    | TypeORM
    v
PostgreSQL 16
```

Posteriormente se incorporará:

```text
                NestJS API
                    |
          +---------+---------+
          |                   |
          v                   v
      PostgreSQL         Object Storage
```

Y en el futuro:

```text
React Web --------+
                  |
                  v
              NestJS API
                  ^
                  |
React Native -----+
```

---

# Reglas de desarrollo

Durante todo el proyecto se deben respetar las siguientes reglas.

## Código

Cuando se modifique un archivo de código:

- entregar el archivo completo;
- evitar únicamente fragmentos o diffs;
- comentar el código cuando el lenguaje lo permita;
- explicar qué hace el código;
- explicar por qué se utiliza;
- indicar cómo probarlo.

Cuando un formato no permita comentarios, como JSON, la explicación deberá mantenerse fuera del archivo.

---

## Documentación

Las decisiones importantes deberán documentarse dentro del directorio:

`docs/`

La documentación debe explicar:

- arquitectura;
- funcionamiento;
- decisiones técnicas;
- seguridad;
- estructura de datos;
- configuración;
- procedimientos importantes.

La documentación no debe limitarse a guardar comandos.

Debe explicar cómo funciona el sistema.

---

## Seguridad

Nunca se deberán colocar directamente en el código:

- contraseñas;
- tokens;
- claves privadas;
- credenciales;
- secretos.

Las credenciales reales deberán utilizar variables de entorno.

El archivo:

`.env`

no debe almacenarse en Git.

---

## Validación de tareas

Una tarea no se considera completada simplemente porque el código haya sido escrito.

Antes de cerrar una tarea se debe:

1. Verificar que funcione.
2. Ejecutar lint.
3. Ejecutar build y/o tests correspondientes.
4. Revisar `git status`.
5. Actualizar la documentación técnica.
6. Realizar commit.
7. Realizar push.
8. Generar HANDOFF cuando corresponda.
9. Actualizar `PROJECT_STATUS.md`.
10. Actualizar Notion.

---

# Flujo de Git

Al terminar bloques importantes:

```text
Desarrollo
    |
    v
Pruebas
    |
    v
git status
    |
    v
git add
    |
    v
git commit
    |
    v
git push
```

Se utilizarán Conventional Commits cuando corresponda.

Ejemplos:

```text
chore:
feat:
fix:
docs:
refactor:
test:
```

---

# Flujo de trabajo ChatGPT + Gemini

El proyecto puede desarrollarse utilizando ChatGPT o Gemini.

Para evitar pérdida de contexto se utilizará este flujo:

```text
Gemini
   |
   | desarrolla
   v
Pruebas
   |
   v
Commit + Push
   |
   v
HANDOFF
   |
   v
ChatGPT
   |
   +---- Actualiza PROJECT_STATUS.md
   |
   +---- Actualiza Notion
```

GitHub representa el estado técnico real del código.

`PROJECT_STATUS.md` representa el estado documentado del desarrollo.

Notion representa el estado visual del Roadmap.

---

## Responsabilidad de Gemini

Gemini puede:

- desarrollar código;
- modificar archivos del proyecto;
- realizar análisis;
- proponer cambios;
- actualizar documentación técnica;
- ejecutar pruebas;
- preparar commits;
- generar HANDOFF.

Gemini no debe modificar:

`docs/PROJECT_STATUS.md`

Al finalizar una tarea deberá generar un HANDOFF indicando:

- fase actual;
- tarea completada;
- estado;
- archivos creados;
- archivos modificados;
- dependencias instaladas;
- dependencias eliminadas;
- decisiones técnicas importantes;
- pruebas ejecutadas;
- resultado de lint;
- resultado de build;
- resultado de tests;
- commit;
- push;
- siguiente tarea;
- acción requerida para ChatGPT.

---

## Responsabilidad de ChatGPT

ChatGPT será responsable de mantener sincronizados:

`docs/PROJECT_STATUS.md`

y:

Roadmap de Notion.

Cuando se reciba un HANDOFF de Gemini, ChatGPT deberá:

1. Revisar la información.
2. Actualizar el estado de la tarea completada.
3. Actualizar el Roadmap si cambió su estructura.
4. Actualizar `PROJECT_STATUS.md`.
5. Actualizar Notion.
6. Mantener el formato existente de este documento.

---

# Última actualización

**Fase actual:**

Fase 2 — Pacientes

**Última tarea completada:**

[Fase 2] Tarea 2 (Roadmap 9) — Crear registro y edición de pacientes

**Tarea actual preparada:**

[Fase 2] Tarea 3 (Roadmap 10) — Implementar búsqueda y filtros de pacientes

**Estado actual:**

PENDIENTE DE INICIO

**Siguiente objetivo:**

Implementar endpoint `GET /pacientes` con búsqueda rápida por texto, filtros por documento, estado activo y paginación para el listado médico.