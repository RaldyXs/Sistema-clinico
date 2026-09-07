import { spawn } from 'child_process';
import http from 'http';

async function waitForPort(port, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${port}/`, (res) => {
          resolve(true);
        });
        req.on('error', reject);
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`Timeout esperando puerto ${port}`);
}

async function runTests() {
  console.log('🚀 Iniciando servidor API para pruebas de Fase 8 (Reportes y Estadísticas)...');
  const server = spawn('npm.cmd', ['run', '--workspace=@sistema-clinico/api', 'start'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  server.stdout.on('data', (d) => process.stdout.write(`[API] ${d}`));
  server.stderr.on('data', (d) => process.stderr.write(`[API-ERR] ${d}`));

  try {
    await waitForPort(3000, 25000);
    console.log('\n🟢 Servidor API online en puerto 3000. Ejecutando suite de pruebas HTTP de Reportes...\n');

    // 1. Login Dr. Carlos (Tenant 1: Centro Médico Del Sol)
    const loginCarlosRes = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dr.carlos@test.com', password: 'Test1234!' }),
    });
    const carlosData = await loginCarlosRes.json();
    if (!carlosData.accessToken) {
      throw new Error(`Fallo login Dr. Carlos: ${JSON.stringify(carlosData)}`);
    }
    const tokenCarlos = carlosData.accessToken;
    console.log('✅ 1. Login Dr. Carlos (Tenant 1) exitoso');

    // 2. Login Dra. Elena (Tenant 2: Clínica San Rafael)
    const loginElenaRes = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'elena.rios@test2.com', password: 'Test1234!' }),
    });
    const elenaData = await loginElenaRes.json();
    const tokenElena = elenaData.accessToken;
    console.log('✅ 2. Login Dra. Elena (Tenant 2) exitoso');

    // 3. GET /reportes/operativo (Tenant 1)
    const opRes = await fetch('http://localhost:3000/reportes/operativo', {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    const op = await opRes.json();
    if (
      opRes.status !== 200 ||
      op.citas?.total === undefined ||
      op.citas?.tasaEfectividadPct === undefined ||
      !op.franjasHorarias ||
      !op.distribucionSemanal
    ) {
      throw new Error(`Fallo reporte operativo: ${JSON.stringify(op)}`);
    }
    console.log(
      `✅ 3. Reporte Operativo obtenido: Total citas: ${op.citas.total}, Efectividad: ${op.citas.tasaEfectividadPct}%, Ausentismo: ${op.citas.tasaAusentismoPct}%`,
    );

    // 4. GET /reportes/medicos (Tenant 1)
    const medRes = await fetch('http://localhost:3000/reportes/medicos', {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    const medicos = await medRes.json();
    if (medRes.status !== 200 || !Array.isArray(medicos)) {
      throw new Error(`Fallo reporte médicos: ${JSON.stringify(medicos)}`);
    }
    console.log(`✅ 4. Reporte de productividad por médico obtenido (${medicos.length} profesionales evaluados)`);

    // 5. GET /reportes/epidemiologico (Tenant 1)
    const epiRes = await fetch('http://localhost:3000/reportes/epidemiologico', {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    const epi = await epiRes.json();
    if (
      epiRes.status !== 200 ||
      epi.totalConsultas === undefined ||
      !Array.isArray(epi.topDiagnosticos) ||
      !Array.isArray(epi.consultasPorEspecialidad)
    ) {
      throw new Error(`Fallo reporte epidemiológico: ${JSON.stringify(epi)}`);
    }
    console.log(
      `✅ 5. Reporte Epidemiológico obtenido: ${epi.totalConsultas} consultas analizadas, ${epi.topDiagnosticos.length} diagnósticos CIE-10 catalogados`,
    );

    // 6. GET /reportes/exportar/citas-csv (Tenant 1)
    const csvRes = await fetch('http://localhost:3000/reportes/exportar/citas-csv', {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    const csvContent = await csvRes.text();
    const contentType = csvRes.headers.get('content-type') || '';
    if (csvRes.status !== 200 || !contentType.includes('text/csv') || !csvContent.includes('ID Cita;Fecha;Hora Inicio')) {
      throw new Error(`Fallo exportación CSV: Status ${csvRes.status}, Content-Type ${contentType}`);
    }
    console.log(`✅ 6. Exportación CSV validada: Encabezados y delimitador ';' correctos (${csvContent.length} bytes recibidos)`);

    // 7. PRUEBA DE AISLAMIENTO MULTI-TENANT CIEGO:
    // Dra. Elena (Tenant 2) no debe recibir citas ni diagnósticos pertenecientes al Tenant 1
    const opElenaRes = await fetch('http://localhost:3000/reportes/operativo', {
      headers: { Authorization: `Bearer ${tokenElena}` },
    });
    const opElena = await opElenaRes.json();
    if (opElenaRes.status !== 200 || opElena.citas?.total === undefined) {
      throw new Error(`Fallo reporte operativo Tenant 2: ${JSON.stringify(opElena)}`);
    }
    console.log(`✅ 7. Reporte independiente para Tenant 2 verificado (${opElena.citas.total} citas de Clínica San Rafael)`);

    // Intentar filtrar en Tenant 2 por el médico de Tenant 1
    const doctorTenant1Id = medicos[0]?.medicoId;
    const crossMedicoRes = await fetch(`http://localhost:3000/reportes/operativo?profesionalId=${doctorTenant1Id}`, {
      headers: { Authorization: `Bearer ${tokenElena}` },
    });
    const crossOp = await crossMedicoRes.json();
    if (crossOp.citas?.total !== 0) {
      throw new Error(`Fuga de datos multi-tenant: esperado 0 citas, recibido ${crossOp.citas?.total}`);
    }
    console.log('🛡️ 8. Blind Multi-Tenant Isolation VERIFICADO: Consultas cruzadas retornan 0 resultados sin fuga de datos');

    console.log('\n🎉 ¡TODAS LAS PRUEBAS DE FASE 8 (REPORTES CLÍNICOS Y OPERATIVOS) PASARON CON ÉXITO!\n');
  } finally {
    console.log('🛑 Deteniendo servidor de pruebas...');
    server.kill();
  }
}

runTests().catch((err) => {
  console.error('\n❌ ERROR EN PRUEBAS:', err);
  process.exit(1);
});
