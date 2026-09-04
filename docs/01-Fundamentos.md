# Fase 1 — Fundamentos del Sistema

## 1. Objetivo

Esta fase establece la base técnica de la Plataforma de Gestión Clínica.

El objetivo es preparar una arquitectura organizada, escalable y mantenible que
permita desarrollar inicialmente una aplicación web y posteriormente incorporar
una aplicación móvil utilizando el mismo backend.

---

## 2. Arquitectura general

El proyecto utiliza una arquitectura monorepo.

Un monorepo permite mantener varias aplicaciones y paquetes relacionados dentro
del mismo repositorio Git.

La estructura principal es:

Sistema-clinico/
│
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   └── shared/
│
├── infra/
│   └── docker/
│
├── docs/
│
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
├── .editorconfig
├── .gitattributes
└── README.md

---

## 3. Directorio apps

Contiene las aplicaciones ejecutables del sistema.

### apps/web

Contendrá la aplicación web utilizada por médicos, secretarias y
administradores.

Tecnologías previstas:

- React
- TypeScript
- Vite

La aplicación web no accederá directamente a PostgreSQL.

Toda comunicación con los datos se realizará mediante la API.

### apps/api

Contendrá el backend principal del sistema.

Tecnologías previstas:

- Node.js
- NestJS
- TypeScript

Será responsable de:

- autenticación;
- autorización;
- reglas de negocio;
- pacientes;
- consultas;
- citas;
- recetas;
- documentos;
- seguridad;
- auditoría;
- acceso a PostgreSQL.

En el futuro también será utilizado por la aplicación móvil.

---

## 4. Directorio packages

Contiene código que puede ser compartido entre diferentes aplicaciones.

### packages/shared

Podrá contener en el futuro:

- tipos TypeScript;
- constantes;
- validaciones;
- estructuras compartidas;
- utilidades.

Esto permitirá evitar duplicar código entre la aplicación web y otras
aplicaciones.

---

## 5. Directorio infra

Contiene la configuración relacionada con la infraestructura del sistema.

### infra/docker

Será utilizado inicialmente para ejecutar servicios de desarrollo mediante
Docker.

Por ejemplo:

- PostgreSQL;
- herramientas auxiliares;
- servicios necesarios durante el desarrollo.

La infraestructura queda separada del código de las aplicaciones.

---

## 6. Directorio docs

Contiene la documentación técnica del sistema.

Se utilizará para documentar:

- arquitectura;
- decisiones técnicas;
- estructura de la base de datos;
- autenticación;
- seguridad;
- API;
- módulos clínicos;
- procedimientos de instalación;
- procedimientos de despliegue.

La documentación deberá actualizarse a medida que evolucione el proyecto.

---

## 7. package.json

El archivo package.json ubicado en la raíz configura el monorepo.

La propiedad:

"private": true

impide que el proyecto raíz pueda publicarse accidentalmente como un paquete
público de npm.

La propiedad:

"workspaces": [
  "apps/*",
  "packages/*"
]

le indica a npm que las aplicaciones y paquetes ubicados dentro de esas rutas
forman parte del mismo workspace.

Esto permitirá instalar y administrar las dependencias desde la raíz del
proyecto.

---

## 8. Scripts principales

El package.json raíz define comandos que posteriormente permitirán ejecutar
acciones sobre las diferentes aplicaciones.

### dev:web

Ejecutará la aplicación web React en modo desarrollo.

### dev:api

Ejecutará el backend NestJS en modo desarrollo.

### build

Construirá las aplicaciones que tengan disponible un script de compilación.

### lint

Ejecutará las herramientas de análisis estático del código.

### test

Ejecutará las pruebas automatizadas disponibles.

Estos scripts comenzarán a funcionar conforme creemos las aplicaciones web y
API.

---

## 9. package-lock.json

package-lock.json es generado automáticamente por npm.

Registra las versiones exactas de las dependencias instaladas.

Esto permite que diferentes desarrolladores y servidores instalen exactamente
las mismas versiones del proyecto.

Este archivo debe mantenerse dentro del repositorio Git.

---

## 10. .env.example

