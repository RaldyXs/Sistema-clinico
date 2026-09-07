# Fase 8: Reportes Clínicos y Operativos, Productividad Médica y Exportación de Datos

## 1. Visión General y Objetivos
La **Fase 8** del Sistema Clínico implementa el motor de inteligencia de datos y reportería analítica tanto a nivel asistencial como de gestión operativa para clínicas multi-tenant.
Permite a los administradores y directores médicos auditar el volumen y la efectividad de las consultas, monitorizar la puntualidad y el ausentismo de los pacientes, evaluar la productividad individual por profesional de la salud, supervisar la prevalencia epidemiológica de diagnósticos CIE-10 y exportar datos crudos en formato tabular CSV compatible con Excel y herramientas de BI.

---

## 2. Arquitectura del Módulo (`ReportesModule`)

- **Controlador:** `ReportesController` (`/reportes`)
- **Servicio:** `ReportesService`
- **Seguridad:** Protegido por `JwtAuthGuard`, `RolesGuard` y `@Roles('ADMIN', 'MEDICO')` con inyección obligatoria del decorador `@TenantId()`.

### 2.1 Endpoints Disponibles

#### A. Reporte Operativo General (`GET /reportes/operativo`)
Calcula los indicadores globales de ocupación y servicio en un rango de fechas opcional (`fechaInicio`, `fechaFin`):
- **Totales de Citas:** Total de citas agendadas y desglose por estado (`PROGRAMADA`, `CONFIRMADA`, `EN_ESPERA`, `EN_CONSULTA`, `ATENDIDA`, `CANCELADA`, `NO_ASISTIO`).
- **Tasa de Efectividad:** Porcentaje de citas efectivamente atendidas sobre el total programado no cancelado.
- **Tasa de Ausentismo (No-Show):** Porcentaje de citas marcadas como `NO_ASISTIO`.
- **Distribución Semanal:** Conteo de citas por día de la semana (Lunes a Domingo) para identificar días pico.
- **Horarios Pico:** Agrupación horaria de consultas:
  - Mañana (07:00 - 11:59)
  - Mediodía (12:00 - 14:59)
  - Tarde (15:00 - 18:59)
  - Noche (19:00 - 23:59)
- **Crecimiento de Pacientes:** Histórico mensual de nuevos pacientes registrados en los últimos 6 meses.

#### B. Productividad por Médico (`GET /reportes/medicos`)
Evalúa el rendimiento de cada facultativo registrado en el consultorio:
- Citas totales asignadas.
- Citas atendidas vs. canceladas.
- Tasa de cumplimiento y asistencia (`%`).
- Consultas clínicas registradas con evolución médica.
- Recetas farmacológicas extendidas.

#### C. Reporte Epidemiológico y Diagnósticos CIE-10 (`GET /reportes/epidemiologico`)
Monitoreo de morbilidad y patologías atendidas:
- **Top CIE-10:** Ranking de patologías más diagnosticadas con su código, descripción, frecuencia absoluta y porcentaje sobre el total de consultas.
- **Distribución por Especialidad:** Volumen de consultas clasificadas por especialidad médica.
- **Métricas Perinatales y Obstétricas:** Número de controles prenatales realizados y ecografías fetales registradas en el período.

#### D. Exportación de Citas en CSV (`GET /reportes/exportar/citas-csv`)
Exporta el padrón detallado de citas con soporte UTF-8 BOM (`\uFEFF`) y delimitador punto y coma (`;`) para apertura directa en Microsoft Excel en español:
- Campos exportados: Fecha, Hora, Paciente, Documento Identidad, Teléfono, Médico Asignado, Especialidad, Estado de la Cita y Motivo de Consulta.
- Filtros opcionales por rango de fechas y médico específico (`medicoId`).

---

## 3. Ejemplos Prácticos de Peticiones y Respuestas

### 3.1 Consulta de Reporte Operativo
```http
GET /reportes/operativo?fechaInicio=2026-09-01&fechaFin=2026-09-30 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <TOKEN_JWT>
```

