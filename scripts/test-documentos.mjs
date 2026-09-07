import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

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
  console.log('🚀 Iniciando servidor API para pruebas de Almacenamiento y Adjuntos...');
  const server = spawn('npm.cmd', ['run', '--workspace=@sistema-clinico/api', 'start'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  server.stdout.on('data', (d) => process.stdout.write(`[API] ${d}`));
  server.stderr.on('data', (d) => process.stderr.write(`[API-ERR] ${d}`));

  try {
    await waitForPort(3000, 20000);
    console.log('\n🟢 Servidor API online en puerto 3000. Ejecutando suite de pruebas HTTP...\n');

    // 1. Login Dr. Carlos (Tenant 1)
    const loginCarlosRes = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dr.carlos@test.com', password: 'Test1234!' }),
    });
    const carlosData = await loginCarlosRes.json();
    const tokenCarlos = carlosData.accessToken;
    console.log('✅ 1. Login Dr. Carlos (Tenant 1) exitoso');

    // 2. Login Dra. Elena (Tenant 2)
    const loginElenaRes = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'elena.rios@test2.com', password: 'Test1234!' }),
    });
    const elenaData = await loginElenaRes.json();
    const tokenElena = elenaData.accessToken;
    console.log('✅ 2. Login Dra. Elena (Tenant 2) exitoso');

    // 3. Obtener paciente de Tenant 1 (Ana Torres)
    const pacientesRes = await fetch('http://localhost:3000/pacientes', {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    const pacientesJson = await pacientesRes.json();
    const ana = pacientesJson.datos?.[0] || pacientesJson.data?.[0];
    if (!ana) {
      throw new Error('No se encontró paciente en Tenant 1');
    }
    console.log(`✅ 3. Paciente localizada: ${ana.nombre} ${ana.apellido} (ID: ${ana.id})`);

    // 4. Subir documento clínico adjunto (FormData multipart/form-data)
    console.log('📤 4. Subiendo examen de laboratorio adjunto...');
    const archivoContenido = Buffer.from('%PDF-1.4 Mock de Hemograma Completo - Valores Normales de Leucocitos y Plaquetas');
    const formData = new FormData();
    const blob = new Blob([archivoContenido], { type: 'application/pdf' });
    formData.append('archivo', blob, 'laboratorio_hemograma_ana_torres.pdf');
    formData.append('pacienteId', ana.id);
    formData.append('categoria', 'LABORATORIO');
    formData.append('descripcion', 'Hemograma y recuento plaquetario de control');
    formData.append('fechaDocumento', '2026-09-05');

    const subirRes = await fetch('http://localhost:3000/documentos/subir', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenCarlos}` },
      body: formData,
    });

    const docCreado = await subirRes.json();
    if (!docCreado.id || !docCreado.hashSha256) {
      throw new Error(`Error en subida de documento: ${JSON.stringify(docCreado)}`);
    }
    console.log(`✅ 4. Documento subido exitosamente: [${docCreado.id}]`);
    console.log(`   - Archivo: ${docCreado.nombreOriginal} -> ${docCreado.nombreAlmacenado}`);
    console.log(`   - Hash SHA-256: ${docCreado.hashSha256}`);
    console.log(`   - Peso: ${docCreado.pesoBytes} bytes`);

    // 5. Verificar existencia del archivo físico en disco
    const rutaFisica = path.resolve(process.cwd(), 'uploads', docCreado.rutaRelativa);
    if (!fs.existsSync(rutaFisica)) {
      throw new Error(`El archivo físico no fue guardado en disco: ${rutaFisica}`);
    }
    console.log(`✅ 5. Archivo físico verificado en disco: ${rutaFisica}`);

    // 6. Consultar documentos del paciente
    const docsPacienteRes = await fetch(`http://localhost:3000/documentos/paciente/${ana.id}?categoria=LABORATORIO`, {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    const docsPacienteJson = await docsPacienteRes.json();
    const docEncontrado = docsPacienteJson.datos.some((d) => d.id === docCreado.id);
    if (!docEncontrado) {
      throw new Error('El documento subido no aparece en el listado del paciente');
    }
    console.log(`✅ 6. Documento listado correctamente para paciente (${docsPacienteJson.total} encontrados)`);

    // 7. Prueba de Blind Multi-Tenant Isolation (Tenant 2 atacando archivo de Tenant 1)
    console.log('🔒 7. Probando aislamiento ciego multi-tenant (Tenant 2)...');

    // a) GET documento por ID
    const crossGetRes = await fetch(`http://localhost:3000/documentos/${docCreado.id}`, {
      headers: { Authorization: `Bearer ${tokenElena}` },
    });
    if (crossGetRes.status !== 404) {
      throw new Error(`Fallo de seguridad: Dra. Elena recibió HTTP ${crossGetRes.status} al solicitar documento ajeno (esperado 404)`);
    }
    console.log('   ✓ Dra. Elena recibió 404 Not Found al intentar ver metadatos ajenos');

    // b) Descarga física cruzada
    const crossDescargarRes = await fetch(`http://localhost:3000/documentos/${docCreado.id}/descargar`, {
      headers: { Authorization: `Bearer ${tokenElena}` },
    });
    if (crossDescargarRes.status !== 404) {
      throw new Error(`Fallo de seguridad: Dra. Elena recibió HTTP ${crossDescargarRes.status} al intentar descargar archivo ajeno (esperado 404)`);
    }
    console.log('   ✓ Dra. Elena recibió 404 Not Found al intentar descargar archivo físico ajeno');

    // c) Eliminación cruzada
    const crossDeleteRes = await fetch(`http://localhost:3000/documentos/${docCreado.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenElena}` },
    });
    if (crossDeleteRes.status !== 404) {
      throw new Error(`Fallo de seguridad: Dra. Elena recibió HTTP ${crossDeleteRes.status} al intentar eliminar documento ajeno (esperado 404)`);
    }
    console.log('   ✓ Dra. Elena recibió 404 Not Found al intentar eliminar documento ajeno');

    // d) Listar documentos de paciente ajeno
    const crossPacienteDocsRes = await fetch(`http://localhost:3000/documentos/paciente/${ana.id}`, {
      headers: { Authorization: `Bearer ${tokenElena}` },
    });
    if (crossPacienteDocsRes.status !== 404) {
      throw new Error(`Fallo de seguridad: Dra. Elena recibió HTTP ${crossPacienteDocsRes.status} al listar docs de paciente ajeno (esperado 404)`);
    }
    console.log('   ✓ Dra. Elena recibió 404 Not Found al consultar historial documental de paciente ajeno');

    // 8. Descarga de archivo legítimo por Dr. Carlos
    console.log('📥 8. Descargando archivo físico por usuario autorizado...');
    const descargarRes = await fetch(`http://localhost:3000/documentos/${docCreado.id}/descargar`, {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    if (descargarRes.status !== 200) {
      throw new Error(`Error en descarga: HTTP ${descargarRes.status}`);
    }
    const contenidoDescargado = Buffer.from(await descargarRes.arrayBuffer());
    if (contenidoDescargado.toString() !== archivoContenido.toString()) {
      throw new Error('El contenido del archivo descargado difiere del original');
    }
    console.log(`✅ 8. Descarga verificada: ${contenidoDescargado.length} bytes, contenido 100% idéntico.`);

    // 9. Eliminación legítima del documento
    console.log('🗑️ 9. Eliminando documento clínico...');
    const eliminarRes = await fetch(`http://localhost:3000/documentos/${docCreado.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    if (eliminarRes.status !== 200) {
      throw new Error(`Error al eliminar: HTTP ${eliminarRes.status}`);
    }
    if (fs.existsSync(rutaFisica)) {
      throw new Error('El archivo físico todavía existe en el disco tras ser eliminado');
    }
    console.log('✅ 9. Documento eliminado de la base de datos y archivo físico purgado del disco exitosamente');

    console.log('\n=============================================================');
    console.log('🎉 TODAS LAS PRUEBAS DE TAREAS 24 Y 25 PASARON SATISFACTORIAMENTE');
    console.log('=============================================================\n');
  } finally {
    server.kill();
  }
}

runTests().catch((err) => {
  console.error('❌ Error en pruebas:', err);
  process.exit(1);
});
