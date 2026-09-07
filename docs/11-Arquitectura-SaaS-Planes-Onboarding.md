# Fase 10: Arquitectura SaaS Global, Planes, Suscripciones y Onboarding de Consultorios

## 1. Visión General y Objetivos
La **Fase 10** transforma el Sistema Clínico en una plataforma SaaS comercial escalable y multi-tenant de nivel empresarial. Proporciona la infraestructura necesaria para monetizar el servicio médico mediante tiers de suscripción (Básico, Profesional y Enterprise), aprovisionar nuevas clínicas de forma 100% autónoma mediante un portal de onboarding público y administrar la flota completa de consultorios desde un panel unificado de **SuperAdmin**.

---

## 2. Arquitectura de Módulos y Entidades (`SaasModule`)

### 2.1 Entidad `Plan` (`saas_planes`)
Define las condiciones comerciales, cuotas asistenciales y módulos accesibles:
- `id`: UUID (Clave primaria).
- `codigo`: Identificador inmutable (`BASICO`, `PROFESIONAL`, `ENTERPRISE`).
- `nombre`: Denominación comercial para los usuarios.
- `descripcion`: Resumen de propuesta de valor.
- `precioMensual` / `precioAnual`: Tarifas comerciales con descuento anual.
- `maxMedicos`: Cupo máximo de profesionales médicos activos simultáneos.
- `maxPacientes`: Límite máximo de fichas activas registradas.
- `maxAlmacenamientoMb`: Cuota de espacio para documentos adjuntos y ecografías.
- `caracteristicas`: Lista de beneficios para la tabla comparativa de precios.
- `modulosIncluidos`: JSONB que gobierna qué especialidades y funciones se activan automáticamente en la clínica (`general`, `recetas`, `documentos`, `ginecologia`, `reportes`, `auditoria`).

### 2.2 Entidad `Suscripcion` (`saas_suscripciones`)
Vínculo entre cada clínica inquilina (*tenant*) y su plan contratado:
- `id`: UUID.
- `consultorioId`: Clave foránea al inquilino.
- `planId`: Clave foránea al plan comercial contratado.
- `estado`: `PRUEBA` (14 días gratis), `ACTIVA`, `VENCIDA` o `CANCELADA`.
- `periodo`: `MENSUAL` o `ANUAL`.
- `fechaInicio` y `fechaFin`: Ventana de vigencia del período contratado.
- `precioCobrado`: Importe abonado por la clínica.
- `renovacionAutomatica`: Booleano para control de ciclo de facturación.

---

## 3. Endpoints de la API (`SaasController` - `/saas`)

### 3.1 Endpoints Públicos
- `GET /saas/planes`: Retorna el catálogo de planes comerciales activos, precios y límites.
- `POST /saas/onboarding`: Permite el autoservicio de nuevas clínicas:
  - Crea el consultorio inquilino con aislamiento multi-tenant estricto.
  - Habilita los módulos específicos del plan seleccionado.
  - Crea el usuario Administrador y hashea su contraseña con bcryptjs.
  - Crea la suscripción con 14 días de prueba gratuita.
  - Registra el evento en la bitácora inmutable de auditoría.
  - Emite el token JWT para ingreso instantáneo a la plataforma.

### 3.2 Endpoints del Consultorio Autenticado (`Tenant`)
- `GET /saas/mi-suscripcion`: Entrega el estado de la suscripción, días restantes y medidores de consumo de cupos (médicos actuales vs límite, pacientes registrados vs límite).
- `POST /saas/cambiar-plan`: Permite ascender (Upgrade) a un plan superior (ej: de Básico a Enterprise), actualizando al instante los módulos activos de la clínica.

### 3.3 Endpoints del SuperAdmin (Plataforma Global)
- `GET /saas/dashboard`: KPIs consolidados de negocio:
  - Total de clínicas (activas vs suspendidas).
  - Total global de médicos en la plataforma.
  - Total global de pacientes asistidos.
  - Ingresos Mensuales Recurrentes (**MRR Estimado**).
  - Distribución de clínicas por plan comercial.