.env.example documenta las variables de entorno necesarias para ejecutar el
sistema.

No debe contener contraseñas reales.

Ejemplos:

DATABASE_URL
POSTGRES_USER
POSTGRES_PASSWORD
API_PORT

Cada ambiente podrá tener su propio archivo .env.

Por seguridad:

.env.example -> se guarda en Git.

.env -> nunca debe guardarse en Git.

---

## 11. .gitignore

.gitignore indica a Git qué archivos o directorios no deben almacenarse en el
repositorio.

Entre ellos:

- node_modules;
- archivos .env;
- compilaciones;
- logs;
- archivos temporales;
- archivos generados por herramientas.

Esto evita subir archivos innecesarios o información sensible.

---

## 12. .editorconfig

.editorconfig establece reglas comunes de formato entre diferentes editores.

Actualmente define:

- UTF-8;
- espacios en lugar de tabulaciones;
- indentación de 2 espacios;
- eliminación de espacios innecesarios;
- salto de línea final.

Esto ayuda a mantener un código consistente entre diferentes desarrolladores y
sistemas operativos.

---

## 13. .gitattributes

.gitattributes controla cómo Git maneja determinados archivos.

La configuración actual normaliza los finales de línea a LF para el código del
proyecto.

Esto ayuda a evitar conflictos cuando se trabaja entre:

- Windows;
- Linux;
- servidores;
- contenedores Docker.

Los archivos .bat y .cmd mantienen CRLF debido a que son formatos propios de
Windows.

---

## 14. Variables de entorno iniciales

Las variables actuales son únicamente valores de desarrollo.

Nunca se utilizarán credenciales reales directamente dentro del código fuente.

En futuras fases se definirán mecanismos seguros para administrar:

- credenciales;
- claves privadas;
- tokens;
- conexiones a bases de datos;
- secretos de producción.

---

## 15. Arquitectura prevista

La comunicación general del sistema será:

React Web
    |
    | HTTPS
    v
NestJS API
    |
    +------ PostgreSQL
    |
    +------ Object Storage
    |
    +------ Servicios externos

En una fase posterior:

React Native
    |
    | HTTPS
    v
NestJS API

La aplicación móvil utilizará el mismo backend que la aplicación web.

---

## 16. Estado actual

En este punto se ha completado:

- creación del repositorio Git;
- clonación local;
- estructura inicial del monorepo;
- configuración de npm workspaces;
- archivos básicos de configuración;
- variables de entorno de ejemplo;
- configuración inicial de Git;
- configuración inicial de formato;
- documentación inicial de arquitectura.

El siguiente paso será configurar la aplicación web con React, TypeScript y
Vite.

---

# 17. Configuración del Frontend Web

## 17.1 Tecnologías

La aplicación web utiliza:

- React;
- TypeScript;
- Vite.

El proyecto se encuentra en:

apps/web/

---

## 17.2 React

React se utiliza para construir la interfaz del sistema mediante componentes.

Cada componente representa una parte de la interfaz.

Ejemplos futuros:

- Login;
- Dashboard;
- Pacientes;
- Citas;
- Consultas;
- Recetas.

La aplicación comienza en el componente:

src/App.tsx

---

## 17.3 TypeScript

TypeScript agrega un sistema de tipos sobre JavaScript.

Permite detectar numerosos errores durante el desarrollo antes de ejecutar
el código.

Será especialmente útil para representar estructuras como:

- pacientes;
- médicos;
- consultas;
- citas;
- recetas;
- respuestas de la API.

Ejemplo conceptual:

interface Patient {
  id: string
  name: string
  birthDate: string
}

De esta forma TypeScript puede verificar que los datos utilizados por la
aplicación tengan la estructura esperada.

---

## 17.4 Vite

Vite es la herramienta utilizada para ejecutar y compilar la aplicación web.

Durante desarrollo proporciona:

- servidor local;
- compilación rápida;
- actualización automática;
- integración con TypeScript y React.

El servidor de desarrollo puede iniciarse desde la raíz del monorepo mediante:

npm run dev:web

---

## 17.5 Punto de entrada

