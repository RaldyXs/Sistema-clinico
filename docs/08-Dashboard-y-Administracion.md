# Fase 7: Dashboard Principal, Administración de Personal y Branding Multi-Tenant

## 1. Visión General y Objetivos
La **Fase 7** del Sistema Clínico dota a la plataforma de visibilidad operativa en tiempo real y capacidades completas de autogestión para cada clínica inquilina (*tenant*). Proporciona métricas consolidadas, muros de actividad inmediata, administración integral de recursos humanos asistenciales y personalización estética y funcional por consultorio.

---

## 2. Arquitectura de Módulos

### 2.1 Módulo Dashboard (`DashboardModule`)
- **Controlador:** `DashboardController` (`/dashboard`)
- **Servicio:** `DashboardService`
- **Capacidades:**
  - `GET /dashboard/resumen`: Agregación de KPIs clínicos en memoria y base de datos:
    - Pacientes activos y nuevos pacientes dados de alta en el mes en curso.
    - Citas programadas para el día de hoy, desglosadas por estado (`PROGRAMADA`, `CONFIRMADA`, `EN_ESPERA`, `EN_CONSULTA`, `ATENDIDA`, `CANCELADA`, `NO_ASISTIO`).
    - Total de consultas médicas atendidas en el mes.
    - Recetas farmacológicas emitidas en el mes.
    - Embarazos obstétricos activos en seguimiento.
    - Próximas 5 citas inmediatas con detalle del paciente y del facultativo asignado.
  - `GET /dashboard/actividad`: Feed cronológico unificado que fusiona eventos de citas, consultas e historias clínicas, y recetas emitidas (15 eventos más recientes).
  - `GET /dashboard/top-diagnosticos`: Agrupación estadística de diagnósticos CIE-10 más prevalentes durante el mes calendario actual.

### 2.2 Módulo de Usuarios y Médicos (`UsuariosModule`)
- **Controlador:** `UsuariosController` (`/usuarios`)
- **Servicio:** `UsuariosService`
- **Capacidades:**
  - `POST /usuarios`: Alta de profesionales de la salud, recepcionistas o administradores vinculados estrictamente al `consultorioId` del token JWT. Hashing seguro con `bcryptjs` (salt 10). Ocultamiento total de `passwordHash` en respuestas.
  - `GET /usuarios`: Listado con soporte de filtros dinámicos por rol (`ADMIN`, `MEDICO`, `RECEPCION`), estado activo/inactivo, especialidad y búsqueda textual sobre nombre, apellido, email o matrícula profesional.
  - `GET /usuarios/medicos`: Endpoint optimizado para selectores de agenda que retorna únicamente profesionales médicos en estado activo.
  - `GET /usuarios/:id`: Obtención de perfil individual blindado con aislamiento *Zero-Knowledge* (retorna HTTP 404 genérico si el ID solicitado pertenece a otra clínica).
  - `PATCH /usuarios/:id`: Edición de datos personales, teléfono, matrícula, especialidad, rol o reseteo de contraseña.
  - `PATCH /usuarios/:id/estado`: Suspensión o reactivación inmediata (*soft-lock*) del acceso al sistema.

### 2.3 Configuración y Membrete Institucional (`ConsultoriosModule`)
- **Controlador:** `ConsultoriosController` (`/consultorios`)
- **Servicio:** `ConsultoriosService`
- **Capacidades:**
  - `GET /consultorios/configuracion`: Obtiene los datos del consultorio actual: horarios de atención, logotipo, colores de marca, módulos activos y configuración de membrete.
  - `PATCH /consultorios/configuracion`: Permite al administrador actualizar:
    - Identidad visual (`logoUrl`, `colorPrimario`, `colorSecundario`).
    - Horarios de apertura (`horarioAtencion` JSONB: días laborales, horas de apertura/cierre, duración estándar del turno).
    - Habilitación modular (`modulosActivos` JSONB: `ginecologia`, `recetas`, etc.).
    - Membrete y pie de recetas (`configuracionReceta` JSONB).

---

## 3. Ejemplos Prácticos de Peticiones y Respuestas

### 3.1 Obtención del Resumen del Dashboard
**Petición:**
```http
GET /dashboard/resumen HTTP/1.1
Host: localhost:3000
Authorization: Bearer <TOKEN_JWT_MEDICO>
```

