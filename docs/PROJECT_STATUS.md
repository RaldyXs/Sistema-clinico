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

**Estado:** PENDIENTE

### Objetivo

Implementar el sistema que permitirá identificar de forma segura a los usuarios de la plataforma.

Posteriormente deberá contemplar:

- inicio de sesión;
- cierre de sesión;
- almacenamiento seguro de contraseñas;
- sesiones;
- expiración;
- recuperación de contraseña;
- protección de rutas;
- validación desde NestJS;
- seguridad de tokens o mecanismo de sesión seleccionado.

La autenticación deberá implementarse en el backend.

No será suficiente ocultar páginas o botones en React.

---

## Tarea 7 — Crear entidades Consultorio, Usuario, Rol y Permiso

**Estado:** PENDIENTE

### Objetivo

Crear las entidades fundamentales que permitirán construir la arquitectura multi-consultorio.

Las entidades iniciales serán:

- Consultorio.
- Usuario.
- Rol.
- Permiso.

Estas entidades servirán posteriormente como base para:

- médicos;
- secretarias;
- administradores;
- autorización;
- control de acceso;
- separación entre consultorios.

---

## Tarea 8 — Implementar control de acceso por consultorio

**Estado:** PENDIENTE

### Objetivo

Garantizar que cada consultorio solamente pueda acceder a la información que le pertenece.

Ejemplo:

```text
Consultorio A
    |
    +---- Pacientes A
    +---- Médicos A
    +---- Consultas A

Consultorio B
    |
    +---- Pacientes B
    +---- Médicos B
    +---- Consultas B
```

Un usuario perteneciente al Consultorio A no deberá poder consultar datos pertenecientes al Consultorio B.

Esta regla deberá ser validada principalmente por NestJS y no únicamente por React.

---

# Estado general de la Fase 1

Actualmente:

```text
Fase 1 — Fundamentos

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
PENDIENTE

        ↓

Tarea 6
Autenticación y sesiones
PENDIENTE

        ↓

Tarea 7
Consultorio, Usuario, Rol y Permiso
PENDIENTE

        ↓

Tarea 8
Control de acceso por consultorio
PENDIENTE
```

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

Fase 1 — Fundamentos

**Última tarea completada:**

Tarea 5 — Configurar Tailwind CSS y Shadcn UI

**Tarea actual preparada:**

Tarea 6 — Implementar autenticación y sesiones

**Estado actual:**

PENDIENTE DE INICIO

**Siguiente objetivo:**

Diseñar e implementar la arquitectura de autenticación y manejo de sesiones en la API de NestJS con soporte multi-consultorio.

**Siguiente tarea después de autenticación y sesiones:**

Tarea 7 — Crear entidades Consultorio, Usuario, Rol y Permiso.