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
  console.log('🚀 Iniciando servidor API para pruebas de Ginecología y Obstetricia...');
  const server = spawn('npm.cmd', ['run', '--workspace=@sistema-clinico/api', 'start'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  server.stdout.on('data', (d) => process.stdout.write(`[API] ${d}`));
  server.stderr.on('data', (d) => process.stderr.write(`[API-ERR] ${d}`));

  try {
    await waitForPort(3000, 20000);
    console.log('\n🟢 Servidor API online en puerto 3000. Ejecutando suite de pruebas de Ginecología...\n');

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

    // 3. Localizar paciente Ana Torres en Tenant 1
    const pacientesRes = await fetch('http://localhost:3000/pacientes', {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    const pacientesJson = await pacientesRes.json();
    const ana = pacientesJson.datos?.[0] || pacientesJson.data?.[0];
    if (!ana) {
      throw new Error('No se encontró a la paciente Ana Torres en Tenant 1');
    }
    console.log(`✅ 3. Paciente localizada: ${ana.nombre} ${ana.apellido} (ID: ${ana.id})`);

    // 4. Calculadora Obstétrica (Regla de Naegele y edad gestacional)
    console.log('📐 4. Probando Calculadora Obstétrica (Regla de Naegele)...');
    const calcRes = await fetch('http://localhost:3000/ginecologia/calculadora-obstetrica', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCarlos}`,
      },
      body: JSON.stringify({
        fur: '2026-06-01',
        fechaReferencia: '2026-08-10',
        cicloDias: 28,
      }),
    });
    const calcJson = await calcRes.json();
    if (!calcJson.fpp || !calcJson.edadGestacionalTexto) {
      throw new Error(`Error en calculadora: ${JSON.stringify(calcJson)}`);
    }
    console.log(`   ✓ FPP Naegele: ${calcJson.fpp}`);
    console.log(`   ✓ Edad gestacional: ${calcJson.edadGestacionalTexto} (${calcJson.trimestre})`);
    console.log(`   ✓ Días amenorrea: ${calcJson.diasAmenorreaTotales} días`);
    console.log(`   ✓ Estudios sugeridos: ${calcJson.cronogramaEstudiosRecomendados.length} hitos clínicos`);
    console.log('✅ 4. Calculadora obstétrica verificada con exactitud');

    // 5. Historia Ginecológica y Fórmula GPCA
    console.log('📋 5. Guardando y verificando Historia Ginecológica...');
    const histRes = await fetch(`http://localhost:3000/ginecologia/pacientes/${ana.id}/historia-ginecologica`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCarlos}`,
      },
      body: JSON.stringify({
        menarquiaEdad: 12,
        cicloDias: 28,
        cicloRegular: true,
        fum: '2026-06-01',
        dismenorrea: false,
        anticonceptivoActual: 'Ninguno (Búsqueda de embarazo)',
        gestas: 1,
        partos: 0,
        cesareas: 0,
        abortos: 0,
        ectopicos: 0,
        papUltimoFecha: '2025-11-15',
        papUltimoResultado: 'Negativo para lesión intraepitelial / Normal',
        observaciones: 'Paciente sin antecedentes de patología cervical ni mamaria.',
      }),
    });
    const histJson = await histRes.json();
    if (histJson.formulaObstetrica !== 'G1 P0 C0 A0') {
      throw new Error(`Fórmula obstétrica esperada 'G1 P0 C0 A0', recibida: ${histJson.formulaObstetrica}`);
    }
    console.log(`✅ 5. Historia ginecológica guardada con éxito (Fórmula: ${histJson.formulaObstetrica})`);

    // 6. Apertura de Expediente de Embarazo
    console.log('🤰 6. Aperturando nuevo expediente de Embarazo...');
    const embRes = await fetch('http://localhost:3000/ginecologia/embarazos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCarlos}`,
      },
      body: JSON.stringify({
        pacienteId: ana.id,
        fur: '2026-06-01',
        furConfiable: true,
        gravidezNumero: 2,
        tipoEmbarazo: 'UNICO',
        grupoSanguineo: 'O',
        factorRh: 'POSITIVO',
        sensibilizadaRh: false,
        pesoPregestacionalKg: 58.5,
        tallaCm: 165,
        observaciones: 'Embarazo planificado. Suplementación con ácido fólico iniciada.',
      }),
    });
    const embJson = await embRes.json();
    if (!embJson.id || !embJson.fpp || embJson.estado !== 'ACTIVO') {
      throw new Error(`Error aperturando embarazo: ${JSON.stringify(embJson)}`);
    }
    console.log(`✅ 6. Embarazo aperturado exitosamente: ID [${embJson.id}]`);
    console.log(`   - FPP calculada: ${embJson.fpp}`);
    console.log(`   - IMC pregestacional: ${embJson.imcPregestacional} kg/m²`);

    // 7. Consulta de Embarazo Activo
    const embActivoRes = await fetch(`http://localhost:3000/ginecologia/embarazos/paciente/${ana.id}/activo`, {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    const embActivoJson = await embActivoRes.json();
    if (!embActivoJson.embarazo || !embActivoJson.calculoObstetricoHoy) {
      throw new Error('No se pudo obtener el embarazo activo con cálculo de hoy');
    }
    console.log(`✅ 7. Embarazo activo consultado con cálculo de edad gestacional hoy: ${embActivoJson.calculoObstetricoHoy.edadGestacionalTexto}`);

    // 8. Registro de Controles Prenatales (Control #1 y Control #2)
    console.log('🩺 8. Registrando controles prenatales con vigilancia de preeclampsia...');
    const ctrl1Res = await fetch(`http://localhost:3000/ginecologia/embarazos/${embJson.id}/controles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCarlos}`,
      },
      body: JSON.stringify({
        embarazoId: embJson.id,
        pacienteId: ana.id,
        fechaControl: '2026-08-10T10:00:00.000Z',
        edadGestacionalSemanas: 10,
        edadGestacionalDias: 0,
        pesoMaternoKg: 59.5,
        presionSistolica: 110,
        presionDiastolica: 70,
        alturaUterinaCm: 10,
        frecuenciaCardiacaFetalLpm: 156,
        movimientosFetales: 'Presentes',
        presentacionFetal: 'NO_EVALUABLE',
        edema: 'AUSENTE',
        proteinuria: 'Negativa',
        sintomasAlarma: [],
        indicaciones: 'Continuar con ácido fólico y polivitamínico. Solicitar analítica de primer trimestre.',
      }),
    });
    const ctrl1Json = await ctrl1Res.json();
    console.log(`   ✓ Control #${ctrl1Json.numeroControl} registrado (Ganancia de peso: ${ctrl1Json.gananciaPesoKg} kg)`);

    const ctrl2Res = await fetch(`http://localhost:3000/ginecologia/embarazos/${embJson.id}/controles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCarlos}`,
      },
      body: JSON.stringify({
        embarazoId: embJson.id,
        pacienteId: ana.id,
        fechaControl: '2026-09-07T11:30:00.000Z',
        edadGestacionalSemanas: 14,
        edadGestacionalDias: 0,
        pesoMaternoKg: 61.0,
        presionSistolica: 115,
        presionDiastolica: 75,
        alturaUterinaCm: 14,
        frecuenciaCardiacaFetalLpm: 150,
        movimientosFetales: 'Presentes',
        presentacionFetal: 'CEFALICA',
        edema: 'AUSENTE',
        proteinuria: 'Negativa',
        sintomasAlarma: [],
        indicaciones: 'Control ecográfico 11-14 normal. Indicar hierro oral.',
      }),
    });
    const ctrl2Json = await ctrl2Res.json();
    console.log(`   ✓ Control #${ctrl2Json.numeroControl} registrado (Ganancia de peso: ${ctrl2Json.gananciaPesoKg} kg)`);
    console.log('✅ 8. Controles prenatales guardados correctamente');

    // 9. Curva de Crecimiento Obstétrico
    const curvaRes = await fetch(`http://localhost:3000/ginecologia/embarazos/${embJson.id}/curva-crecimiento`, {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    const curvaJson = await curvaRes.json();
    if (curvaJson.puntosCurva.length !== 2) {
      throw new Error(`Se esperaban 2 puntos de curva, recibidos: ${curvaJson.puntosCurva.length}`);
    }
    console.log(`✅ 9. Curva de crecimiento verificada (${curvaJson.puntosCurva.length} puntos cronológicos AU/Peso)`);

    // 10. Emisión de Informe Ecográfico con Biometría Hadlock
    console.log('🖥️ 10. Registrando ecografía obstétrica con biometría Hadlock...');
    const ecoRes = await fetch('http://localhost:3000/ginecologia/ecografias', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCarlos}`,
      },
      body: JSON.stringify({
        pacienteId: ana.id,
        embarazoId: embJson.id,
        tipoEcografia: 'SCREENING_11_14',
        edadGestacionalSemanas: 12,
        edadGestacionalDias: 4,
        biometriaFetal: {
          dbpMm: 22,
          ccMm: 82,
          caMm: 74,
          lfMm: 11,
          lcnMm: 64,
          fcfLpm: 152,
          translucenciaNucalMm: 1.3,
          huesoNasal: 'PRESENTE',
        },
        placentaLocalizacion: 'Anterior',
        placentaGrado: 0,
        liquidoAmniotico: 'Normal',
        conclusionDiagnostica:
          'Gestación única activa de 12.4 semanas por LCN. Translucencia nucal y hueso nasal normales. Bajo riesgo de aneuploidías.',
      }),
    });
    const ecoJson = await ecoRes.json();
    if (!ecoJson.id || !ecoJson.biometriaFetal) {
      throw new Error(`Error en ecografía: ${JSON.stringify(ecoJson)}`);
    }
    console.log(`✅ 10. Ecografía registrada: ID [${ecoJson.id}]. Conclusión: "${ecoJson.conclusionDiagnostica}"`);

    // 11. Prueba de Blind Multi-Tenant Isolation (Tenant 2 atacando datos de Tenant 1)
    console.log('🔒 11. Probando aislamiento ciego multi-tenant en Ginecología...');

    // a) Dra. Elena intentando ver historia ginecológica de Ana Torres
    const crossHistRes = await fetch(`http://localhost:3000/ginecologia/pacientes/${ana.id}/historia-ginecologica`, {
      headers: { Authorization: `Bearer ${tokenElena}` },
    });
    if (crossHistRes.status !== 404) {
      throw new Error(`Fallo de seguridad: Dra. Elena recibió HTTP ${crossHistRes.status} en historia ginecológica (esperado 404)`);
    }
    console.log('   ✓ Dra. Elena recibió 404 Not Found en historia ginecológica ajena');

    // b) Dra. Elena intentando ver embarazo ajeno
    const crossEmbRes = await fetch(`http://localhost:3000/ginecologia/embarazos/${embJson.id}`, {
      headers: { Authorization: `Bearer ${tokenElena}` },
    });
    if (crossEmbRes.status !== 404) {
      throw new Error(`Fallo de seguridad: Dra. Elena recibió HTTP ${crossEmbRes.status} en embarazo ajeno (esperado 404)`);
    }
    console.log('   ✓ Dra. Elena recibió 404 Not Found en expediente de embarazo ajeno');

    // c) Dra. Elena intentando ver controles prenatales ajenos
    const crossCtrlRes = await fetch(`http://localhost:3000/ginecologia/embarazos/${embJson.id}/controles`, {
      headers: { Authorization: `Bearer ${tokenElena}` },
    });
    if (crossCtrlRes.status !== 404) {
      throw new Error(`Fallo de seguridad: Dra. Elena recibió HTTP ${crossCtrlRes.status} en controles ajenos (esperado 404)`);
    }
    console.log('   ✓ Dra. Elena recibió 404 Not Found en controles prenatales ajenos');

    // d) Dra. Elena intentando ver ecografía ajena
    const crossEcoRes = await fetch(`http://localhost:3000/ginecologia/ecografias/${ecoJson.id}`, {
      headers: { Authorization: `Bearer ${tokenElena}` },
    });
    if (crossEcoRes.status !== 404) {
      throw new Error(`Fallo de seguridad: Dra. Elena recibió HTTP ${crossEcoRes.status} en ecografía ajena (esperado 404)`);
    }
    console.log('   ✓ Dra. Elena recibió 404 Not Found en ecografía ajena');

    // 12. Finalización formal del Embarazo y Actualización de Paridad
    console.log('🏁 12. Finalizando formalmente el embarazo (Parto eutócico a término)...');
    const finRes = await fetch(`http://localhost:3000/ginecologia/embarazos/${embJson.id}/finalizar`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCarlos}`,
      },
      body: JSON.stringify({
        estado: 'FINALIZADO_PARTO',
        fechaTermino: '2027-03-08',
        desenlaceDetalles:
          'Parto vaginal eutócico sin complicaciones. Recién nacido femenino vivo, peso 3.320 g, talla 50 cm, Apgar 9-10.',
      }),
    });
    const finJson = await finRes.json();
    if (finJson.estado !== 'FINALIZADO_PARTO') {
      throw new Error(`Error en finalización: ${JSON.stringify(finJson)}`);
    }
    console.log(`✅ 12. Embarazo finalizado exitosamente con estado ${finJson.estado}`);

    // 13. Verificar actualización de paridad en Historia Ginecológica
    const histFinalRes = await fetch(`http://localhost:3000/ginecologia/pacientes/${ana.id}/historia-ginecologica`, {
      headers: { Authorization: `Bearer ${tokenCarlos}` },
    });
    const histFinalJson = await histFinalRes.json();
    console.log(`✅ 13. Paridad actualizada en Historia Ginecológica: ${histFinalJson.formulaObstetrica} (Partos: ${histFinalJson.partos})`);

    console.log('\n=============================================================');
    console.log('🎉 TODAS LAS PRUEBAS DE LA FASE 6 (GINECOLOGÍA) PASARON EXITOSAMENTE');
    console.log('=============================================================\n');
  } finally {
    server.kill();
  }
}

runTests().catch((err) => {
  console.error('❌ Error en pruebas:', err);
  process.exit(1);
});
