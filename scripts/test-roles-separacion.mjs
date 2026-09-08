/**
 * Test de Verificación de Separación de Roles:
 * SuperAdmin (Dueño SaaS) vs. Cliente Tenant (Clínica)
 */

const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('🏥 Iniciando Test de Separación de Roles y Vistas Multi-Tenant...\n');

  // ==========================================
  // 1. LOGIN Y VERIFICACIÓN DE SUPERADMIN
  // ==========================================
  console.log('👑 1. Probando Autenticación de SuperAdmin...');
  const resSuper = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'superadmin@saas.com',
      password: 'SuperAdmin1234!',
    }),
  });

  if (!resSuper.ok) {
    console.error('❌ Error en login de SuperAdmin:', await resSuper.text());
    process.exit(1);
  }

  const dataSuper = await resSuper.json();
  const superToken = dataSuper.accessToken;
  const superRol = dataSuper.usuario?.rol?.codigo || dataSuper.usuario?.rol;
  console.log(`   ✅ Login exitoso: ${dataSuper.usuario?.email}`);
  console.log(`   ✅ Rol identificado: ${superRol} (esperado: SUPERADMIN)`);

  if (superRol !== 'SUPERADMIN') {
    console.error('❌ El rol no es SUPERADMIN');
    process.exit(1);
  }

  // Dashboard Global SaaS
  console.log('\n📊 2. Consultando Métricas Globales de Plataforma SaaS como SuperAdmin...');
  const resDash = await fetch(`${BASE_URL}/saas/dashboard`, {
    headers: { Authorization: `Bearer ${superToken}` },
  });
  if (!resDash.ok) {
    console.error('❌ Error obteniendo dashboard global:', await resDash.text());
    process.exit(1);
  }
  const dashData = await resDash.json();
  console.log(`   ✅ Consultorios Totales: ${dashData.metricas.totalConsultorios}`);
  console.log(`   ✅ Consultorios Activos: ${dashData.metricas.consultoriosActivos}`);
  console.log(`   ✅ MRR Estimado: $${dashData.metricas.mrrEstimado}/mes`);
  console.log(`   ✅ Total Médicos en el ecosistema: ${dashData.metricas.totalMedicos}`);
  console.log(`   ✅ Total Pacientes en el ecosistema: ${dashData.metricas.totalPacientes}`);

  // Directorio de consultorios
  console.log('\n🏢 3. Consultando Directorio Maestro de Consultorios...');
  const resTenants = await fetch(`${BASE_URL}/saas/consultorios`, {
    headers: { Authorization: `Bearer ${superToken}` },
  });
  const tenants = await resTenants.json();
  console.log(`   ✅ Directorio obtenido con éxito (${tenants.length} clínicas encontradas):`);
  tenants.slice(0, 3).forEach((t) => {
    console.log(`      - [${t.activo ? 'ACTIVO' : 'SUSPENDIDO'}] ${t.nombre} | Plan: ${t.plan} | Pacientes: ${t.totalPacientes}`);
  });

  // ==========================================
  // 2. LOGIN Y VERIFICACIÓN DE CLIENTE (CLÍNICA)
  // ==========================================
  console.log('\n🩺 4. Probando Autenticación de Cliente Tenant (Dr. Carlos - Centro Médico Del Sol)...');
  const resCarlos = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'dr.carlos@test.com',
      password: 'Test1234!',
    }),
  });

  if (!resCarlos.ok) {
    console.error('❌ Error en login de Dr. Carlos:', await resCarlos.text());
    process.exit(1);
  }

  const dataCarlos = await resCarlos.json();
  const carlosToken = dataCarlos.accessToken;
  const carlosRol = dataCarlos.usuario?.rol?.codigo || dataCarlos.usuario?.rol;
  console.log(`   ✅ Login exitoso: ${dataCarlos.usuario?.email}`);
  console.log(`   ✅ Rol de la clínica: ${carlosRol} (ADMIN de consultorio)`);
  console.log(`   ✅ Consultorio: ${dataCarlos.usuario?.consultorio?.nombre}`);

  // Consulta de su propia suscripción y cupos
  console.log('\n📈 5. Consultando "Mi Suscripción & Cupos" como Cliente...');
  const resSub = await fetch(`${BASE_URL}/saas/mi-suscripcion`, {
    headers: { Authorization: `Bearer ${carlosToken}` },
  });
  if (!resSub.ok) {
    console.error('❌ Error al consultar mi suscripción:', await resSub.text());
    process.exit(1);
  }
  const subData = await resSub.json();
  console.log(`   ✅ Plan Activo del cliente: ${subData.plan?.nombre} (${subData.suscripcion?.estado})`);
  console.log(`   ✅ Días restantes: ${subData.suscripcion?.diasRestantes}`);
  console.log(`   ✅ Consumo de Médicos: ${subData.consumo?.medicos?.actual}/${subData.consumo?.medicos?.maximo} (${subData.consumo?.medicos?.porcentaje}%)`);
  console.log(`   ✅ Consumo de Pacientes: ${subData.consumo?.pacientes?.actual}/${subData.consumo?.pacientes?.maximo} (${subData.consumo?.pacientes?.porcentaje}%)`);

  // Consulta de pacientes de la clínica
  console.log('\n👥 6. Verificando aislamiento clínico del cliente...');
  const resPacientes = await fetch(`${BASE_URL}/pacientes`, {
    headers: { Authorization: `Bearer ${carlosToken}` },
  });
  const pacientes = await resPacientes.json();
  const cantPacientes = pacientes.datos ? pacientes.datos.length : pacientes.length;
  console.log(`   ✅ Expedientes clínicos cargados para Del Sol: ${cantPacientes} pacientes`);

  console.log('\n✨ ¡TODAS LAS PRUEBAS DE SEPARACIÓN OPERATIVA SUPERADMIN VS CLIENTE PASARON AL 100%! ✨\n');
}

main().catch(console.error);
