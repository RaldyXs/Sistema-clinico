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