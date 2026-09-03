# Estado Actual del Proyecto — Sistema Clínico

> Este archivo es la fuente de verdad sobre el estado actual del desarrollo.
> Debe actualizarse al cerrar cada tarea importante antes de realizar el commit.
> Su mantenimiento corresponde a ChatGPT. Gemini debe generar un HANDOFF al finalizar cada tarea, pero no debe modificar este archivo.

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

**Estado:** EN PROGRESO

### Objetivo

Crear y configurar la base de datos PostgreSQL principal del Sistema Clínico.

PostgreSQL almacenará progresivamente la información estructurada de la plataforma, incluyendo:

- consultorios;
- usuarios;
- roles;
- permisos;
- médicos;
- especialidades;
- pacientes;
- citas;
- consultas;
- signos vitales;
- diagnósticos;
- tratamientos;
- recetas;
- documentos;
- auditoría.

### Arquitectura prevista

La API NestJS será la única capa de la aplicación que tendrá acceso directo a PostgreSQL.

El frontend React nunca deberá conectarse directamente a la base de datos.

El flujo será:

```text
React Web
    |
    | HTTPS / API
    v
NestJS
    |
    v
PostgreSQL
```

En una fase futura, la aplicación móvil utilizará exactamente el mismo backend:

```text
React Native
    |
    | HTTPS / API
    v
NestJS
    |
    v
PostgreSQL
```

Esto permite mantener todas las reglas de negocio y seguridad centralizadas dentro del backend.

### Variables de entorno previstas

La configuración existente en `.env.example` contempla:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=sistema_clinico
POSTGRES_USER=sistema_clinico
POSTGRES_PASSWORD=change_me

DATABASE_URL=postgresql://sistema_clinico:change_me@localhost:5432/sistema_clinico
```

Estas variables son valores de ejemplo y no representan credenciales reales.

Las credenciales reales deberán almacenarse dentro del archivo:

`.env`

Ese archivo no debe almacenarse en Git.

La relación será:

```text
.env.example
    |
    | documentación de variables
    |
    +---- sí se almacena en Git

.env
    |
    | credenciales reales
    |
    +---- NO se almacena en Git
```

### Objetivos técnicos de la tarea

Antes de considerar esta tarea como completada se deberá:

- Definir la estrategia de ejecución local de PostgreSQL.
- Configurar PostgreSQL para desarrollo.
- Crear la base de datos `sistema_clinico`.
- Configurar un usuario específico para la aplicación.
- Configurar las variables de entorno.
- Validar que PostgreSQL esté ejecutándose.
- Validar acceso a la base de datos.
- Preparar la integración entre NestJS y PostgreSQL.
- Documentar la arquitectura de base de datos.
- Ejecutar lint.
- Ejecutar build.
- Revisar `git status`.
- Realizar commit.
- Realizar push.
- Generar HANDOFF para ChatGPT.

### Estado actual

La tarea acaba de comenzar.

Todavía no se considera configurada la base de datos hasta completar y validar los pasos anteriores.

---

## Tarea 5 — Implementar autenticación y sesiones

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

## Tarea 6 — Crear entidades Consultorio, Usuario, Rol y Permiso

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

## Tarea 7 — Implementar control de acceso por consultorio

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
EN PROGRESO

        ↓

Tarea 5
Autenticación y sesiones
PENDIENTE

        ↓

Tarea 6
Consultorio, Usuario, Rol y Permiso
PENDIENTE

        ↓

Tarea 7
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
│       └── Node.js + NestJS + TypeScript
│
├── packages/
│   └── shared/
│
├── infra/
│   └── docker/
│
├── docs/
│   ├── 01-Fundamentos.md
│   └── PROJECT_STATUS.md
│
├── .editorconfig
├── .env.example
├── .gitattributes
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

La arquitectura objetivo inmediata será:

```text
React Web
    |
    | HTTP / HTTPS
    v
NestJS API
    |
    v
PostgreSQL
```

Posteriormente se incorporarán:

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
3. Actualizar la siguiente tarea como EN PROGRESO.
4. Actualizar `PROJECT_STATUS.md`.
5. Actualizar Notion.
6. Mantener el formato existente de este documento.

---

# Última actualización

**Fase actual:**

Fase 1 — Fundamentos

**Última tarea completada:**

Tarea 3 — Configurar Node.js y NestJS

**Tarea actual:**

Tarea 4 — Configurar PostgreSQL

**Estado actual:**

EN PROGRESO

**Siguiente objetivo:**

Configurar PostgreSQL como base de datos principal del Sistema Clínico y dejar preparada su integración con el backend NestJS.

**Siguiente tarea después de PostgreSQL:**

Tarea 5 — Implementar autenticación y sesiones.