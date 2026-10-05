# 📘 Manual Maestro de Arquitectura, Operación y Continuidad del Proyecto

> **Guía Definitiva del Sistema Clínico Multi-Tenant (SaaS)**  
> *Conserva este documento en el repositorio. Si en algún momento abres un nuevo chat con una IA o incorporas a un nuevo programador, este archivo contiene todo lo necesario para retomar el 100% del proyecto de inmediato.*

---

## 🚀 1. Cómo retomar el proyecto en un nuevo chat de IA

Si pierdes o cierras esta sesión de chat y comienzas una nueva (en Antigravity, Claude, ChatGPT, Cursor, etc.), **solo copia y pega este mensaje inicial en el nuevo chat**:

```text
Hola. Estoy trabajando en el repositorio local "Sistema-clinico".
Es un sistema SaaS multi-tenant para clínicas médicas (NestJS + React + PostgreSQL + Docker).
Por favor, lee el archivo "docs/MANUAL_MAESTRO_DEL_PROYECTO.md" para entender la arquitectura, los roles, las credenciales y el flujo de despliegue antes de hacer cualquier cambio.
```

Con solo esa instrucción, la IA inspeccionará este manual y sabrá exactamente dónde está cada archivo, qué librerías se usan, cómo compilar y cómo desplegar sin romper nada.

---

## 🏗️ 2. Arquitectura General y Tecnologías

El proyecto está estructurado como un **Monorepo** moderno:

```text
Sistema-clinico/
├── apps/
│   ├── api/                   # Backend NestJS (Node.js 22 LTS, TypeScript)
│   │   ├── src/
│   │   │   ├── common/        # Decoradores (@Roles, @ConsultorioActual), Guards (TenantGuard, RolesGuard)
│   │   │   ├── modules/       # Módulos de negocio (auth, pacientes, consultas, recetas, caja, saas, auditoria)
│   │   │   └── main.ts        # Punto de entrada, Helmet, CORS dinámico, Trust Proxy
│   │   └── package.json
│   └── web/                   # Frontend React 18 (Vite, TypeScript, Tailwind CSS, Lucide)
│       ├── src/
│       │   ├── components/    # Componentes UI (Shadcn/UI, Layout, Modales)
│       │   ├── context/       # AuthContext (Gestión de sesión JWT, roles, sandbox local)
│       │   ├── lib/           # api.ts (Cliente HTTP inteligente con detección de proxy /api)
│       │   └── views/         # Vistas: Dashboard, Pacientes, Citas, Consultas, Recetas, Caja, etc.
│       └── package.json
├── docker-compose.yml         # Orquestación de contenedores (clinica_web, clinica_api, clinica_db)
├── Dockerfile.api             # Imagen de producción de la API
├── Dockerfile.web             # Imagen de producción del Frontend (Vite build + Nginx Alpine)
├── nginx.conf                 # Proxy inverso: redirige /api al backend y sirve la SPA en /
└── docs/                      # Documentación técnica, manuales y reportes
```

### Tecnologías Principales:
* **Backend:** NestJS 10, TypeORM, PostgreSQL 16, class-validator, bcrypt, jsonwebtoken, @nestjs/throttler.
* **Frontend:** React 18, Vite 6, Tailwind CSS, Radix UI primitives, Lucide React, jsPDF (generación de recetas/informes).
* **Infraestructura:** Docker & Docker Compose, Nginx (Reverse Proxy HTTP en puerto 80), Red bridge privada (`clinica_network`).

---

## 🔐 3. Cuentas y Credenciales del Sistema

Todos los usuarios de prueba y roles están configurados y verificados en la base de datos:

| Rol | Correo Electrónico | Contraseña | Alcance / Permisos |
| :--- | :--- | :--- | :--- |
| **Director / Admin** | `dr.carlos@test.com` | `Test1234!` | Control total de su clínica: altas de médicos/secretarias, expedientes, recetas, caja, reportes y datos institucionales. |
| **Médico Especialista** | `medico@test.com` | `Test1234!` | Consultas médicas, ginecología/embarazos, expedientes clínicos y emisión de recetas oficiales con firma digital. |
| **Recepción y Caja** | `recepcion@test.com` | `Test1234!` | Agenda de turnos, registro de pacientes, cobros por consulta, emisión de recibos y arqueo de caja. |
| **SuperAdmin (Dueño SaaS)** | `superadmin@saas.com` | `AdminSeguro2026!` | Dueño del software: acceso en `/admin` para crear clínicas, aprobar solicitudes de planes y ver métricas globales de ingresos (MRR). |

### Base de Datos PostgreSQL:
* **Usuario:** `postgres`
* **Contraseña:** `ClinicaSegura2026!`
* **Base de Datos:** `sistema_clinico`
* **Host interno Docker:** `db:5432`

---

## ⚙️ 4. Flujos Clave y Reglas de Negocio

### 4.1 Aislamiento Multi-Tenant (Seguridad Estricta)
* Cada clínica o consultorio tiene un UUID único en la tabla `consultorios`.
* El JWT firmado contiene el `consultorioId` del usuario autenticado.
* En el backend, el decorador `@ConsultorioActual()` y el guard `TenantGuard` inyectan y validan automáticamente este ID. Ningún médico o clínica puede ver ni modificar los registros de otra clínica.

### 4.2 Control de Acceso Basado en Roles (RBAC)
* Implementado con `@Roles('ADMIN', 'MEDICO', 'RECEPCION', 'SUPERADMIN')` y `RolesGuard`.
* Por ejemplo, un usuario de `RECEPCION` no puede anular cobros en caja sin autorización ni emitir recetas médicas (recibirá `403 Forbidden`).

### 4.3 Módulos y Planes SaaS
* Los módulos activos pertenecen a la suscripción de la clínica (Plan Básico, Profesional, Enterprise).
* Los clientes no apagan ni rompen los módulos de su clínica; la pantalla de configuración muestra de forma ejecutiva las herramientas incluidas y permite solicitar upgrades de capacidad de usuarios o pacientes.

---

## 🛠️ 5. Comandos de Operación y Despliegue

### 5.1 En Desarrollo Local (PC Windows):
```powershell
# Instalar dependencias en todo el monorepo
npm install

# Compilar API
npm --prefix apps/api run build

# Compilar Frontend
npm --prefix apps/web run build
```

### 5.2 En el Servidor Linux Mint (192.168.16.19):
Para actualizar el código sin reiniciar la base de datos:

```bash
# Entrar a la máquina (o vía SSH)
ssh joseph@192.168.16.19

# Ver estado de los contenedores
docker ps

# Ver logs de la API
docker logs --tail 50 clinica_api

# Ver logs de la Web/Nginx
docker logs --tail 50 clinica_web

# Reiniciar servicios
docker restart clinica_api clinica_web
```

---

## 🛡️ 6. Buenas Prácticas para Futuros Cambios
1. **Nunca modifiques la base de datos directamente con consultas destructivas:** Usa siempre TypeORM y revisa las relaciones de llaves foráneas (`consultorioId`, `pacienteId`).
2. **Mantén el cliente API centralizado:** Todas las peticiones del frontend deben usar `api.get`, `api.post`, etc. de `@/lib/api`. Nunca uses llamadas `fetch('http://localhost:3000')` directas.
3. **Respalda periódicamente la base de datos:** Ejecuta `docker exec clinica_db pg_dump -U postgres sistema_clinico > respaldo.sql`.
