# Fase 9: Seguridad Avanzada, Auditoría Clínica, 2FA y Backups Multi-Tenant

## 1. Visión General y Objetivos
La **Fase 9** dota al Sistema Clínico de una capa de seguridad y cumplimiento normativo de grado institucional, alineada con los estándares internacionales para la protección de datos médicos sensibles (**HIPAA** en EE. UU. y **GDPR / LOPD** en Europa y Latinoamérica).

Garantiza:
1. **Trazabilidad Inmutable:** Cada lectura, modificación y exportación sobre pacientes, consultas, citas y recetas queda registrada en una bitácora forense de auditoría.
2. **Autenticación en Dos Factores (2FA):** Soporte estándar RFC 6238 basado en códigos temporales (TOTP) con códigos de recuperación de emergencia para acceso seguro del personal de salud.
3. **Gestión y Revocación de Sesiones:** Detección de dispositivos (sistema operativo, navegador, dirección IP) y revocación remota e inmediata de sesiones activas.
4. **Portabilidad y Copias de Seguridad Lógicas por Tenant:** Exportación completa del consultorio con cálculo de suma de comprobación criptográfica SHA-256 para verificación de integridad contra corrupción o alteración de datos.

---

## 2. Arquitectura de Módulos y Entidades

### 2.1 Módulo de Auditoría (`AuditoriaModule`)
- **Entidad:** `AuditoriaLog`
  - `id`: UUID (Clave primaria).
  - `consultorioId`: UUID (Multi-tenant indexado).
  - `usuarioId`, `usuarioEmail`, `usuarioNombre`: Identidad responsable de la acción.
  - `modulo`: 'AUTH' | 'PACIENTES' | 'CITAS' | 'CONSULTAS' | 'RECETAS' | 'GINECOLOGIA' | 'SEGURIDAD' | 'BACKUPS'.
  - `accion`: 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR' | 'CONSULTAR' | 'LOGIN' | 'LOGIN_2FA' | '2FA_ACTIVAR' | '2FA_DESACTIVAR' | 'SESION_REVOCAR' | 'GENERAR_BACKUP' | 'DESCARGAR_BACKUP'.
  - `entidadTipo`, `entidadId`: Tipo y UUID del registro manipulado.
  - `detalles`: JSONB con metadatos y valores previos/posteriores.
  - `ipAddress`, `userAgent`: Origen de red del cliente.
  - `creadoEn`: Marca temporal UTC inmutable.
- **Endpoints:**
  - `GET /auditoria/resumen`: Indicadores agregados (eventos hoy, última semana, distribución por módulo).
  - `GET /auditoria`: Lista filtrable y paginada por módulo, acción, fecha y profesional.
  - `GET /auditoria/paciente/:pacienteId`: Historial específico de quién accedió o modificó la ficha de un paciente (Auditoría HIPAA).

### 2.2 Autenticación de Dos Factores y Sesiones (`AuthModule`)
- **Entidad:** `SesionUsuario`
  - `id`, `usuarioId`, `consultorioId`, `ipAddress`, `userAgent`, `dispositivo`, `activa`, `ultimoAcceso`, `creadoEn`.
- **Campos 2FA en Usuario:**
  - `twoFactorEnabled`: boolean (indicador de activación).
  - `twoFactorSecret`: string (clave secreta Base32 RFC 4648).
  - `twoFactorRecoveryCodes`: jsonb (8 códigos de respaldo alfanuméricos de un solo uso).
- **Endpoints:**
  - `POST /auth/2fa/setup`: Genera el secreto Base32 y la URI `otpauth://` compatible con Google Authenticator, Microsoft Authenticator y 1Password.
  - `POST /auth/2fa/confirmar`: Valida el primer código de 6 dígitos, habilita el segundo factor y entrega los códigos de recuperación.
  - `POST /auth/2fa/desactivar`: Solicita contraseña actual y código TOTP para revertir el estado de 2FA.
  - `POST /auth/login-2fa`: Segundo paso del inicio de sesión (recibe `tempToken` de 5 minutos y código TOTP o código de respaldo).
  - `GET /auth/sesiones`: Lista los dispositivos conectados con la marca `esActual: true` en el dispositivo actual.
  - `DELETE /auth/sesiones/:id`: Cierra forzosamente la sesión en un dispositivo específico.
  - `DELETE /auth/sesiones/otras`: Cierra todas las demás sesiones salvo la actual.

### 2.3 Copias de Seguridad y Portabilidad (`BackupsModule`)
- **Entidad:** `BackupRegistro`
  - `id`, `consultorioId`, `usuarioId`, `nombreArchivo`, `rutaArchivo`, `tamanoBytes`, `checksumSha256`, `conteos`, `estado`, `creadoEn`.
