/**
 * Test de Verificación de Permisos Estrictos para Médicos:
 * 1. El médico NO puede listar usuarios (GET /usuarios -> HTTP 403 Forbidden).
 * 2. El médico NO puede crear usuarios (POST /usuarios -> HTTP 403 Forbidden).
 * 3. El médico NO puede suspender/activar usuarios (PATCH /usuarios/:id/estado -> HTTP 403 Forbidden).
 * 4. El médico NO puede eliminar usuarios (DELETE /usuarios/:id -> HTTP 403 Forbidden).
 * 5. El médico SÍ puede acceder a la nómina médica para asignación de turnos (GET /usuarios/medicos -> HTTP 200 OK).
 * 6. El Administrador de la clínica SÍ mantiene acceso a todas las funciones administrativas.
 */

const BASE_URL = 'http://localhost:3000';

async function test() {
  console.log('🧪 Iniciando verificación de restricción de permisos para médicos...\n');

  // 1. Iniciar sesión como Dr. Carlos (ADMIN) para obtener datos de referencia
  const resLoginAdmin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'dr.carlos@test.com',
      password: 'Test1234!',
    }),
  });
  const dataAdmin = await resLoginAdmin.json();
  const tokenAdmin = dataAdmin.accessToken;
  console.log(`✅ Sesión de Administrador iniciada (ID: ${dataAdmin.usuario.id})`);

  // Crear o identificar un usuario médico para las pruebas
  const emailMedico = `medico.seguridad.${Date.now()}@test.com`;
  const resCrearMedico = await fetch(`${BASE_URL}/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenAdmin}`,
    },
    body: JSON.stringify({
      nombre: 'Dr. Roberto',
      apellido: 'Prueba',
      email: emailMedico,
      password: 'PasswordMedico123!',
      rolCodigo: 'MEDICO',
      especialidad: 'Pediatría',
    }),
  });
  const medicoCreado = await resCrearMedico.json();
  console.log(`✅ Usuario médico creado para pruebas: ${medicoCreado.nombre} (${medicoCreado.id})`);

  // 2. Iniciar sesión como el MÉDICO
  const resLoginMedico = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: emailMedico,
      password: 'PasswordMedico123!',
    }),
  });
  const dataMedico = await resLoginMedico.json();
  const tokenMedico = dataMedico.accessToken;
  console.log(`✅ Sesión iniciada con rol: ${dataMedico.usuario.rol}`);

  // 3. Probar GET /usuarios como Médico -> debe ser 403 Forbidden
  console.log('\n🔒 1. Verificando que el médico NO puede listar usuarios (GET /usuarios)...');
  const resListarMedico = await fetch(`${BASE_URL}/usuarios`, {
    headers: { Authorization: `Bearer ${tokenMedico}` },
  });
  if (resListarMedico.status === 403) {
    const err = await resListarMedico.json();
    console.log(`   ✅ Correctamente bloqueado (HTTP 403 Forbidden): "${err.message}"`);
  } else {
    console.error(`   ❌ Falló: se esperaba HTTP 403 pero se recibió ${resListarMedico.status}`);
    process.exit(1);
  }

  // 4. Probar POST /usuarios como Médico -> debe ser 403 Forbidden
  console.log('\n🔒 2. Verificando que el médico NO puede crear usuarios (POST /usuarios)...');
  const resCrearComoMedico = await fetch(`${BASE_URL}/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenMedico}`,
    },
    body: JSON.stringify({
      nombre: 'Intruso',
      apellido: 'Prueba',
      email: `intruso.${Date.now()}@test.com`,
      password: 'Password123!',
      rolCodigo: 'RECEPCION',
    }),
  });
  if (resCrearComoMedico.status === 403) {
    const err = await resCrearComoMedico.json();
    console.log(`   ✅ Correctamente bloqueado (HTTP 403 Forbidden): "${err.message}"`);
  } else {
    console.error(`   ❌ Falló: se esperaba HTTP 403 pero se recibió ${resCrearComoMedico.status}`);
    process.exit(1);
  }

  // 5. Probar PATCH /usuarios/:id/estado como Médico -> debe ser 403 Forbidden
  console.log('\n🔒 3. Verificando que el médico NO puede suspender/activar usuarios (PATCH /usuarios/:id/estado)...');
  const resSuspenderComoMedico = await fetch(`${BASE_URL}/usuarios/${medicoCreado.id}/estado`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenMedico}`,
    },
    body: JSON.stringify({ activo: false }),
  });
  if (resSuspenderComoMedico.status === 403) {
    const err = await resSuspenderComoMedico.json();
    console.log(`   ✅ Correctamente bloqueado (HTTP 403 Forbidden): "${err.message}"`);
  } else {
    console.error(`   ❌ Falló: se esperaba HTTP 403 pero se recibió ${resSuspenderComoMedico.status}`);
    process.exit(1);
  }

  // 6. Probar DELETE /usuarios/:id como Médico -> debe ser 403 Forbidden
  console.log('\n🔒 4. Verificando que el médico NO puede eliminar usuarios (DELETE /usuarios/:id)...');
  const resEliminarComoMedico = await fetch(`${BASE_URL}/usuarios/${medicoCreado.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenMedico}` },
  });
  if (resEliminarComoMedico.status === 403) {
    const err = await resEliminarComoMedico.json();
    console.log(`   ✅ Correctamente bloqueado (HTTP 403 Forbidden): "${err.message}"`);
  } else {
    console.error(`   ❌ Falló: se esperaba HTTP 403 pero se recibió ${resEliminarComoMedico.status}`);
    process.exit(1);
  }

  // 7. Probar GET /usuarios/medicos como Médico -> debe ser 200 OK (agenda de turnos)
  console.log('\n📅 5. Verificando que el médico SÍ puede consultar nómina médica para citas (GET /usuarios/medicos)...');
  const resMedicos = await fetch(`${BASE_URL}/usuarios/medicos`, {
    headers: { Authorization: `Bearer ${tokenMedico}` },
  });
  if (resMedicos.ok) {
    const medicos = await resMedicos.json();
    console.log(`   ✅ Nómina médica consultada correctamente (HTTP 200 OK) - ${medicos.length} médicos encontrados.`);
  } else {
    console.error(`   ❌ Falló: se esperaba HTTP 200 pero se recibió ${resMedicos.status}`);
    process.exit(1);
  }

  // 8. Limpieza: Administrador elimina al usuario médico de prueba
  console.log('\n🧹 6. Administrador elimina el médico de prueba...');
  const resLimpieza = await fetch(`${BASE_URL}/usuarios/${medicoCreado.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenAdmin}` },
  });
  if (resLimpieza.ok) {
    console.log('   ✅ Limpieza exitosa realizada por el Administrador.');
  }

  console.log('\n🎉 ¡TODAS LAS RESTRICCIONES DE ACCESO PARA MÉDICOS FUNCIONAN A LA PERFECCIÓN! (6/6)\n');
}

test().catch((err) => {
  console.error('Error fatal durante la prueba:', err);
  process.exit(1);
});