- `GET /saas/consultorios`: Directorio maestro de todos los inquilinos de la plataforma con su plan, cantidad de médicos y pacientes.
- `PATCH /saas/consultorios/:id/estado`: Suspensión o reactivación inmediata (*soft-lock*) de un consultorio. Cuando se suspende, todos los usuarios de esa clínica quedan automáticamente bloqueados (HTTP 401 Unauthorized) sin perder sus datos.

---

## 4. Ejemplos Prácticos de Peticiones y Respuestas

### 4.1 Onboarding Público de una Clínica
```http
POST /saas/onboarding HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "nombreConsultorio": "Policlínica San Mateo",
  "telefono": "+1 809-555-0150",
  "direccion": "Av. Independencia #45",
  "adminNombre": "Dr. Mateo",
  "adminApellido": "Vargas",
  "adminEmail": "mateo.vargas@sanmateo.com",
  "adminPassword": "PasswordSeguro123!",
  "planCodigo": "PROFESIONAL",
  "periodo": "MENSUAL"
}
```

**Respuesta (HTTP 201 Created):**
```json
{
  "mensaje": "¡Clínica aprovisionada con éxito en la nube!",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "usuario": {
    "id": "c1f38b47-...",
    "nombre": "Dr. Mateo",
    "email": "mateo.vargas@sanmateo.com",
    "rol": "ADMIN"
  },
  "consultorio": {
    "id": "e932b10a-...",
    "nombre": "Policlínica San Mateo",
    "modulosActivos": {
      "general": true,
      "recetas": true,
      "documentos": true,
      "ginecologia": true,
      "reportes": true,
      "auditoria": true
    }
  },
  "plan": {
    "codigo": "PROFESIONAL",
    "nombre": "Plan Clínica Profesional",
    "maxMedicos": 10,
    "maxPacientes": 5000
  },
  "suscripcion": {
    "id": "f8a09b11-...",
    "estado": "PRUEBA",
    "fechaFin": "2026-09-21T16:11:30.000Z"
  }
}
```

### 4.2 Dashboard SuperAdmin
```http
GET /saas/dashboard HTTP/1.1
Host: localhost:3000
Authorization: Bearer <TOKEN_ADMIN>
```

**Respuesta (HTTP 200 OK):**
```json
{
  "metricas": {
    "totalConsultorios": 5,
    "consultoriosActivos": 5,
    "consultoriosSuspendidos": 0,
    "totalMedicos": 8,
    "totalPacientes": 64,
    "totalConsultas": 38,
    "mrrEstimado": 245.00
  },
  "distribucionPlanes": {
    "BASICO": 2,
    "PROFESIONAL": 2,
    "ENTERPRISE": 1
  }
}
```

---

## 5. Frontend Visual Desarrollado

1. **Panel SuperAdmin (`SaasAdminView.tsx`):**
   - Tarjetas métricas de negocio en tiempo real (MRR mensual, total clínicas activas vs suspendidas, médicos en plataforma y pacientes globales).
   - Catálogo interactivo de planes con lista de cuotas y número de suscriptores por plan.
   - Directorio maestro de consultorios inquilinos con buscador rápido, visualización de cuotas y botones de acción para cambio de plan o suspensión inmediata.
2. **Modal de Onboarding en `LoginView.tsx`:**
   - Botón destacado "Registrar Nueva Clínica (14 Días Gratis)".
   - Formulario por pasos con selector visual de plan comercial, datos de contacto del consultorio y creación de cuenta administradora con redirección inmediata.

---

## 6. Validación Automatizada

La suite [`scripts/test-saas.mjs`](file:///C:/Proyectos/Sistema-clinico/scripts/test-saas.mjs) valida al 100%:
1. Catálogo comercial de planes disponible públicamente.
2. Onboarding autónomo con asignación de módulos según el plan y período de prueba.
3. Consulta de estado de suscripción y medidores de cuotas.
4. Ascenso instantáneo a Plan Enterprise con ampliación de capacidades.
5. Dashboard de métricas globales y cálculo de MRR.
6. Directorio maestro de inquilinos.
7. Suspensión de inquilino con bloqueo HTTP 401 inmediato.
8. Reactivación de inquilino y restauración de accesos.
