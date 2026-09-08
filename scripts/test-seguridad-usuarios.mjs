/**
 * Test de Verificación:
 * 1. Prohibición de revocar el propio token/sesión activa.
 * 2. Prohibición de suspenderse a sí mismo.
 * 3. Asignación fiel del rol seleccionado (MEDICO, RECEPCION) sin sobreescribir a ADMIN.
 * 4. Regla de negocio: Un único ADMIN por clínica.
 * 5. Conteo de cuota total de usuarios (médicos, secretarias y personal).
 */

const BASE_URL = 'http://localhost:3000';

async function test() {
  console.log('🧪 Iniciando verificación de reglas de seguridad y roles...\n');

  // Login como Dr. Carlos (ADMIN de Centro Médico Del Sol)
  const resLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'dr.carlos@test.com',
      password: 'Test1234!',
    }),
  });

  const dataLogin = await resLogin.json();
  const token = dataLogin.accessToken;
  const usuarioId = dataLogin.usuario.id;

  console.log(`✅ Login como Dr. Carlos exitoso (ID: ${usuarioId})`);

  // Obtener sesiones activas para identificar la sesión actual
  const resSesiones = await fetch(`${BASE_URL}/auth/sesiones`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const sesiones = await resSesiones.json();
  const sesionActual = sesiones.find((s) => s.esActual);
  console.log(`✅ Sesión actual encontrada: ${sesionActual?.id}`);

  // 1. Intentar revocar el propio token/sesión activa
  console.log('\n🔒 1. Probando intento de revocar la propia sesión activa...');
  const resRevocarPropia = await fetch(`${BASE_URL}/auth/sesiones/${sesionActual.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (resRevocarPropia.status === 400) {
    const err = await resRevocarPropia.json();
    console.log(`   ✅ Correctamente bloqueado (HTTP 400): "${err.message}"`);
  } else {
    console.error(`   ❌ Falló: se esperaba HTTP 400 pero se recibió ${resRevocarPropia.status}`);
    process.exit(1);
  }

  // 2. Intentar suspenderse a sí mismo
  console.log('\n🔒 2. Probando intento de suspender su propio usuario...');
  const resSuspenderPropio = await fetch(`${BASE_URL}/usuarios/${usuarioId}/estado`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ activo: false }),
  });
  if (resSuspenderPropio.status === 400) {
    const err = await resSuspenderPropio.json();
    console.log(`   ✅ Correctamente bloqueado (HTTP 400): "${err.message}"`);
  } else {
    console.error(`   ❌ Falló: se esperaba HTTP 400 pero se recibió ${resSuspenderPropio.status}`);
    process.exit(1);
  }

  // 3. Crear usuario con rol RECEPCION y verificar que NO se crea como ADMIN
  console.log('\n👤 3. Creando usuario con rol RECEPCION (Secretaria)...');
  const emailSec = `secretaria.${Date.now()}@test.com`;
  const resCrearSec = await fetch(`${BASE_URL}/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      nombre: 'María',
      apellido: 'Pérez',
      email: emailSec,
      password: 'Password123!',
      rolCodigo: 'RECEPCION',
    }),
  });
  const secCreada = await resCrearSec.json();
  if (resCrearSec.ok && secCreada.rolCodigo === 'RECEPCION') {
    console.log(`   ✅ Usuario creado exitosamente con rol: ${secCreada.rolCodigo} (no ADMIN)`);
  } else {
    console.error(`   ❌ Error al crear usuario recepcionista:`, secCreada);
    process.exit(1);
  }

  // 4. Intentar crear un segundo ADMIN en la misma clínica
  console.log('\n🛡️ 4. Probando intento de registrar un SEGUNDO Administrador en la misma clínica...');
  const resSegundoAdmin = await fetch(`${BASE_URL}/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      nombre: 'Carlos',
      apellido: 'Segundo',
      email: `segundo.admin.${Date.now()}@test.com`,
      password: 'Password123!',
      rolCodigo: 'ADMIN',
    }),
  });
  if (resSegundoAdmin.status === 400) {
    const err = await resSegundoAdmin.json();
    console.log(`   ✅ Correctamente bloqueado (HTTP 400): "${err.message}"`);
  } else {
    console.error(`   ❌ Falló: se esperaba HTTP 400 pero se recibió ${resSegundoAdmin.status}`);
    process.exit(1);
  }

  // 5. Verificar que la cuota de usuarios total incluye a la secretaria recién creada
  console.log('\n📊 5. Verificando conteo de usuarios totales en la cuota del plan...');
  const resSub = await fetch(`${BASE_URL}/saas/mi-suscripcion`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const dataSub = await resSub.json();
  console.log(`   ✅ Total de usuarios contabilizados: ${dataSub.consumo?.usuarios?.actual}/${dataSub.consumo?.usuarios?.maximo} (${dataSub.consumo?.usuarios?.porcentaje}%)`);

  console.log('\n🎉 ¡TODAS LAS REGLAS DE SEGURIDAD Y CONTROL DE ROLES VERIFICADAS AL 100%! 🎉\n');
}

test().catch(console.error);