El archivo:

apps/web/src/main.tsx

es el punto de entrada de la aplicación React.

Busca el elemento:

<div id="root"></div>

definido en index.html.

Después monta el componente principal App dentro de ese elemento.

El flujo es:

index.html
    |
    v
#root
    |
    v
main.tsx
    |
    v
App.tsx
    |
    v
Aplicación React

---

## 17.6 StrictMode

La aplicación utiliza React StrictMode durante desarrollo.

StrictMode ayuda a detectar:

- efectos secundarios inesperados;
- patrones problemáticos;
- determinadas prácticas inseguras.

No representa ningún elemento visual para el usuario.

---

## 17.7 Workspace

La aplicación web se identifica dentro del monorepo como:

@sistema-clinico/web

Esto permite ejecutar sus comandos desde la raíz.

Ejemplos:

npm run dev --workspace=@sistema-clinico/web

npm run build --workspace=@sistema-clinico/web

npm run lint --workspace=@sistema-clinico/web

También existe el comando simplificado:

npm run dev:web

definido en el package.json raíz.

---

## 17.8 Build

El comando:

npm run build --workspace=@sistema-clinico/web

ejecuta:

tsc -b && vite build

Primero TypeScript comprueba el proyecto.

Si no existen errores de tipado, Vite genera el build de producción.

El resultado se almacena en:

apps/web/dist/

El directorio dist no se guarda en Git porque es un resultado generado
automáticamente.

---

## 17.9 ESLint

ESLint analiza el código fuente buscando errores y patrones problemáticos.

Se ejecuta mediante:

npm run lint --workspace=@sistema-clinico/web

El objetivo es mantener un estándar consistente de código durante todo el
desarrollo.

---

## 17.10 Estado actual del frontend

Actualmente se ha comprobado correctamente:

- instalación de React;
- instalación de TypeScript;
- instalación de Vite;
- integración con npm workspaces;
- servidor de desarrollo;
- compilación de producción;
- validación TypeScript;
- análisis ESLint;
- limpieza completa de código y recursos de demostración (boilerplate).

La aplicación muestra temporalmente una pantalla básica de confirmación.

La interfaz clínica se desarrollará en fases posteriores.

---

# 18. Configuración del Backend API

## 18.1 Tecnologías

El backend de la plataforma utiliza:

- Node.js
- NestJS
- TypeScript

El código base se encuentra ubicado en:

apps/api/

## 18.2 Integración al Monorepo

El backend fue generado utilizando el CLI de NestJS, pero configurado específicamente para convivir dentro de la arquitectura del monorepo. 

Se identifica en el workspace como:

@sistema-clinico/api

Esto permite instalar y gestionar sus dependencias directamente desde el package.json de la raíz del proyecto.

## 18.3 Limpieza y Privacidad

Para garantizar la privacidad de los datos, evitar consumo de red innecesario y mantener la consola limpia de advertencias (como errores 401), se purgó la dependencia predeterminada de telemetría:

- Se desinstaló el paquete @nestjs/observe.
- Se eliminó la configuración de ObserveModule en el archivo app.module.ts.

## 18.4 Punto de entrada

El archivo principal del backend es:

apps/api/src/main.ts

Este archivo contiene la función bootstrap que inicializa la aplicación NestJS y levanta el servidor web escuchando en el puerto definido en las variables de entorno (por defecto el puerto 3000).

---

# 19. Base de Datos (PostgreSQL)

## 19.1 Infraestructura Local

Para el entorno de desarrollo local, se optó por una instalación nativa de PostgreSQL directamente en el sistema operativo (Windows) para optimizar el consumo de recursos, descartando la orquestación con Docker en esta fase. 

La base de datos principal del proyecto ha sido creada bajo el nombre `sistema_clinico`.

## 19.2 Gestión de Credenciales

Las credenciales de acceso no se exponen en el código fuente. Se gestionan estrictamente a través de un archivo `.env` ubicado en la raíz del monorepo (ignorado por Git). 

El backend utiliza el módulo `@nestjs/config` configurado con la propiedad `envFilePath: '../../.env'` para localizar y cargar estas variables correctamente desde su posición en el workspace (`apps/api/`).

