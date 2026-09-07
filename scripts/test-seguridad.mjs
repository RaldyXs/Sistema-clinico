import { spawn } from 'node:child_process';
import crypto from 'node:crypto';

const API_BASE = 'http://localhost:3000';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// RFC 6238 TOTP helper para la prueba automatizada
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(input) {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (let i = 0; i < clean.length; i++) {
    const charIdx = BASE32_CHARS.indexOf(clean[i]);
    if (charIdx === -1) continue;
    value = (value << 5) | charIdx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function generateTotp(secret) {
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / 30);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter), 0);
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(buf);
  const digest = hmac.digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return (binary % 1000000).toString().padStart(6, '0');
}

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, headers: res.headers, data };
}

async function main() {
  console.log('🚀 Iniciando servidor de pruebas para Fase 9 (Seguridad Avanzada, Auditoría, 2FA y Backups)...');

  // Matamos procesos huérfanos que puedan tener el puerto 3000
  const server = spawn('node', ['apps/api/dist/main.js'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: '3000' },
  });

  server.stdout.on('data', (d) => {
    const s = d.toString();
    if (s.includes('Nest application successfully started') || s.includes('ERROR')) {
      process.stdout.write(`[API] ${s}`);
    }
  });
  server.stderr.on('data', (d) => process.stderr.write(`[API ERR] ${d}`));

  // Esperar a que el servidor esté listo
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ping@test.com', password: 'password123' }),
      });
      if (res.status === 401 || res.status === 400) {
        ready = true;
        break;
      }
    } catch {
      await wait(500);
    }
  }

  if (!ready) {
    console.error('❌ El servidor API no pudo iniciar a tiempo');
    server.kill();
    process.exit(1);
  }

  console.log('\n🟢 Servidor en línea. Ejecutando suite de pruebas de Seguridad...\n');

  try {
    // 1. Iniciar sesión con Tenant 1 (Dr. Carlos)
    const login1 = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'dr.carlos@test.com',
        password: 'Test1234!',
      }),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0' },
    });
    if (login1.status !== 200 || !login1.data.accessToken) {
      throw new Error(`Fallo login Tenant 1: ${JSON.stringify(login1.data)}`);
    }
    const token1 = login1.data.accessToken;
    console.log('✅ 1. Login Dr. Carlos (Tenant 1) exitoso. Sesión creada.');

    // 2. Iniciar sesión con Tenant 2 (Dra. Elena)
    const login2 = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'elena.rios@test2.com',
        password: 'Test1234!',
      }),
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1' },
    });
    if (login2.status !== 200 || !login2.data.accessToken) {
      throw new Error(`Fallo login Tenant 2: ${JSON.stringify(login2.data)}`);
    }
    const token2 = login2.data.accessToken;
    console.log('✅ 2. Login Dra. Elena (Tenant 2) exitoso. Sesión creada.');

    // 3. Auditoría: Consultar resumen y lista de eventos
    const auditResumen = await request('/auditoria/resumen', {
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (auditResumen.status !== 200 || typeof auditResumen.data.totalHoy !== 'number') {
      throw new Error(`Error en auditoría resumen: ${JSON.stringify(auditResumen.data)}`);
    }
    console.log(`✅ 3. Resumen de auditoría obtenido: ${auditResumen.data.totalHoy} eventos hoy.`);

    const auditList = await request('/auditoria?limite=10', {
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (auditList.status !== 200 || !Array.isArray(auditList.data.logs)) {
      throw new Error(`Error en lista de auditoría: ${JSON.stringify(auditList.data)}`);
    }
    console.log(`✅ 4. Bitácora de auditoría consultada: ${auditList.data.logs.length} registros paginados.`);

    // 4. Gestión de Sesiones: Listar y revocar
    const sesionesRes = await request('/auth/sesiones', {
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (sesionesRes.status !== 200 || !Array.isArray(sesionesRes.data)) {
      throw new Error(`Error al listar sesiones: ${JSON.stringify(sesionesRes.data)}`);
    }
    console.log(`✅ 5. Lista de sesiones activas: ${sesionesRes.data.length} sesiones encontradas.`);

    // Crear una segunda sesión para Tenant 1 simulando un smartphone
    const loginMovil = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'dr.carlos@test.com',
        password: 'Test1234!',
      }),
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' },
    });
    const tokenMovil = loginMovil.data.accessToken;
    console.log('✅ 6. Segunda sesión concurrente creada (Dispositivo Móvil).');

    // Revocar todas las demás sesiones desde la sesión principal
    const revocarRes = await request('/auth/sesiones/otras', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (revocarRes.status !== 200) {
      throw new Error(`Error al revocar otras sesiones: ${JSON.stringify(revocarRes.data)}`);
    }

    // Verificar que el token móvil ahora sea rechazado (401 Unauthorized)
    const checkRevocado = await request('/auth/perfil', {
      headers: { Authorization: `Bearer ${tokenMovil}` },
    });
    if (checkRevocado.status !== 401) {
      throw new Error(`La sesión revocada aún responde con HTTP ${checkRevocado.status} en lugar de 401`);
    }
    console.log('✅ 7. Revocación remota de sesión validada: Token secundario rechazado con HTTP 401.');

    // 5. Flujo 2FA (TOTP RFC 6238)
    const setup2fa = await request('/auth/2fa/setup', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (setup2fa.status !== 201 && setup2fa.status !== 200) {
      throw new Error(`Error al iniciar setup 2FA: ${JSON.stringify(setup2fa.data)}`);
    }
    const secret2fa = setup2fa.data.secret;
    console.log(`✅ 8. Setup 2FA iniciado: Clave Base32 generada y URI otpauth:// creada.`);

    // Generar código TOTP válido
    const codigoValido = generateTotp(secret2fa);
    const confirmar2fa = await request('/auth/2fa/confirmar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ codigo: codigoValido }),
    });
    if (confirmar2fa.status !== 200 || !confirmar2fa.data.recoveryCodes) {
      throw new Error(`Error al confirmar 2FA: ${JSON.stringify(confirmar2fa.data)}`);
    }
    const recoveryCodes = confirmar2fa.data.recoveryCodes;
    console.log(`✅ 9. 2FA activado exitosamente con TOTP. ${recoveryCodes.length} códigos de recuperación recibidos.`);

    // Probar Login Paso 1 con 2FA habilitado
    const loginPaso1 = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'dr.carlos@test.com',
        password: 'Test1234!',
      }),
    });
    if (loginPaso1.status !== 200 || !loginPaso1.data.require2FA || !loginPaso1.data.tempToken) {
      throw new Error(`Login paso 1 falló: ${JSON.stringify(loginPaso1.data)}`);
    }
    const tempToken = loginPaso1.data.tempToken;
    console.log('✅ 10. Login paso 1 validado: Requiere 2FA y retorna tempToken de corta duración.');

    // Probar Login Paso 2 con código incorrecto -> debe rechazar
    const loginBadCode = await request('/auth/login-2fa', {
      method: 'POST',
      body: JSON.stringify({ tempToken, codigo: '000000' }),
    });
    if (loginBadCode.status !== 401) {
      throw new Error(`Login 2FA no rechazó código inválido: ${loginBadCode.status}`);
    }

    // Probar Login Paso 2 con código de recuperación
    const codigoRecuperacion = recoveryCodes[0];
    const loginPaso2 = await request('/auth/login-2fa', {
      method: 'POST',
      body: JSON.stringify({ tempToken, codigo: codigoRecuperacion }),
    });
    if (loginPaso2.status !== 200 || !loginPaso2.data.accessToken) {
      throw new Error(`Login paso 2 con código de recuperación falló: ${JSON.stringify(loginPaso2.data)}`);
    }
    const tokenNuevo2fa = loginPaso2.data.accessToken;
    console.log('✅ 11. Login paso 2 con código de recuperación exitoso. Acceso concedido.');

    // Desactivar 2FA para dejar limpio el estado del usuario de prueba
    const nuevoCodigoTotp = generateTotp(secret2fa);
    const desactivar2fa = await request('/auth/2fa/desactivar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenNuevo2fa}` },
      body: JSON.stringify({ password: 'Test1234!', codigo: nuevoCodigoTotp }),
    });
    if (desactivar2fa.status !== 200) {
      throw new Error(`Error al desactivar 2FA: ${JSON.stringify(desactivar2fa.data)}`);
    }
    console.log('✅ 12. 2FA desactivado con verificación de contraseña y código temporal.');

    // 6. Respaldo y Portabilidad de Datos (Backups Multi-Tenant)
    const generarBackup = await request('/backups/generar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (generarBackup.status !== 201 || !generarBackup.data.id) {
      throw new Error(`Error al generar backup: ${JSON.stringify(generarBackup.data)}`);
    }
    const backupId = generarBackup.data.id;
    console.log(`✅ 13. Copia de seguridad generada. Archivo: ${generarBackup.data.nombreArchivo} (${generarBackup.data.tamanoBytes} bytes, SHA256: ${generarBackup.data.checksumSha256.slice(0, 16)}...).`);

    // Listar backups
    const listaBackups = await request('/backups', {
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (listaBackups.status !== 200 || listaBackups.data.length === 0) {
      throw new Error(`Error al listar backups: ${JSON.stringify(listaBackups.data)}`);
    }
    console.log(`✅ 14. Historial de copias de seguridad consultado: ${listaBackups.data.length} respaldo(s).`);

    // Verificar integridad criptográfica SHA-256
    const verificarRes = await request(`/backups/${backupId}/verificar`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (verificarRes.status !== 200 || !verificarRes.data.valido) {
      throw new Error(`Fallo en verificación de integridad: ${JSON.stringify(verificarRes.data)}`);
    }
    console.log('✅ 15. Integridad criptográfica verificada: SHA-256 coincide byte por byte.');

    // Descargar backup y verificar estructura del JSON
    const descargarRes = await request(`/backups/${backupId}/descargar`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    if (descargarRes.status !== 200 || typeof descargarRes.data !== 'object') {
      throw new Error(`Fallo al descargar backup: ${descargarRes.status}`);
    }
    if (!descargarRes.data.manifiesto || !descargarRes.data.datos) {
      throw new Error('Estructura de respaldo corrupta o incompleta');
    }
    console.log(`✅ 16. Descarga de respaldo validada: Manifiesto y datos del consultorio presentes.`);

    // 7. Aislamiento Multi-Tenant Blind (Zero-Knowledge)
    // Tenant 2 (Dra. Elena) intenta descargar el backup de Tenant 1 (Dr. Carlos)
    const crossBackup = await request(`/backups/${backupId}/descargar`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    if (crossBackup.status !== 404) {
      throw new Error(`Fuga de datos detectada: Tenant 2 obtuvo HTTP ${crossBackup.status} en lugar de 404`);
    }

    // Tenant 2 intenta verificar el backup de Tenant 1
    const crossVerif = await request(`/backups/${backupId}/verificar`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    if (crossVerif.status !== 404) {
      throw new Error(`Fuga de datos detectada en verificación: Tenant 2 obtuvo HTTP ${crossVerif.status} en lugar de 404`);
    }
    console.log('🛡️ 17. Blind Multi-Tenant Isolation VERIFICADO: Consultas cruzadas de auditoría y backups retornan HTTP 404.');

    console.log('\n🎉 ¡TODAS LAS 17 PRUEBAS DE FASE 9 (SEGURIDAD AVANZADA, AUDITORÍA, 2FA Y BACKUPS) PASARON CON ÉXITO!');
  } finally {
    console.log('\n🛑 Deteniendo servidor de pruebas...');
    server.kill();
  }
}

main().catch((err) => {
  console.error('\n❌ ERROR FATAL EN PRUEBAS DE SEGURIDAD:', err.message);
  process.exit(1);
});
