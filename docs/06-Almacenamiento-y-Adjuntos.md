# 06. Módulo de Almacenamiento y Documentos Clínicos Adjuntos — Arquitectura y Seguridad

Este documento describe la arquitectura, el modelo relacional, las políticas de seguridad y los flujos operativos del **Módulo de Almacenamiento y Documentos Adjuntos** de la plataforma SaaS (Tareas 24 y 25 del Roadmap oficial).

---

## 1. Alcance y Objetivos

En la práctica médica moderna, la historia clínica se nutre no solo de texto escrito, sino de evidencias diagnósticas complementarias: análisis hematológicos, urocultivos, biopsias, ecografías, tomografías, radiografías, consentimientos informados firmados e informes emitidos por otros prestadores de salud.

Los objetivos primordiales de este subsistema son:

1. **Particionamiento Físico por Tenant:** Los archivos de cada consultorio se almacenan en directorios aislados (`uploads/tenants/{consultorioId}/`), garantizando que la información de una clínica nunca se mezcle en el almacenamiento físico con la de otra.
2. **Prevención de Ataques de Directory Traversal y Ejecución Remota:** Los archivos originales son renombrados a UUID v4 con extensiones estrictamente validadas y saneadas, impidiendo sobreescrituras arbitrarias o inyección de scripts ejecutables en el servidor.
3. **Verificación Criptográfica de Integridad (SHA-256):** Cada archivo subido es procesado mediante una función hash SHA-256 que se almacena en la base de datos para certificar su inmutabilidad médica y forense.
4. **Vinculación Dual Asistencial (Paciente y Consulta):** Los archivos pueden vincularse a la historia global del paciente o anclarse de forma específica a una consulta clínica (`consultaId`).
5. **Tipificación Médica (Categorías):** Clasificación de adjuntos en `LABORATORIO`, `IMAGENOLOGIA`, `INFORME_EXTERNO`, `CONSENTIMIENTO` y `OTRO`.
6. **Aislamiento Multi-Tenant Ciego ("Blind Isolation"):** Tanto la consulta de metadatos como la descarga física del archivo responden con `404 Not Found ('Documento clínico no encontrado')` ante cualquier intento de acceso no autorizado entre consultorios.

---

## 2. Modelo de Datos Relacional (`DocumentoClinico`)

La entidad `DocumentoClinico` hereda de `TenantBaseEntity`:
- `id`: UUID v4 generado automáticamente.
- `consultorioId`: UUID vinculado a la organización emisora.
- Marcas temporales: `creadoEn` y `actualizadoEn`.

### 2.1 Campos y Tipos de Datos en PostgreSQL 18

| Campo | Tipo PostgreSQL | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Sí | Clave primaria única del documento (UUID v4). |
| `consultorio_id` | `uuid` | Sí | Consultorio propietario (`TenantBaseEntity`). |
| `paciente_id` | `uuid` | Sí | Paciente evaluado (`FK pacientes.id`, `RESTRICT`). |
| `consulta_id` | `uuid` | No | Consulta clínica origen (`FK consultas.id`, `SET NULL`, nullable). |
| `profesional_id` | `uuid` | Sí | Usuario/Médico que subió el documento (`FK usuarios.id`, `RESTRICT`). |
| `categoria` | `varchar(40)` | Sí | Categoría médica del adjunto (`CategoriaDocumento`, default `OTRO`). |
| `nombre_original` | `varchar(255)` | Sí | Nombre original legible del archivo subido. |
| `nombre_almacenado` | `varchar(255)` | Sí | Nombre seguro en disco (`{uuid}.{ext}`). |
| `mime_type` | `varchar(100)` | Sí | Tipo MIME validado (ej. `application/pdf`, `image/png`). |
| `peso_bytes` | `bigint` | Sí | Peso exacto del archivo en bytes (límite 15 MB). |
| `hash_sha256` | `varchar(64)` | Sí | Checksum SHA-256 para verificación de inmutabilidad. |
| `ruta_relativa` | `varchar(500)` | Sí | Ruta relativa dentro del directorio base de almacenamiento. |
| `descripcion` | `text` | No | Observaciones clínicas adicionales sobre el estudio. |
| `fecha_documento` | `date` | No | Fecha en la que fue tomado o emitido el estudio. |
| `creado_en` | `timestamp without time zone` | Sí | Auditoría de creación en base de datos. |
| `actualizado_en` | `timestamp without time zone` | Sí | Auditoría de última modificación. |

### 2.2 Categorías de Documentos (`CategoriaDocumento`)

- **`LABORATORIO`**: Hemogramas, perfiles lipídicos, glicemias, cultivos, citologías, biopsias, etc.
- **`IMAGENOLOGIA`**: Ecografías obstétricas/ginecológicas, radiografías, mamografías, tomografías, resonancias.
- **`INFORME_EXTERNO`**: Epicrisis, contra-referencias o exámenes derivados de otros centros médicos.
- **`CONSENTIMIENTO`**: Consentimientos informados firmados digitalmente o digitalizados tras firma manuscrita.
- **`OTRO`**: Cualquier otro documento complementario relevante para el historial.

---

## 3. Índices de Alto Rendimiento en PostgreSQL 18

```sql
-- 1. Consulta cronológica de archivos por paciente
CREATE INDEX idx_docs_consultorio_paciente 
ON documentos_clinicos (consultorio_id, paciente_id, creado_en DESC);

-- 2. Recuperación rápida de adjuntos asociados a un acto médico
CREATE INDEX idx_docs_consultorio_consulta 
ON documentos_clinicos (consultorio_id, consulta_id);

-- 3. Filtrado por categoría clínica (laboratorio vs imagenología)
CREATE INDEX idx_docs_consultorio_categoria 
ON documentos_clinicos (consultorio_id, categoria);
```

---

## 4. Endpoints de la API REST (`/documentos`)

Todos los endpoints exigen autenticación JWT y aplican `TenantGuard` implícito mediante `@ConsultorioActual()`.

| Método | Endpoint | Permiso Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/documentos/subir` | `documentos:subir` | Sube un archivo multipart (`multipart/form-data`) vinculado a paciente/consulta. |
| `GET` | `/documentos/paciente/:pacienteId` | `documentos:ver` | Lista los documentos de un paciente con filtros por categoría y paginación. |
| `GET` | `/documentos/consulta/:consultaId` | `documentos:ver` | Lista los archivos adjuntos a una consulta clínica específica. |
| `GET` | `/documentos/:id` | `documentos:ver` | Consulta los metadatos completos de un documento clínico. |
| `GET` | `/documentos/:id/descargar` | `documentos:ver` | Descarga el archivo físico en streaming con su nombre original. |
| `DELETE` | `/documentos/:id` | `documentos:eliminar` | Elimina el documento de la base de datos y purga el archivo físico del disco. |

---

## 5. Resumen de Fases del Módulo de Documentos y Recetas

- **Tarea 22 (Roadmap 22)**: Diseñar módulo de recetas (`Receta`, `jsonb`, índices). ✅ Completado
- **Tarea 23 (Roadmap 23)**: Generación de PDF oficial con `pdfkit` (membrillos, Rx, firma). ✅ Completado
- **Tarea 24 (Roadmap 24)**: Almacenamiento de archivos particionado por tenant con hash SHA-256. ✅ Completado
- **Tarea 25 (Roadmap 25)**: Adjuntos por paciente y consulta, categorización y descarga protegida. ✅ Completado