## 19.3 Integración con NestJS

El acceso a datos se gestiona a través de TypeORM (`@nestjs/typeorm` y el driver `pg`). La conexión se inicializa de forma asíncrona mediante `TypeOrmModule.forRootAsync`, inyectando el `ConfigService` para leer la variable `DATABASE_URL`.

*Nota de Arquitectura:* Durante el desarrollo local, la propiedad `synchronize: true` está habilitada para agilizar la creación de tablas. Esta propiedad deberá deshabilitarse estrictamente en entornos de producción, donde se implementará un sistema formal de migraciones.

---

# 20. Infraestructura Visual (Tailwind CSS y Shadcn UI)

## 20.1 Tecnologías y Filosofía de Diseño

Para construir una interfaz escalable, modular y reutilizable para cualquier tipo de SaaS (no solo clínico), se seleccionó la combinación de **Tailwind CSS v4** y **Shadcn UI**.

Ubicación del código:
`apps/web/`

Principios aplicados:
- **Componentes Agnósticos:** Los componentes de la UI (botones, modales, tarjetas, tablas) no conocen el dominio clínico; son piezas universales reutilizables para cualquier negocio.
- **Design Tokens Semánticos:** Se definieron variables CSS semánticas en HSL (`--primary`, `--secondary`, `--background`, `--card`, `--destructive`, `--muted`, `--border`, etc.) con soporte automático para Modo Claro y Modo Oscuro. Cambiar de marca o adaptar el sistema para otro cliente no requiere tocar componentes React.
- **Propiedad del Código:** Siguiendo la filosofía Shadcn, los componentes residen en `apps/web/src/components/ui/` y son 100% editables por el equipo.

## 20.2 Path Aliases (@/*)

Se configuraron aliases en Vite y TypeScript para evitar rutas relativas frágiles (`../../../`):
- `tsconfig.app.json`: Mapea `@/*` a `./src/*` (respetando la deprecación de `baseUrl` en TypeScript 6).
- `vite.config.ts`: Resuelve `@` hacia `./src` mediante `path.resolve`.

## 20.3 Integración con Vite 8

Se utilizó el plugin oficial `@tailwindcss/vite`, eliminando la necesidad de archivos de configuración intermedios (`postcss.config.js` o `tailwind.config.js`). El motor de Tailwind compila directamente desde `apps/web/src/index.css`.

## 20.4 Utilidad Maestra `cn()`

Ubicación: `apps/web/src/lib/utils.ts`

Combina:
- `clsx`: Manejo de clases condicionales.
- `tailwind-merge`: Resolución inteligente de conflictos de clases CSS.

## 20.5 Componentes Implementados

- `Button` (`apps/web/src/components/ui/button.tsx`):
  - Variantes declarativas con `class-variance-authority` (`cva`): `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`.
  - Tamaños: `default`, `sm`, `lg`, `icon`.
  - Polimorfismo con `@radix-ui/react-slot` (`asChild` para botones enlace sin anidaciones HTML inválidas).

## 20.6 Validación

Se ejecutaron y pasaron exitosamente:
- `npm run lint --workspaces`: 0 errores.
- `npm run build --workspaces`: compilación de API y Web en menos de 1 segundo.
- Validación del servidor de desarrollo Vite (`npm run dev:web` en `http://localhost:5173/`).
- Cambio dinámico de tema claro/oscuro verificado.

---

# 21. Arquitectura de Autenticación y Sesiones (Backend)

## 21.1 Tecnologías y Seguridad

Para proteger la plataforma SaaS y gestionar la identidad de los usuarios de forma segura y multi-tenant, se implementó el módulo de autenticación en **NestJS**:

- **Tokens JWT:** `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt` para emitir y validar credenciales sin estado (stateless) portables entre web y móvil.
- **Hashing Criptográfico:** `bcryptjs` con 10 rondas de salt para almacenar de forma irreversible las contraseñas en PostgreSQL.
- **Validación Preventiva de DTOs:** `class-validator` y `class-transformer` con `ValidationPipe` global configurado con `whitelist: true` y `forbidNonWhitelisted: true` para prevenir ataques de asignación masiva (*Mass Assignment*).
- **CORS:** Habilitado en la API para permitir comunicación directa con el frontend de Vite.

