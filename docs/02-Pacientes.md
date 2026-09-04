# 02. Módulo de Pacientes — Arquitectura y Diseño Técnico

Este documento detalla la arquitectura, el modelo de datos, las consideraciones de seguridad y las reglas de negocio para el **Módulo de Pacientes** de la plataforma clínica SaaS.

---

## 1. Alcance y Objetivos del Módulo

El módulo de Pacientes es el núcleo de la información clínica y operativa del sistema. Sus objetivos principales son:

1. **Gestión Integral de Filiación:** Registro de datos personales, identificación oficial, contacto y personas de referencia ante emergencias.
2. **Base Médica Transversal:** Registro de antecedentes clínicos básicos, grupo sanguíneo y alergias, accesibles rápidamente por cualquier especialista médico.
3. **Aislamiento Multi-Tenant Estricto:** Cada consultorio solo puede acceder, listar o modificar los pacientes que hayan sido registrados bajo su propia organización.
4. **Trazabilidad y No-Destrucción (Soft Delete):** Por razones regulatorias y legales de salud, la información de pacientes nunca se elimina físicamente de la base de datos (`DELETE`). En su lugar, se maneja el estado `activo: boolean`.

---

## 2. Modelo de Datos de la Entidad `Paciente`

La entidad `Paciente` hereda de `TenantBaseEntity`, garantizando automáticamente:
- Clave primaria `id` (UUID v4).
- Clave foránea `consultorioId` (UUID) vinculada a la clínica.
- Marcas temporales de auditoría `creadoEn` y `actualizadoEn`.

### 2.1 Campos y Tipos de Datos

| Campo | Tipo PostgreSQL | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Sí | Clave primaria generada automáticamente (UUID v4). |
| `consultorio_id` | `uuid` | Sí | Tenant al que pertenece el paciente. |
| `nombre` | `varchar(100)` | Sí | Nombres de pila del paciente. |
| `apellido` | `varchar(100)` | Sí | Apellidos del paciente. |
| `tipo_documento` | `varchar(20)` | Sí | `CEDULA`, `DNI`, `PASAPORTE`, `OTRO`. |
| `documento_identidad` | `varchar(50)` | No | Identificador numérico o alfanumérico oficial. |
| `fecha_nacimiento` | `date` | Sí | Fecha de nacimiento para cálculo dinámico de edad. |
| `genero` | `varchar(20)` | Sí | `FEMENINO`, `MASCULINO`, `OTRO`. |
| `telefono` | `varchar(50)` | No | Número de teléfono o móvil para contacto y recordatorios. |
| `email` | `varchar(150)` | No | Correo electrónico del paciente o su tutor legal. |
| `direccion` | `text` | No | Dirección de residencia. |
| `grupo_sanguineo` | `varchar(20)` | No | `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`, `DESCONOCIDO`. |
| `alergias` | `text` | No | **Alerta médica:** Alergias medicamentosas o alimentarias. |
| `antecedentes_medicos` | `text` | No | Enfermedades crónicas, intervenciones previas, patologías. |
| `antecedentes_familiares` | `text` | No | Factores de riesgo hereditarios (diabetes, cáncer, etc.). |
| `contacto_emergencia_nombre` | `varchar(150)` | No | Nombre del acompañante o familiar responsable. |
| `contacto_emergencia_telefono` | `varchar(50)` | No | Teléfono de urgencias del contacto de emergencia. |
| `activo` | `boolean` | Sí | Estado lógico del paciente (por defecto `true`). |
| `creado_en` | `timestamp with time zone` | Sí | Fecha y hora de alta en el sistema. |
| `actualizado_en` | `timestamp with time zone` | Sí | Última fecha y hora de modificación de la ficha. |

---

## 3. Índices y Optimización en Base de Datos

1. **Unicidad Multi-Tenant de Documento:**
   - En una clínica, no pueden existir dos pacientes con la misma cédula o DNI.
   - Sin embargo, dos consultorios distintos (ej. en diferentes países) sí podrían tener números coincidentes.
   - Índice implementado:
     ```sql
     CREATE UNIQUE INDEX idx_paciente_consultorio_documento 
     ON pacientes (consultorio_id, documento_identidad) 
     WHERE documento_identidad IS NOT NULL;
     ```
2. **Búsqueda Rápida de Pacientes:**
   - Se indexan `consultorio_id`, `nombre`, `apellido` y `telefono` para permitir autocompletado en agenda y búsqueda por nombre en menos de 5 ms.

---

1. **Creación y Edición de Pacientes:** COMPLETADA (`POST /pacientes` y `PATCH /pacientes/:id`).
2. **Búsqueda y Filtros:** Endpoint `GET /pacientes` con paginación, filtros por texto, documento y orden alfabético.
3. **Ficha Completa del Paciente:** Endpoint `GET /pacientes/:id` con historial de citas, consultas y resumen clínico.

---

## 5. Implementación de Endpoints (Registro y Edición)

### 5.1 Endpoints Disponibles

- `POST /pacientes`:
  - Protegido por `JwtAuthGuard`.
  - Recibe `CrearPacienteDto` con validaciones de tipo, longitud y enums.
  - Inyecta de forma segura el `consultorioId` del usuario autenticado mediante `@ConsultorioActual()`.
  - Valida unicidad del documento dentro de la misma clínica (retorna `409 Conflict` si ya existe).
- `GET /pacientes/:id`:
  - Obtiene la ficha individual validando que pertenezca al consultorio activo (retorna `404 Not Found` en caso contrario).
- `PATCH /pacientes/:id`:
  - Recibe `ActualizarPacienteDto` para actualización parcial de datos o modificación de estado `activo`.
  - Impide que una clínica modifique pacientes ajenos.

### 5.2 Validación Funcional y Pruebas Reales

1. **Creación:** Paciente registrado exitosamente con datos clínicos y filiación completa (HTTP 201).
2. **Prevención de Duplicados:** Rechazo con HTTP 409 Conflict al intentar registrar dos veces el mismo documento en la misma clínica.
3. **Multi-Tenancy:** Creación permitida del mismo documento en consultorios distintos (aislamiento verificado).
4. **Edición:** Actualización exitosa de campos clínicos (alergias, teléfono) con HTTP 200 OK.
5. **Aislamiento Cruzado:** Rechazo con HTTP 404 Not Found al intentar modificar un paciente desde otra clínica.
