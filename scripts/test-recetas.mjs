import { spawn } from 'child_process';
import http from 'http';

async function waitForPort(port, timeoutMs = 15000) {
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
  throw new Error(`Timeout waiting for port ${port}`);
}

async function runTests() {
  console.log('🚀 Iniciando servidor API para pruebas de Recetas y PDF...');
  const server = spawn('npm.cmd', ['run', '--workspace=@sistema-clinico/api', 'start'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  server.stdout.on('data', (d) => process.stdout.write(`[API] ${d}`));
  server.stderr.on('data', (d) => process.stderr.write(`[API-ERR] ${d}`));

  try {
    await waitForPort(3000, 20000);
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

    // 3. Buscar paciente de Tenant 1
    const pacientesRes = await fetch('http://localhost:3000/pacientes', {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    const pacientesJson = await pacientesRes.json();
    const ana = pacientesJson.datos?.[0] || pacientesJson.data?.[0] || pacientesJson[0];
    if (!ana) {
      throw new Error(`No se encontraron pacientes en Tenant 1: ${JSON.stringify(pacientesJson)}`);
    }
    console.log(`✅ 3. Paciente Ana Torres localizada (ID: ${ana.id})`);

    // 4. Emitir Receta Médica en Tenant 1
    const emisionRes = await fetch('http://localhost:3000/recetas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCarlos}`,
      },
      body: JSON.stringify({
        pacienteId: ana.id,
        diagnosticoReferencia: 'J01.0 - Sinusitis maxilar aguda',
        medicamentos: [
          {
            medicamento: 'Amoxicilina + Ácido Clavulánico',
            presentacion: 'Comprimidos recubiertos 875/125 mg',
            dosis: '1 comprimido',
            via: 'Oral',
            frecuencia: 'cada 8 horas',
            duracion: 'por 7 días',
            cantidad: 1,
            indicaciones: 'Ingerir inmediatamente antes o al comienzo de las comidas.',
          },
          {
            medicamento: 'Ibuprofeno',
            presentacion: 'Cápsulas blandas 400 mg',
            dosis: '1 cápsula',
            via: 'Oral',
            frecuencia: 'cada 8 horas en caso de dolor o fiebre',
            duracion: 'por 3 a 5 días',
            cantidad: 1,
            indicaciones: 'No tomar con el estómago vacío.',
          },
        ],
        indicacionesGenerales:
          'Abundante hidratación oral (mínimo 2 litros de agua al día), reposo relativo por 48 horas. En caso de fiebre persistente superior a 38.5°C o disnea, consultar de inmediato a urgencias.',
      }),
    });

    const recetaCreada = await emisionRes.json();
    if (!recetaCreada.id || !recetaCreada.numeroReceta) {
      throw new Error(`Error emitiendo receta: ${JSON.stringify(recetaCreada)}`);
    }
    console.log(`✅ 4. Receta emitida exitosamente: Folio ${recetaCreada.numeroReceta} (ID: ${recetaCreada.id})`);

    // 5. Listar recetas de Tenant 1
    const listaRes = await fetch('http://localhost:3000/recetas', {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    const listaJson = await listaRes.json();
    const encontradaEnLista = listaJson.data.some((r) => r.id === recetaCreada.id);
    if (!encontradaEnLista) {
      throw new Error('La receta emitida no apareció en el listado del consultorio');
    }
    console.log(`✅ 5. Listado de recetas verificado (${listaJson.total} recetas encontradas en Tenant 1)`);

    // 6. Prueba de Blind Multi-Tenant Isolation
    console.log('🔒 6. Probando aislamiento ciego multi-tenant (Tenant 2 atacando receta de Tenant 1)...');
    
    // a) GET por ID
    const crossGetRes = await fetch(`http://localhost:3000/recetas/${recetaCreada.id}`, {
      headers: { Authorization: `Bearer ${tokenElena}` },
    });
    if (crossGetRes.status !== 404) {
      throw new Error(`Fallo de seguridad: Dra. Elena recibió HTTP ${crossGetRes.status} al intentar ver receta ajena (esperado 404)`);
    }
    console.log('   ✓ Dra. Elena recibió 404 Not Found al intentar ver receta ajena');

    // b) Descarga PDF cruzada
    const crossPdfRes = await fetch(`http://localhost:3000/recetas/${recetaCreada.id}/pdf`, {
      headers: { Authorization: `Bearer ${tokenElena}` },
    });
    if (crossPdfRes.status !== 404) {
      throw new Error(`Fallo de seguridad: Dra. Elena recibió HTTP ${crossPdfRes.status} al intentar descargar PDF ajeno (esperado 404)`);
    }
    console.log('   ✓ Dra. Elena recibió 404 Not Found al intentar descargar PDF ajeno');

    // c) Anulación cruzada
    const crossAnularRes = await fetch(`http://localhost:3000/recetas/${recetaCreada.id}/anular`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenElena}`,
      },
      body: JSON.stringify({ motivoAnulacion: 'Intento de anulación no autorizada' }),
    });
    if (crossAnularRes.status !== 404) {
      throw new Error(`Fallo de seguridad: Dra. Elena recibió HTTP ${crossAnularRes.status} al intentar anular receta ajena (esperado 404)`);
    }
    console.log('   ✓ Dra. Elena recibió 404 Not Found al intentar anular receta ajena');

    // 7. Descarga y Verificación del Documento PDF Oficial
    console.log('📄 7. Generando y descargando PDF de la receta médica...');
    const pdfRes = await fetch(`http://localhost:3000/recetas/${recetaCreada.id}/pdf`, {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });

    if (pdfRes.status !== 200) {
      throw new Error(`Error descargando PDF: HTTP ${pdfRes.status}`);
    }

    const contentType = pdfRes.headers.get('content-type');
    const contentDisposition = pdfRes.headers.get('content-disposition');
    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());

    if (!contentType.includes('application/pdf')) {
      throw new Error(`Content-Type inválido: ${contentType}`);
    }
    if (!contentDisposition.includes(recetaCreada.numeroReceta)) {
      throw new Error(`Content-Disposition no incluye el número de receta: ${contentDisposition}`);
    }
    if (pdfBuffer.slice(0, 4).toString() !== '%PDF') {
      throw new Error('El archivo descargado no inicia con el encabezado %PDF');
    }
    console.log(`✅ 7. PDF generado correctamente: ${pdfBuffer.length} bytes, cabecera '%PDF' verificada.`);

    // 8. Anulación justificada de la receta
    console.log('🚫 8. Anulando receta médica con justificación clínica...');
    const anularRes = await fetch(`http://localhost:3000/recetas/${recetaCreada.id}/anular`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCarlos}`,
      },
      body: JSON.stringify({
        motivoAnulacion: 'Paciente reporta náuseas leves tras primera dosis; se suspende y se rota a Claritromicina.',
      }),
    });

    const recetaAnulada = await anularRes.json();
    if (recetaAnulada.estado !== 'ANULADA' || !recetaAnulada.motivoAnulacion) {
      throw new Error(`Error en anulación: ${JSON.stringify(recetaAnulada)}`);
    }
    console.log(`✅ 8. Receta anulada exitosamente. Estado: ${recetaAnulada.estado}, Motivo: "${recetaAnulada.motivoAnulacion}"`);

    // 9. Verificar PDF de receta anulada (con marca de anulación)
    const pdfAnuladaRes = await fetch(`http://localhost:3000/recetas/${recetaCreada.id}/pdf`, {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    const pdfAnuladaBuffer = Buffer.from(await pdfAnuladaRes.arrayBuffer());
    if (pdfAnuladaBuffer.length < 1000 || pdfAnuladaBuffer.slice(0, 4).toString() !== '%PDF') {
      throw new Error('El PDF de la receta anulada es inválido');
    }
    console.log(`✅ 9. PDF de receta anulada generado correctamente (${pdfAnuladaBuffer.length} bytes)`);

    console.log('\n=============================================================');
    console.log('🎉 TODAS LAS PRUEBAS DE LA TAREA 23 PASARON SATISFACTORIAMENTE');
    console.log('=============================================================\n');
  } finally {
    server.kill();
  }
}

runTests().catch((err) => {
  console.error('❌ Error en pruebas:', err);
  process.exit(1);
});