## 21.2 Modelado de Datos Inicial (Tenants y Usuarios)

Se crearon las entidades base en TypeORM conectadas a PostgreSQL nativo:
- **`Consultorio` (`consultorios`):** Representa al inquilino (*tenant*) con clave primaria UUID v4 para prevenir ataques de enumeración.
- **`Usuario` (`usuarios`):** Cuenta con `email` único e indexado, `password_hash`, enum tipado `RolUsuario` (`ADMIN`, `MEDICO`, `RECEPCION`) y relación foránea vinculante con `Consultorio`.

## 21.3 Endpoints Implementados

Bajo la ruta `/auth`:
- `POST /auth/registro`: Creación simultánea del Consultorio (Tenant) y su primer usuario Administrador con contraseña hasheada y retorno de JWT.
- `POST /auth/login`: Validación de credenciales contra PostgreSQL mediante bcrypt y retorno de JWT con payload `{ sub, email, rol, consultorioId }`.
- `GET /auth/perfil`: Endpoint protegido mediante `JwtAuthGuard`. Rechaza solicitudes sin token o con token alterado con `401 Unauthorized`. Inyecta el usuario autenticado en `req.user`.

## 21.4 Validación Funcional

Se verificó mediante peticiones HTTP reales a la API:
- Registro de consultorio y admin con UUIDs: Exitoso (201).
- Login con credenciales válidas: Exitoso con retorno de token JWT (200).
- Login con contraseña incorrecta: Rechazado con `401 Unauthorized`.
- Acceso a `/auth/perfil` sin token: Rechazado con `401 Unauthorized`.
- Acceso a `/auth/perfil` con Bearer Token: Exitoso con perfil del usuario descifrado (200).

---

# 22. Modelo de Roles y Permisos (RBAC Multi-Tenant)

## 22.1 Filosofía de Diseño: Núcleo SaaS vs. Dominio Específico

Para garantizar que el sistema funcione como base reutilizable para cualquier tipo de negocio (clínicas, colegios, despachos legales, etc.), se implementó un sistema de **Control de Acceso Basado en Roles (RBAC)** desacoplado:

- **Rol Universal del Núcleo (`ADMIN`):** Administrador de la organización/tenant con acceso total, aplicable a cualquier industria.
- **Plantillas de Dominio (*Domain Presets*):** Roles operativos como `PROFESIONAL_SALUD` y `RECEPCION` no están quemados en el código como enums fijos, sino registrados como plantillas en la base de datos que pueden adaptarse a cada rubro comercial.
- **Permisos Granulares:** Siguen la convención `recurso:accion` (ej. `pacientes:crear`, `citas:agendar`, `usuarios:editar`), agrupados por módulo.

## 22.2 Entidades TypeORM y Estructura en PostgreSQL

Se crearon las entidades relacionales:
- **`Permiso` (`permisos`):** ID UUID, `codigo` único, `nombre`, `modulo` (`CORE_USUARIOS`, `CORE_SEGURIDAD`, `CLINICA_PACIENTES`, etc.) y descripción.
- **`Rol` (`roles`):** ID UUID, `codigo`, `nombre`, `es_sistema` (booleano para evitar eliminación accidental) y `consultorio_id` (nullable: `null` = rol global del sistema; UUID = rol personalizado de esa clínica).
- **Tabla Intermedia `roles_permisos`:** Relación Muchos a Muchos gestionada por TypeORM con claves foráneas cruzadas.
- **Vinculación con `Usuario`:** La entidad `Usuario` ahora incluye `rol_id` (`ManyToOne` con carga automática de permisos en `eager: true`).

## 22.3 Módulo y Semillero Automático (`RolesModule`)

- `RolesService` implementa `OnModuleInit` para inicializar automáticamente:
  - 14 permisos base catalogados.
  - El rol universal `ADMIN` con el 100% de los permisos asociados.
  - Las plantillas de roles `PROFESIONAL_SALUD` (9 permisos) y `RECEPCION` (6 permisos).