- **Endpoints:**
  - `POST /backups/generar`: Exporta la totalidad de la clínica a un archivo estructurado JSON, calcula su hash SHA-256 y lo almacena en el directorio aislado del tenant.
  - `GET /backups`: Consulta el historial de copias de seguridad generadas.
  - `GET /backups/:id/verificar`: Lee el archivo en disco, recalcula el hash SHA-256 en tiempo real y valida su consistencia byte por byte.
  - `GET /backups/:id/descargar`: Descarga el archivo JSON con cabecera `Content-Disposition`.
  - **Blind Isolation:** Si un usuario de una clínica intenta descargar o verificar el backup de otra, recibe un HTTP `404 Not Found`.

---

## 3. Ejemplos Prácticos de Peticiones y Respuestas

### 3.1 Activación de 2FA
```http
POST /auth/2fa/setup HTTP/1.1
Host: localhost:3000
Authorization: Bearer <TOKEN_JWT>
```
**Respuesta:**
```json
{
  "secret": "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP",
  "qrUri": "otpauth://totp/Centro%20M%C3%A9dico:dr.carlos%40test.com?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=Centro%20M%C3%A9dico&algorithm=SHA1&digits=6&period=30",
  "mensaje": "Escanea el código QR con tu app de autenticación (Google Authenticator, Authy, etc.)"
}
```

### 3.2 Confirmación de 2FA
```http
POST /auth/2fa/confirmar HTTP/1.1
Host: localhost:3000
Authorization: Bearer <TOKEN_JWT>
Content-Type: application/json

{
  "codigo": "482910"
}
```
**Respuesta:**
```json
{
  "mensaje": "Autenticación de dos factores (2FA) activada correctamente",
  "twoFactorEnabled": true,
  "recoveryCodes": [
    "A1B2-C3D4",
    "E5F6-G7H8",
    "J9K0-L1M2",
    "N3P4-Q5R6",
    "S7T8-U9V0",
    "W1X2-Y3Z4",
    "B5C6-D7E8",
    "F9G0-H1J2"
  ]
}
```

### 3.3 Generación de Copia de Seguridad
```http
POST /backups/generar HTTP/1.1
Host: localhost:3000
Authorization: Bearer <TOKEN_JWT_ADMIN>
```
**Respuesta:**
```json
{
  "id": "c71a39f0-2f12-4c91-9e8a-8a562143b821",
  "nombreArchivo": "backup_centro_medico_del_sol_2026-09-07T14-34-32-100Z.json",
  "tamanoBytes": 42506,
  "checksumSha256": "db549c756c7b97d8...",
  "conteos": {
    "usuarios": 2,
    "pacientes": 8,
    "citas": 15,
    "consultas": 7,
    "recetas": 5,
    "documentos": 3,
    "historiasGinecologicas": 2,
    "embarazos": 1,
    "controlesPrenatales": 3,
    "ecografias": 2,
    "auditoria": 18
  },
  "estado": "GENERADO"
}
```

---

## 4. Frontend Visual (`SeguridadView.tsx`)

La interfaz implementada en `apps/web/src/views/SeguridadView.tsx` incluye:
1. **Pestaña de Auditoría Clínica:** Tarjetas analíticas de eventos diarios/semanales, filtros rápidos por módulo con etiquetas de color según la gravedad de la acción, y visualizador interactivo modal con el JSON y datos forenses de cada registro.
2. **Pestaña de 2FA y Dispositivos:** Panel guiado paso a paso para enrolamiento de aplicación autenticadora, visualizador de clave Base32 con botón de copiado rápido, visualización de códigos de emergencia y monitor de sesiones activas con botón de revocación remota en un clic.
3. **Pestaña de Copias de Seguridad:** Tarjeta con botón de creación de backup en tiempo real, tabla con tamaño del archivo, desglose de entidades exportadas, botón para verificar la integridad criptográfica SHA-256 e inicio instantáneo de descarga local del archivo JSON.

---

## 5. Validación y Suite de Pruebas

Ejecutada mediante `node scripts/test-seguridad.mjs`:
- ✅ 1. Inicio de sesión y creación de sesión de dispositivo.
- ✅ 2. Concurrencia de sesiones multi-dispositivo y revocación remota con invalidación instantánea (HTTP 401).
- ✅ 3. Enrolamiento y confirmación de 2FA con TOTP RFC 6238 nativo.
- ✅ 4. Flujo de login en 2 pasos y acceso con código de recuperación.
- ✅ 5. Desactivación segura de 2FA con doble validación (contraseña + código temporal).
- ✅ 6. Generación, listado, verificación criptográfica SHA-256 y descarga de respaldos lógicos.
- 🛡️ 7. Blind Multi-Tenant Isolation: acceso cruzado de auditoría o respaldos retorna HTTP 404 estricto.
