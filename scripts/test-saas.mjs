import { spawn } from 'node:child_process';

const API_BASE = 'http://localhost:3000';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  console.log('🚀 Iniciando servidor de pruebas para Fase 10 (SaaS Global, Planes, Suscripciones y Onboarding)...');

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

  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`${API_BASE}/saas/planes`);
      if (res.status === 200) {
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

  console.log('\n🟢 Servidor en línea. Ejecutando suite de pruebas de SaaS Global...\n');

  try {
    // 1. Obtener catálogo público de planes
    const planesRes = await request('/saas/planes');
    if (planesRes.status !== 200 || !Array.isArray(planesRes.data) || planesRes.data.length < 3) {
      throw new Error(`Error obteniendo planes: ${JSON.stringify(planesRes.data)}`);
    }
    console.log(`✅ 1. Catálogo comercial de planes obtenido (${planesRes.data.length} planes disponibles: ${planesRes.data.map(p => p.codigo).join(', ')}).`);

    // 2. Onboarding público de nueva clínica
    const timestamp = Date.now();
    const emailAdmin = `admin.onboarding_${timestamp}@policlinica.com`;
    const onboardingRes = await request('/saas/onboarding', {
      method: 'POST',
      body: JSON.stringify({
        nombreConsultorio: `Policlínica Médica Central ${timestamp}`,
        telefono: '+1 809-555-0199',
        direccion: 'Av. Winston Churchill #102, Torre Médica',
        especialidadPrincipal: 'Poliespecialidades',
        adminNombre: 'Dr. Mateo',
        adminApellido: 'Vargas',
        adminEmail: emailAdmin,
        adminPassword: 'PasswordSeguro123!',
        planCodigo: 'PROFESIONAL',
        periodo: 'MENSUAL',
      }),
    });

    if (onboardingRes.status !== 201 || !onboardingRes.data.accessToken) {
      throw new Error(`Fallo en onboarding: ${JSON.stringify(onboardingRes.data)}`);
    }
    const tokenNuevoTenant = onboardingRes.data.accessToken;
    const nuevoTenantId = onboardingRes.data.consultorio.id;
    console.log(`✅ 2. Onboarding público exitoso: "${onboardingRes.data.consultorio.nombre}" aprovisionada con Plan ${onboardingRes.data.plan.nombre}.`);

    // 3. Consulta de Suscripción y Cuotas de Consumo
    const miSubRes = await request('/saas/mi-suscripcion', {
      headers: { Authorization: `Bearer ${tokenNuevoTenant}` },
    });
    if (miSubRes.status !== 200 || !miSubRes.data.consumo) {
      throw new Error(`Error en mi-suscripcion: ${JSON.stringify(miSubRes.data)}`);
    }
    console.log(`✅ 3. Suscripción y cuotas validadas: Estado ${miSubRes.data.suscripcion.estado}, Médicos: ${miSubRes.data.consumo.medicos.actual}/${miSubRes.data.consumo.medicos.maximo}, ${miSubRes.data.suscripcion.diasRestantes} días restantes.`);

    // 4. Upgrade de Plan (Cambiar a ENTERPRISE)
    const upgradeRes = await request('/saas/cambiar-plan', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenNuevoTenant}` },
      body: JSON.stringify({
        planCodigo: 'ENTERPRISE',
        periodo: 'ANUAL',
      }),
    });
    if (upgradeRes.status !== 200 || upgradeRes.data.plan.codigo !== 'ENTERPRISE') {
      throw new Error(`Error en upgrade de plan: ${JSON.stringify(upgradeRes.data)}`);
    }
    console.log(`✅ 4. Ascenso a Plan Enterprise exitoso: Capacidad ampliada a ${upgradeRes.data.plan.maxMedicos} médicos y ${upgradeRes.data.plan.maxPacientes} pacientes.`);

    // 5. Login previo con usuario Admin existente (Dr. Carlos)
    const loginCarlos = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'dr.carlos@test.com', password: 'Test1234!' }),
    });
    const tokenCarlos = loginCarlos.data.accessToken;

    // 6. SuperAdmin: Dashboard Global Consolidado
    const globalDashRes = await request('/saas/dashboard', {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    if (globalDashRes.status !== 200 || typeof globalDashRes.data.metricas.totalConsultorios !== 'number') {
      throw new Error(`Error en dashboard global: ${JSON.stringify(globalDashRes.data)}`);
    }
    const m = globalDashRes.data.metricas;
    console.log(`✅ 5. Dashboard SuperAdmin obtenido: ${m.totalConsultorios} clínicas registradas, ${m.totalMedicos} médicos, MRR estimado: $${m.mrrEstimado}.`);

    // 7. SuperAdmin: Directorio Maestro de Consultorios
    const consultoriosRes = await request('/saas/consultorios', {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    if (consultoriosRes.status !== 200 || !Array.isArray(consultoriosRes.data) || consultoriosRes.data.length < 2) {
      throw new Error(`Error en listado maestro de consultorios: ${JSON.stringify(consultoriosRes.data)}`);
    }
    console.log(`✅ 6. Directorio maestro de consultorios consultado (${consultoriosRes.data.length} clínicas listadas con sus respectivos planes y cuotas).`);

    // 8. SuperAdmin: Suspensión de Consultorio (Soft-lock)
    const suspenderRes = await request(`/saas/consultorios/${nuevoTenantId}/estado`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenCarlos}` },
      body: JSON.stringify({ activo: false }),
    });
    if (suspenderRes.status !== 200 || suspenderRes.data.consultorio.activo !== false) {
      throw new Error(`Error suspendiendo consultorio: ${JSON.stringify(suspenderRes.data)}`);
    }

    // Verificar que el usuario del consultorio suspendido no pueda loguearse
    const loginBloqueado = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: emailAdmin, password: 'PasswordSeguro123!' }),
    });
    if (loginBloqueado.status !== 401) {
      throw new Error(`Fallo de seguridad: Usuario de clínica suspendida pudo ingresar (HTTP ${loginBloqueado.status})`);
    }
    console.log('✅ 7. Suspensión de tenant validada: Acceso bloqueado con HTTP 401 ("Consultorio suspendido").');

    // 9. SuperAdmin: Reactivación de Consultorio
    const reactivarRes = await request(`/saas/consultorios/${nuevoTenantId}/estado`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenCarlos}` },
      body: JSON.stringify({ activo: true }),
    });
    if (reactivarRes.status !== 200 || reactivarRes.data.consultorio.activo !== true) {
      throw new Error(`Error reactivando consultorio: ${JSON.stringify(reactivarRes.data)}`);
    }

    // Verificar que ahora sí pueda ingresar
    const loginReactivado = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: emailAdmin, password: 'PasswordSeguro123!' }),
    });
    if (loginReactivado.status !== 200 || !loginReactivado.data.accessToken) {
      throw new Error(`Fallo al ingresar tras reactivación: ${JSON.stringify(loginReactivado.data)}`);
    }
    console.log('✅ 8. Reactivación de tenant validada: Acceso restaurado exitosamente.');

    console.log('\n🎉 ¡TODAS LAS 8 PRUEBAS DE FASE 10 (SAAS GLOBAL, PLANES, SUSCRIPCIONES Y ONBOARDING) PASARON CON ÉXITO!');
  } finally {
    console.log('\n🛑 Deteniendo servidor de pruebas...');
    server.kill();
  }
}

main().catch((err) => {
  console.error('\n❌ ERROR FATAL EN PRUEBAS SAAS:', err.message);
  process.exit(1);
});