- `RolesController`: Expone `GET /roles` y `GET /roles/permisos` protegidos por `JwtAuthGuard`.
- `AuthModule` marcado con `@Global()` para que los guards y estrategias JWT estén disponibles en toda la API sin re-importaciones redundantes.

## 22.4 Validación Funcional

- Compilación y linters: Cero errores en todo el monorepo.
- PostgreSQL: 5 tablas sincronizadas (`consultorios`, `usuarios`, `roles`, `permisos`, `roles_permisos`).
- Seeding verificado en vivo con 14 permisos y 3 roles enlazados.
- Token JWT generado para nuevos registros incluye el array completo de permisos del rol asignado.
- Endpoints `GET /roles` y `GET /roles/permisos` verificados con HTTP 200 y serialización correcta.

---

# 23. Aislamiento Multi-Tenant y Control de Acceso por Consultorio

## 23.1 Principios de Aislamiento en Base de Datos Compartida

El sistema opera bajo el modelo **Shared Database, Shared Schema** (Base de datos compartida con esquema compartido). Para prevenir vulnerabilidades de acceso cruzado (*Cross-Tenant Data Leakage* o *IDOR*), se implementaron tres capas de defensa en el backend:

1. **La Organización proviene únicamente del Token JWT:** El cliente no puede falsear a qué consultorio pertenece mediante el cuerpo o parámetros de la petición; el `consultorioId` se extrae de la firma criptográfica verificada por el servidor.
2. **Decorador `@ConsultorioActual()`:** Permite a los controladores inyectar de forma transparente y tipada el `consultorioId` del usuario autenticado para filtrar las consultas en PostgreSQL (`WHERE consultorio_id = :consultorioId`).
3. **Guard de Seguridad `TenantGuard`:** Intercepta peticiones dirigidas a recursos con identificador de organización (`:id` o `:consultorioId`) y valida que coincidan con la del usuario activo. Si detecta un intento de acceso a otra organización, responde inmediatamente con `403 Forbidden`.
4. **Entidad Base `TenantBaseEntity`:** Clase abstracta que estandariza las columnas `id` (UUID v4), `consultorioId` (clave foránea vinculante con eliminación en cascada), `creadoEn` y `actualizadoEn` para todas las entidades de negocio presentes y futuras.

## 23.2 Módulo de Gestión de Consultorios (`ConsultoriosModule`)

Se implementó el módulo encargado de la organización:
- `ConsultoriosService`: Métodos para consulta y actualización de la información corporativa.
- `ConsultoriosController`:
  - `GET /consultorios/mi-consultorio`: Retorna la información de la clínica del usuario autenticado mediante `@ConsultorioActual()`.
  - `GET /consultorios/:id`: Protegido por `TenantGuard`. Permite al consultorio ver sus propios datos y bloquea a cualquier otra clínica.
  - `PATCH /consultorios/:id`: Protegido por `TenantGuard`. Permite actualizar teléfono, dirección o nombre con validación de DTO.

## 23.3 Validación Funcional y Pruebas de Seguridad en Vivo

Se ejecutó una batería de pruebas de penetración y acceso cruzado en vivo:
- Dr. Carlos (`Centro Médico San Rafael`) consulta `mi-consultorio`: ✅ **HTTP 200 OK**.
- Dra. Elena (`Policlínico Sur`) consulta `mi-consultorio`: ✅ **HTTP 200 OK**.
- Dr. Carlos intenta consultar el ID del consultorio de Elena: ⛔ **HTTP 403 Forbidden** (Bloqueado por `TenantGuard`).
- Dra. Elena intenta consultar el ID del consultorio de Carlos: ⛔ **HTTP 403 Forbidden** (Bloqueado por `TenantGuard`).
- Dr. Carlos actualiza el teléfono de su propio consultorio: ✅ **HTTP 200 OK**.
- Dr. Carlos intenta modificar los datos del consultorio de Elena: ⛔ **HTTP 403 Forbidden**.