**Respuesta (HTTP 200 OK):**
```json
{
  "rango": {
    "fechaInicio": "2026-09-01",
    "fechaFin": "2026-09-30"
  },
  "citas": {
    "total": 45,
    "porEstado": {
      "PROGRAMADA": 5,
      "CONFIRMADA": 3,
      "ATENDIDA": 32,
      "CANCELADA": 2,
      "NO_ASISTIO": 3
    },
    "tasaEfectividad": 74.4,
    "tasaAusentismo": 6.7
  },
  "distribucionDias": {
    "Lunes": 8,
    "Martes": 12,
    "Miércoles": 10,
    "Jueves": 7,
    "Viernes": 8,
    "Sábado": 0,
    "Domingo": 0
  },
  "horariosPico": {
    "Manana": 18,
    "Mediodia": 8,
    "Tarde": 15,
    "Noche": 4
  },
  "crecimientoPacientes": [
    { "mes": "2026-04", "pacientes": 10 },
    { "mes": "2026-05", "pacientes": 14 },
    { "mes": "2026-06", "pacientes": 22 },
    { "mes": "2026-07", "pacientes": 18 },
    { "mes": "2026-08", "pacientes": 25 },
    { "mes": "2026-09", "pacientes": 30 }
  ]
}
```

### 3.2 Reporte de Rendimiento por Médico
```http
GET /reportes/medicos HTTP/1.1
Host: localhost:3000
Authorization: Bearer <TOKEN_JWT>
```

**Respuesta (HTTP 200 OK):**
```json
[
  {
    "medicoId": "b18b456e-69f8-45a1-9a3c-b177d54b8d78",
    "nombre": "Dr. Carlos Rodríguez",
    "especialidad": "Medicina General",
    "citasTotales": 28,
    "citasAtendidas": 24,
    "citasCanceladas": 1,
    "cumplimientoPorcentaje": 85.7,
    "consultasRegistradas": 24,
    "recetasEmitidas": 21
  }
]
```

### 3.3 Descarga de Citas en CSV
```http
GET /reportes/exportar/citas-csv HTTP/1.1
Host: localhost:3000
Authorization: Bearer <TOKEN_JWT>
```

**Respuesta Headers:**
```http
HTTP/1.1 200 OK
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="reporte_citas_2026-09-07.csv"
```

---

## 4. Frontend Visual (`ReportesView.tsx`)

La vista de reportería en `apps/web/src/views/ReportesView.tsx` incluye:
1. **Filtros Temporales:** Selectores rápidos de rango de fechas y filtro individualizado por médico.
2. **Tablero de KPIs Clave:** Tarjetas con volumen total de citas, tasa de efectividad asistencial, tasa de inasistencias y consultas totales realizadas.
3. **Gráficos de Distribución Horaria y Días:** Barras visuales dinámicas de afluencia por franja horaria (Mañana, Mediodía, Tarde, Noche) y actividad por día.
4. **Tabla de Productividad Asistencial:** Listado de profesionales con insignias de tasa de efectividad, métricas de recetas y consultas.
5. **Top Epidemiológico:** Frecuencia relativa de patologías CIE-10 diagnosticadas en la clínica.
6. **Descarga en 1 Clic:** Botón "Exportar CSV" que desencadena la descarga de datos tabulares con codificación UTF-8 compatible con Microsoft Excel.

---

## 5. Garantía de Aislamiento Multi-Tenant (Zero-Knowledge)

Cada consulta de agregación y exportación ejecuta cláusulas obligatorias `where: { consultorioId }` o `andWhere('entidad.consultorioId = :consultorioId', { consultorioId })`.
- Un inquilino jamás puede ver citas, médicos, pacientes o prevalencias de diagnósticos de otra clínica.
- El exportador CSV jamás incluirá registros pertenecientes a otro `consultorioId`.

---

## 6. Validación Automatizada

La suite de pruebas en `scripts/test-reportes.mjs` valida:
1. Autenticación de múltiples tenants concurrentes.
2. Obtención de métricas operativas globales.
3. Evaluación de productividad por profesional médico.
4. Extracción de estadísticas epidemiológicas CIE-10 y obstetricia.
5. Generación y estructura de encabezados en el archivo CSV exportado.
6. Aislamiento absoluto multi-tenant con consultas cruzadas retornando cero registros.
