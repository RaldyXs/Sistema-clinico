const BASE_URL = 'http://localhost:3000';

async function test() {
  console.log('🧪 Iniciando pruebas de registro de pacientes...\n');

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
    console.error('❌ Error en login:', await resLogin.text());
    process.exit(1);
  }

  const dataLogin = await resLogin.json();
  const token = dataLogin.accessToken;
  console.log('✅ Login exitoso como Dr. Carlos');

  // CASO 1: Paciente con alergias = "Ninguna" y formato estándar
  console.log('\n📋 Caso 1: Paciente con alergias = "Ninguna"');
  const doc1 = `DOC-${Date.now()}-1`;
  const resCaso1 = await fetch(`${BASE_URL}/pacientes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      nombre: 'Marcos',
      apellido: 'Pérez',
      tipoDocumento: 'DNI',
      documentoIdentidad: doc1,
      fechaNacimiento: '1995-04-12',
      genero: 'MASCULINO',
      grupoSanguineo: 'O+',
      alergias: 'Ninguna',
      telefono: '098111222',
    }),
  });

  if (!resCaso1.ok) {
    console.error('❌ Falló Caso 1:', await resCaso1.text());
    process.exit(1);
  }
  const pac1 = await resCaso1.json();
  console.log(`   ✅ Paciente creado exitosamente ID: ${pac1.id}`);
  console.log(`      Alergias: "${pac1.alergias}", Doc: ${pac1.documentoIdentidad}, DNI alias: ${pac1.dni}, Género: ${pac1.genero}, Sexo alias: ${pac1.sexo}`);

  // CASO 2: Paciente con alergias vacías / "" (sin alergias)
  console.log('\n📋 Caso 2: Paciente con alergias vacías "" (omitidas)');
  const doc2 = `DOC-${Date.now()}-2`;
  const resCaso2 = await fetch(`${BASE_URL}/pacientes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      nombre: 'Elena',
      apellido: 'Gómez',
      tipoDocumento: 'CEDULA',
      documentoIdentidad: doc2,
      fechaNacimiento: '1988-11-23',
      genero: 'FEMENINO',
      grupoSanguineo: 'A+',
      alergias: '',
      telefono: '098333444',
    }),
  });

  if (!resCaso2.ok) {
    console.error('❌ Falló Caso 2:', await resCaso2.text());
    process.exit(1);
  }
  const pac2 = await resCaso2.json();
  console.log(`   ✅ Paciente creado exitosamente ID: ${pac2.id}`);
  console.log(`      Alergias guardadas como: ${JSON.stringify(pac2.alergias)}`);

  // CASO 3: Paciente enviado con campos legacy (dni, sexo, grupoSanguineo legacy O_POSITIVO)
  console.log('\n📋 Caso 3: Paciente con payload legacy (dni, sexo, grupoSanguineo: "O_POSITIVO")');
  const doc3 = `DNI-${Date.now()}-3`;
  const resCaso3 = await fetch(`${BASE_URL}/pacientes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      nombre: 'Roberto',
      apellido: 'Díaz',
      dni: doc3,
      fechaNacimiento: '1990-01-15',
      sexo: 'MASCULINO',
      grupoSanguineo: 'O_POSITIVO',
      alergias: 'Penicilina, Sulfas',
    }),
  });

  if (!resCaso3.ok) {
    console.error('❌ Falló Caso 3:', await resCaso3.text());
    process.exit(1);
  }
  const pac3 = await resCaso3.json();
  console.log(`   ✅ Paciente creado con éxito usando payload legacy ID: ${pac3.id}`);
  console.log(`      Doc: ${pac3.documentoIdentidad}, DNI alias: ${pac3.dni}, Género: ${pac3.genero}, Grupo: ${pac3.grupoSanguineo}`);

  // CASO 4: Actualización de paciente (PATCH /pacientes/:id) con alergias "Ninguna"
  console.log('\n📋 Caso 4: Actualizar paciente 3 a alergias "Ninguna" y grupo "O+"');
  const resCaso4 = await fetch(`${BASE_URL}/pacientes/${pac3.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      alergias: 'Ninguna',
      grupoSanguineo: 'O+',
    }),
  });

  if (!resCaso4.ok) {
    console.error('❌ Falló Caso 4:', await resCaso4.text());
    process.exit(1);
  }
  const pac3Actualizado = await resCaso4.json();
  console.log(`   ✅ Paciente actualizado ID: ${pac3Actualizado.id}`);
  console.log(`      Nuevas alergias: "${pac3Actualizado.alergias}"`);

  // CASO 5: Listar pacientes y confirmar presencia de aliases
  console.log('\n📋 Caso 5: Listar pacientes del consultorio');
  const resList = await fetch(`${BASE_URL}/pacientes?limite=5`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!resList.ok) {
    console.error('❌ Falló Caso 5:', await resList.text());
    process.exit(1);
  }
  const dataList = await resList.json();
  console.log(`   ✅ Total de pacientes encontrados: ${dataList.total}`);
  const primerPac = dataList.datos[0];
  console.log(`   Primer paciente: ${primerPac.nombre} ${primerPac.apellido} | Doc: ${primerPac.documentoIdentidad} (DNI alias: ${primerPac.dni}) | Género: ${primerPac.genero} (Sexo alias: ${primerPac.sexo})`);

  console.log('\n🎉 ¡TODAS LAS PRUEBAS DE REGISTRO DE PACIENTES PASARON EXITOSAMENTE!');
}

test().catch(err => {
  console.error('💥 Excepción durante las pruebas:', err);
  process.exit(1);
});