**Respuesta (HTTP 200 OK):**
```json
{
  "pacientes": {
    "totalActivos": 48,
    "nuevosMes": 12
  },
  "citasHoy": {
    "total": 6,
    "porEstado": {
      "PROGRAMADA": 2,
      "CONFIRMADA": 1,
      "EN_ESPERA": 1,
      "EN_CONSULTA": 1,
      "ATENDIDA": 1,
      "CANCELADA": 0,
      "NO_ASISTIO": 0
    }
  },
  "consultasMes": {
    "total": 34,
    "completadas": 32
  },
  "recetasMes": {
    "totalEmitidas": 29
  },
  "embarazosActivos": 7,
  "proximasCitas": [
    {
      "id": "b3e0c451-92da-4eb2-a01a-0518d601d320",
      "fechaHoraInicio": "2026-09-07T14:30:00.000Z",
      "fechaHoraFin": "2026-09-07T15:00:00.000Z",
      "motivo": "Control prenatal semana 28",
      "estado": "EN_ESPERA",
      "paciente": {
        "id": "d73dc153-4ae5-4b0e-a793-c0b1e8610031",
        "nombre": "Ana",
        "apellido": "Torres",
        "telefono": "+54 9 11 9876-5432"
      },
      "profesional": {
        "id": "c653137d-a568-4ac1-9d49-c133e2d5a846",
        "nombre": "Mariana",
        "apellido": "Gómez",
        "especialidad": "Ginecología y Obstetricia"
      }
    }
  ]
}
```

### 3.2 Creación de un Nuevo Profesional Médico
**Petición:**
```http
POST /usuarios HTTP/1.1
Host: localhost:3000
Authorization: Bearer <TOKEN_JWT_ADMIN>
Content-Type: application/json

{
  "nombre": "Mariana",
  "apellido": "Gómez",
  "email": "dra.mariana@centrodelsol.com",
  "password": "Password123!",
  "rolCodigo": "MEDICO",
  "especialidad": "Ginecología y Obstetricia",
  "matriculaProfesional": "MP-998877",
  "telefono": "+54 9 11 4455-6677"
}
```

**Respuesta (HTTP 201 Created):**
```json
{
  "id": "c653137d-a568-4ac1-9d49-c133e2d5a846",
  "email": "dra.mariana@centrodelsol.com",
  "nombre": "Mariana",
  "apellido": "Gómez",
  "especialidad": "Ginecología y Obstetricia",
  "matriculaProfesional": "MP-998877",
  "telefono": "+54 9 11 4455-6677",
  "rolCodigo": "MEDICO",
  "rolId": null,
  "activo": true,
  "consultorioId": "f248e30b-5f09-4114-ba36-8adffc2e42ef",
  "creadoEn": "2026-09-07T05:18:29.000Z",
  "actualizadoEn": "2026-09-07T05:18:29.000Z"
}
```

### 3.3 Actualización de Branding y Horarios del Consultorio
**Petición:**
```http
PATCH /consultorios/configuracion HTTP/1.1
Host: localhost:3000
Authorization: Bearer <TOKEN_JWT_ADMIN>
Content-Type: application/json

{
  "email": "contacto@centrodelsol.com",
  "colorPrimario": "#0284c7",
  "colorSecundario": "#0f172a",
  "logoUrl": "https://cdn.centrodelsol.com/logo.png",
  "horarioAtencion": {
    "dias": ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"],
    "horaApertura": "08:00",
    "horaCierre": "19:00",
    "duracionTurnoMinutos": 30
  },
  "modulosActivos": {
    "ginecologia": true,
    "recetas": true,
    "pediatria": false
  },
  "configuracionReceta": {
    "encabezado": "Centro Médico Integral Del Sol - Especialistas en Salud Femenina",
    "piePagina": "Receta oficial válida por 30 días corridos a partir de la fecha de emisión.",
    "mostrarSignosVitales": true
  }
}
```

---

## 4. Pruebas de Verificación Automatizadas
La suite de pruebas end-to-end se encuentra en `scripts/test-dashboard-admin.mjs` y valida:
1. Resumen de KPIs en tiempo real contra PostgreSQL.
2. Feed de actividad cronológico de eventos.
3. Top 5 de diagnósticos CIE-10 del mes.
4. Alta, filtrado, listado exclusivo de médicos y edición de personal.
5. Suspensión de usuario (*soft-lock*).
6. Configuración y personalización de marca.
7. **Blind Multi-Tenant Isolation (404 Not Found)** al intentar acceder a usuarios entre diferentes clínicas.
