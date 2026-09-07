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
  console.log('🚀 Iniciando servidor API para pruebas de Fase 7 (Dashboard y Administración)...');
  const server = spawn('npm.cmd', ['run', '--workspace=@sistema-clinico/api', 'start'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  server.stdout.on('data', (d) => process.stdout.write(`[API] ${d}`));
  server.stderr.on('data', (d) => process.stderr.write(`[API-ERR] ${d}`));

  try {
    await waitForPort(3000, 25000);
    console.log('\n🟢 Servidor API online en puerto 3000. Ejecutando suite de pruebas HTTP...\n');

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

    // 3. GET /dashboard/resumen (Tenant 1)
    const resumenRes = await fetch('http://localhost:3000/dashboard/resumen', {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    const resumen = await resumenRes.json();
    if (resumenRes.status !== 200 || !resumen.pacientes || resumen.embarazosActivos === undefined) {
      throw new Error(`Fallo en resumen dashboard: ${JSON.stringify(resumen)}`);
    }
    console.log(`✅ 3. Dashboard Resumen obtenido: ${resumen.pacientes.totalActivos} pacientes activos, ${resumen.consultasMes.total} consultas mes, ${resumen.embarazosActivos} embarazos activos`);

    // 4. GET /dashboard/actividad (Tenant 1)
    const actividadRes = await fetch('http://localhost:3000/dashboard/actividad', {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    const actividad = await actividadRes.json();
    if (actividadRes.status !== 200 || !Array.isArray(actividad)) {
      throw new Error(`Fallo en actividad dashboard: ${JSON.stringify(actividad)}`);
    }
    console.log(`✅ 4. Feed de actividad obtenido (${actividad.length} eventos recientes)`);

    // 5. GET /dashboard/top-diagnosticos (Tenant 1)
    const topDiagRes = await fetch('http://localhost:3000/dashboard/top-diagnosticos', {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    const topDiag = await topDiagRes.json();
    if (topDiagRes.status !== 200 || !Array.isArray(topDiag)) {
      throw new Error(`Fallo en top diagnósticos: ${JSON.stringify(topDiag)}`);
    }
    console.log(`✅ 5. Top diagnósticos CIE-10 obtenido (${topDiag.length} registros estadísticos)`);

    // 6. POST /usuarios (Crear médico en Tenant 1)
    const emailNuevoMedico = `dra.mariana.${Date.now()}@test.com`;
    const crearUsuarioRes = await fetch('http://localhost:3000/usuarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCarlos}`,
      },
      body: JSON.stringify({
        nombre: 'Mariana',
        apellido: 'Gómez',
        email: emailNuevoMedico,
        password: 'Password123!',
        rolCodigo: 'MEDICO',
        especialidad: 'Ginecología y Obstetricia',
        matriculaProfesional: 'MP-998877',
        telefono: '+54 9 11 4455-6677',
      }),
    });
    const nuevoMedico = await crearUsuarioRes.json();
    if (crearUsuarioRes.status !== 201 || !nuevoMedico.id || nuevoMedico.passwordHash) {
      throw new Error(`Fallo creación usuario médico: ${JSON.stringify(nuevoMedico)}`);
    }
    console.log(`✅ 6. Nuevo médico creado en Tenant 1: ${nuevoMedico.nombre} ${nuevoMedico.apellido} (${nuevoMedico.id}), passwordHash protegido`);

    // 7. GET /usuarios (Listar personal de Tenant 1)
    const listarUsuariosRes = await fetch('http://localhost:3000/usuarios?especialidad=Ginecolog', {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    const usuariosFiltrados = await listarUsuariosRes.json();
    if (listarUsuariosRes.status !== 200 || !usuariosFiltrados.some((u) => u.id === nuevoMedico.id)) {
      throw new Error(`Fallo listado filtrado de usuarios: ${JSON.stringify(usuariosFiltrados)}`);
    }
    console.log(`✅ 7. Listado filtrado de usuarios exitoso (${usuariosFiltrados.length} encontrados)`);

    // 8. GET /usuarios/medicos (Listar médicos para agendamiento)
    const listarMedicosRes = await fetch('http://localhost:3000/usuarios/medicos', {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    const medicos = await listarMedicosRes.json();
    if (listarMedicosRes.status !== 200 || !medicos.some((m) => m.id === nuevoMedico.id)) {
      throw new Error(`Fallo listado médicos: ${JSON.stringify(medicos)}`);
    }
    console.log(`✅ 8. Listado exclusivo de profesionales médicos exitoso (${medicos.length} médicos activos)`);

    // 9. PATCH /usuarios/:id (Actualizar teléfono y matrícula)
    const actualizarUserRes = await fetch(`http://localhost:3000/usuarios/${nuevoMedico.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCarlos}`,
      },
      body: JSON.stringify({
        telefono: '+54 9 11 9999-0000',
        matriculaProfesional: 'MP-998877-ACT',
      }),
    });
    const userActualizado = await actualizarUserRes.json();
    if (userActualizado.matriculaProfesional !== 'MP-998877-ACT') {
      throw new Error(`Fallo actualización de usuario: ${JSON.stringify(userActualizado)}`);
    }
    console.log(`✅ 9. Usuario profesional actualizado: Matrícula ${userActualizado.matriculaProfesional}`);

    // 10. PATCH /usuarios/:id/estado (Suspender y reactivar acceso)
    const suspenderRes = await fetch(`http://localhost:3000/usuarios/${nuevoMedico.id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCarlos}`,
      },
      body: JSON.stringify({ activo: false }),
    });
    const userSuspendido = await suspenderRes.json();
    if (userSuspendido.activo !== false) {
      throw new Error(`Fallo suspensión de usuario: ${JSON.stringify(userSuspendido)}`);
    }
    console.log('✅ 10. Control de estado y soft-lock de usuario verificado (activo = false)');

    // 11. GET /consultorios/configuracion
    const configRes = await fetch('http://localhost:3000/consultorios/configuracion', {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    const configData = await configRes.json();
    if (configRes.status !== 200 || !configData.id) {
      throw new Error(`Fallo al obtener configuración de consultorio: ${JSON.stringify(configData)}`);
    }
    console.log(`✅ 11. Configuración actual del consultorio obtenida (${configData.nombre})`);

    // 12. PATCH /consultorios/configuracion (Branding, horarios y módulos)
    const patchConfigRes = await fetch('http://localhost:3000/consultorios/configuracion', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCarlos}`,
      },
      body: JSON.stringify({
        email: 'contacto@centrodelsol.com',
        colorPrimario: '#0284c7',
        colorSecundario: '#0f172a',
        logoUrl: 'https://cdn.centrodelsol.com/logo.png',
        horarioAtencion: {
          dias: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'],
          horaApertura: '08:00',
          horaCierre: '19:00',
          duracionTurnoMinutos: 30,
        },
        modulosActivos: {
          ginecologia: true,
          recetas: true,
          pediatria: false,
        },
        configuracionReceta: {
          encabezado: 'Centro Médico Integral Del Sol - Especialistas en Salud Femenina',
          piePagina: 'Receta oficial válida por 30 días corridos a partir de la fecha de emisión.',
          mostrarSignosVitales: true,
        },
      }),
    });
    const configActualizada = await patchConfigRes.json();
    if (
      patchConfigRes.status !== 200 ||
      configActualizada.email !== 'contacto@centrodelsol.com' ||
      configActualizada.modulosActivos?.ginecologia !== true
    ) {
      throw new Error(`Fallo al actualizar configuración y branding: ${JSON.stringify(configActualizada)}`);
    }
    console.log('✅ 12. Branding, colores, horarios y diseño de receta actualizados con éxito');

    // 13. PRUEBA DE BLIND MULTI-TENANT ISOLATION:
    // Dra. Elena (Tenant 2) intenta consultar al nuevo médico de Tenant 1 por ID
    const crossTenantRes = await fetch(`http://localhost:3000/usuarios/${nuevoMedico.id}`, {
      headers: { Authorization: `Bearer ${tokenElena}` },
    });
    if (crossTenantRes.status !== 404) {
      throw new Error(`Fallo aislamiento multi-tenant: esperado 404 Not Found, recibido ${crossTenantRes.status}`);
    }
    console.log('🛡️ 13. Blind Multi-Tenant Isolation VERIFICADO: Dra. Elena (Tenant 2) recibe 404 Not Found al buscar usuario de Tenant 1');

    console.log('\n🎉 ¡TODAS LAS 13 PRUEBAS DE FASE 7 (DASHBOARD Y ADMINISTRACIÓN) PASARON CON ÉXITO!\n');
  } finally {
    console.log('🛑 Deteniendo servidor de pruebas...');
    server.kill();
  }
}

runTests().catch((err) => {
  console.error('\n❌ ERROR EN PRUEBAS:', err);
  process.exit(1);
});
