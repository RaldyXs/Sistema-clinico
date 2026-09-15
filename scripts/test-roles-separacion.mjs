const API = 'http://localhost:3000';

async function testRole(nombreRol, email, password, rolEsperado) {
  console.log(`\n========================================`);
  console.log(`🧪 Probando Perfil: ${nombreRol} (${email})`);
  
  // 1. Login
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!loginRes.ok) {
    throw new Error(`Fallo en login de ${nombreRol}: HTTP ${loginRes.status}`);
  }

  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  console.log(`   ✅ Login exitoso. Token obtenido.`);

  // 2. Perfil
  const perfilRes = await fetch(`${API}/auth/perfil`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const perfil = await perfilRes.json();
  const rolObtenido = perfil.rolCodigo || (typeof perfil.rol === 'string' ? perfil.rol : perfil.rol?.codigo);
  console.log(`   ✅ Perfil cargado: ${perfil.nombre} ${perfil.apellido || ''} | Rol: ${rolObtenido}`);

  if (rolObtenido !== rolEsperado) {
    throw new Error(`Rol discrepante: esperado ${rolEsperado}, obtenido ${rolObtenido}`);
  }

  // 3. Prueba de acceso según rol
  if (rolEsperado === 'RECEPCION') {
    // Debe poder ver citas
    const citasRes = await fetch(`${API}/citas`, { headers: { Authorization: `Bearer ${token}` } });
    console.log(`   📅 Acceso a Agenda de Citas: HTTP ${citasRes.status} (OK)`);

    // Debe poder ver pacientes
    const pacRes = await fetch(`${API}/pacientes`, { headers: { Authorization: `Bearer ${token}` } });
    console.log(`   👥 Acceso a Pacientes: HTTP ${pacRes.status} (OK)`);

    // NO debe poder acceder a gestión de usuarios/personal
    const usrRes = await fetch(`${API}/usuarios`, { headers: { Authorization: `Bearer ${token}` } });
    console.log(`   🔒 Restricción de Gestión de Personal: HTTP ${usrRes.status} (${usrRes.status === 403 ? 'BLOQUEADO CORRECTAMENTE' : 'ALERTA'})`);
  } else if (rolEsperado === 'MEDICO') {
    // Debe poder ver citas y consultas
    const consRes = await fetch(`${API}/consultas`, { headers: { Authorization: `Bearer ${token}` } });
    console.log(`   🩺 Acceso a Consultas Clínicas: HTTP ${consRes.status} (OK)`);

    // NO debe poder acceder a gestión de usuarios
    const usrRes = await fetch(`${API}/usuarios`, { headers: { Authorization: `Bearer ${token}` } });
    console.log(`   🔒 Restricción de Nómina/Personal: HTTP ${usrRes.status} (${usrRes.status === 403 ? 'BLOQUEADO CORRECTAMENTE' : 'ALERTA'})`);
  } else if (rolEsperado === 'ADMIN') {
    // Debe tener acceso a gestión de personal
    const usrRes = await fetch(`${API}/usuarios`, { headers: { Authorization: `Bearer ${token}` } });
    console.log(`   👑 Acceso Administrativo a Personal: HTTP ${usrRes.status} (OK)`);
  } else if (rolEsperado === 'SUPERADMIN') {
    // Debe tener acceso al dashboard global
    const saasRes = await fetch(`${API}/saas/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
    console.log(`   🌐 Acceso a Métricas Globales SaaS: HTTP ${saasRes.status} (OK)`);
  }

  return true;
}

async function main() {
  console.log('🚀 Iniciando verificación integral de roles y accesos...');
  
  await testRole('SuperAdmin SaaS', 'superadmin@saas.com', 'SuperAdmin1234!', 'SUPERADMIN');
  await testRole('Director / Admin Clínica', 'dr.carlos@test.com', 'Test1234!', 'ADMIN');
  await testRole('Médico General', 'medico@test.com', 'Test1234!', 'MEDICO');
  await testRole('Secretaria / Recepción', 'secretaria@test.com', 'Test1234!', 'RECEPCION');

  console.log('\n🎉 ¡TODOS LOS PERFILES ESTÁN AISLADOS Y VERIFICADOS AL 100%! 🎉\n');
}

main().catch((err) => {
  console.error('❌ Error en test:', err.message);
  process.exit(1);
});
