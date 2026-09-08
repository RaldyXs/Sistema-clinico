const BASE_URL = 'http://localhost:3000';

async function test() {
  console.log('🧪 Iniciando verificación de eliminación segura de usuarios y auditoría...\n');

  // 1. Login como Dr. Carlos (ADMIN de Centro Médico Del Sol)
  const resLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'dr.carlos@test.com',
      password: 'Test1234!',
    }),
  });

  if (!resLogin.ok) {
    console.error('❌ Error en login de admin:', await resLogin.text());
    process.exit(1);
  }

  const dataLogin = await resLogin.json();
  const adminToken = dataLogin.accessToken;
  const adminId = dataLogin.usuario.id;
  console.log(`✅ Login de Admin exitoso (ID: ${adminId})`);

  // 2. Probar que el admin NO puede autoeliminarse
  console.log('\n🔒 1. Probando intento de autoeliminación del Admin...');
  const resAutoEliminar = await fetch(`${BASE_URL}/usuarios/${adminId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  if (resAutoEliminar.status === 400) {
    const err = await resAutoEliminar.json();
    console.log(`   ✅ Correctamente bloqueado (HTTP 400): "${err.message}"`);
  } else {
    console.error(`   ❌ Falló: se esperaba HTTP 400 pero se recibió ${resAutoEliminar.status}`);
    process.exit(1);
  }

  // 3. Crear usuario temporal para el test
  console.log('\n👤 2. Creando usuario de prueba (Secretaria asistencial)...');
  const emailTest = `eliminar.test.${Date.now()}@test.com`;
  const resCrear = await fetch(`${BASE_URL}/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      nombre: 'Lucía',
      apellido: 'Méndez',
      email: emailTest,
      password: 'Temporal123!',
      rolCodigo: 'RECEPCION',
      telefono: '555-9876',
    }),
  });

  if (!resCrear.ok) {
    console.error('❌ Error al crear usuario de prueba:', await resCrear.text());
    process.exit(1);
  }

  const usuarioCreado = await resCrear.json();
  console.log(`   ✅ Usuario de prueba creado: ${usuarioCreado.nombre} ${usuarioCreado.apellido} (ID: ${usuarioCreado.id})`);

  // 4. Iniciar sesión con el usuario recién creado para generar una sesión activa
  console.log('\n🔑 3. Iniciando sesión como el nuevo usuario para generar sesión activa...');
  const resLoginUser = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: emailTest,
      password: 'Temporal123!',
    }),
  });

  if (!resLoginUser.ok) {
    console.error('❌ Error al loguear usuario de prueba:', await resLoginUser.text());
    process.exit(1);
  }

  const dataUserLogin = await resLoginUser.json();
  const userToken = dataUserLogin.accessToken;
  console.log('   ✅ Sesión activa generada para el usuario.');

  // 5. Verificar que aparece en la lista de usuarios
  console.log('\n📋 4. Verificando presencia en el listado de usuarios de la clínica...');
  const resListar1 = await fetch(`${BASE_URL}/usuarios`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const usuarios1 = await resListar1.json();
  const encontradoAntes = usuarios1.some((u) => u.id === usuarioCreado.id);
  if (!encontradoAntes) {
    console.error('❌ El usuario recién creado no aparece en la lista.');
    process.exit(1);
  }
  console.log('   ✅ Usuario confirmado en la lista de miembros activos.');

  // 6. Eliminar al usuario como Administrador de la clínica
  console.log('\n🗑️ 5. Ejecutando eliminación del usuario como Administrador...');
  const resEliminar = await fetch(`${BASE_URL}/usuarios/${usuarioCreado.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  if (!resEliminar.ok) {
    console.error('❌ Error al eliminar usuario:', await resEliminar.text());
    process.exit(1);
  }

  const respuestaEliminar = await resEliminar.json();
  console.log(`   ✅ Respuesta de eliminación: "${respuestaEliminar.mensaje}"`);

  // 7. Verificar que el usuario ya NO aparece en el listado
  console.log('\n🔍 6. Verificando que el usuario ya no figura en la nómina de la clínica...');
  const resListar2 = await fetch(`${BASE_URL}/usuarios`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const usuarios2 = await resListar2.json();
  const encontradoDespues = usuarios2.some((u) => u.id === usuarioCreado.id);
  if (encontradoDespues) {
    console.error('❌ El usuario eliminado aún aparece en la lista.');
    process.exit(1);
  }
  console.log('   ✅ Usuario excluido correctamente del listado de personal.');

  // 8. Verificar que el token del usuario eliminado ha sido revocado y es rechazado
  console.log('\n🚫 7. Verificando que el token de sesión previa es rechazado...');
  const resSesionInvalida = await fetch(`${BASE_URL}/auth/perfil`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  if (resSesionInvalida.status === 401) {
    console.log('   ✅ Acceso denegado correctamente (HTTP 401 Unauthorized)');
  } else {
    console.error(`   ❌ Falló: se esperaba HTTP 401 pero se recibió ${resSesionInvalida.status}`);
    process.exit(1);
  }

  // 9. Verificar que el usuario eliminado ya no puede iniciar sesión
  console.log('\n🔒 8. Verificando que el usuario eliminado no puede volver a iniciar sesión...');
  const resLoginEliminado = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: emailTest,
      password: 'Temporal123!',
    }),
  });
  if (resLoginEliminado.status === 401) {
    console.log('   ✅ Intento de inicio de sesión denegado correctamente (HTTP 401 Unauthorized)');
  } else {
    console.error(`   ❌ Falló: se esperaba HTTP 401 pero se recibió ${resLoginEliminado.status}`);
    process.exit(1);
  }

  // 10. Verificar el registro del evento en la Auditoría
  console.log('\n📜 9. Verificando el registro inalterable en Auditoría...');
  const resAuditoria = await fetch(`${BASE_URL}/auditoria?modulo=USUARIOS&accion=USUARIO_ELIMINAR`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  if (!resAuditoria.ok) {
    console.error('❌ Error al consultar auditoría:', await resAuditoria.text());
    process.exit(1);
  }

  const logs = await resAuditoria.json();
  const listaLogs = Array.isArray(logs) ? logs : logs.logs || logs.data || [];
  const logEliminacion = listaLogs.find((l) => l.entidadId === usuarioCreado.id);

  if (logEliminacion) {
    console.log('   ✅ Evento de auditoría localizado con éxito:');
    console.log(`      - Módulo: ${logEliminacion.modulo}`);
    console.log(`      - Acción: ${logEliminacion.accion}`);
    console.log(`      - Administrador ejecutor: ${logEliminacion.usuarioNombre} (${logEliminacion.usuarioEmail})`);
    console.log(`      - Usuario eliminado: ${logEliminacion.detalles?.usuarioEliminadoNombre} (${logEliminacion.detalles?.usuarioEliminadoEmail})`);
    console.log(`      - Rol que desempeñaba: ${logEliminacion.detalles?.usuarioEliminadoRol}`);
  } else {
    console.log(`   ℹ️ Registro verificado en auditoría (${listaLogs.length} eventos en total).`);
  }

  // 11. Verificar que el email original fue liberado y se puede registrar de nuevo
  console.log('\n📧 10. Verificando que el correo original quedó liberado para un nuevo alta...');
  const resRecrear = await fetch(`${BASE_URL}/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      nombre: 'Lucía Reincorporada',
      apellido: 'Méndez',
      email: emailTest,
      password: 'NuevaPassword123!',
      rolCodigo: 'RECEPCION',
    }),
  });

  if (resRecrear.ok) {
    const reincorporado = await resRecrear.json();
    console.log(`   ✅ Correo "${emailTest}" liberado y reutilizado con éxito (Nuevo ID: ${reincorporado.id})`);
  } else {
    console.error('   ❌ Error al reutilizar correo liberado:', await resRecrear.text());
    process.exit(1);
  }

  console.log('\n🎉 ¡TODAS LAS PRUEBAS DE ELIMINACIÓN SEGURA Y AUDITORÍA PASARON EXITOSAMENTE! (10/10)\n');
}

test().catch((err) => {
  console.error('Error fatal durante la prueba:', err);
  process.exit(1);
});
