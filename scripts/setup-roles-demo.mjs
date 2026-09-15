import pg from 'pg';
import bcrypt from 'bcryptjs';

const client = new pg.Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '12344321',
  database: 'sistema_clinico',
});

async function run() {
  await client.connect();

  // 1. Obtener consultorio Del Sol
  const consRes = await client.query("SELECT id FROM consultorios WHERE nombre ILIKE '%Del Sol%'");
  const consultorioId = consRes.rows[0]?.id;
  console.log('Consultorio Del Sol ID:', consultorioId);

  // 2. Roles
  const rolMedRes = await client.query("SELECT id FROM roles WHERE codigo = 'PROFESIONAL_SALUD' OR codigo = 'MEDICO'");
  const rolMedId = rolMedRes.rows[0]?.id;
  const rolRecRes = await client.query("SELECT id FROM roles WHERE codigo = 'RECEPCION'");
  const rolRecId = rolRecRes.rows[0]?.id;
  const rolAdminRes = await client.query("SELECT id FROM roles WHERE codigo = 'ADMIN'");
  const rolAdminId = rolAdminRes.rows[0]?.id;

  const hashUser = await bcrypt.hash('Test1234!', 10);
  const hashSuper = await bcrypt.hash('SuperAdmin1234!', 10);

  // 3. Crear o actualizar Secretaria: secretaria@test.com
  const secExist = await client.query("SELECT id FROM usuarios WHERE email = 'secretaria@test.com'");
  if (secExist.rows.length === 0) {
    await client.query(
      `INSERT INTO usuarios (email, password_hash, nombre, apellido, rol_id, rol_codigo, consultorio_id, activo, eliminado, two_factor_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, false, false)`,
      ['secretaria@test.com', hashUser, 'María', 'Secretaria', rolRecId, 'RECEPCION', consultorioId]
    );
    console.log('✅ Creado secretaria@test.com');
  } else {
    await client.query(
      `UPDATE usuarios SET password_hash = $1, activo = true, eliminado = false, consultorio_id = $2, rol_codigo = 'RECEPCION', rol_id = $3
       WHERE email = 'secretaria@test.com'`,
      [hashUser, consultorioId, rolRecId]
    );
    console.log('✅ Actualizado secretaria@test.com');
  }

  // 4. Crear o actualizar Médico: medico@test.com
  const medExist = await client.query("SELECT id FROM usuarios WHERE email = 'medico@test.com'");
  if (medExist.rows.length === 0) {
    await client.query(
      `INSERT INTO usuarios (email, password_hash, nombre, apellido, especialidad, matricula_profesional, rol_id, rol_codigo, consultorio_id, activo, eliminado, two_factor_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, false, false)`,
      ['medico@test.com', hashUser, 'Dr. Roberto', 'Clínico', 'Medicina General', 'MN-88412', rolMedId, 'MEDICO', consultorioId]
    );
    console.log('✅ Creado medico@test.com');
  } else {
    await client.query(
      `UPDATE usuarios SET password_hash = $1, activo = true, eliminado = false, consultorio_id = $2, rol_codigo = 'MEDICO', rol_id = $3, especialidad = 'Medicina General'
       WHERE email = 'medico@test.com'`,
      [hashUser, consultorioId, rolMedId]
    );
    console.log('✅ Actualizado medico@test.com');
  }

  // 5. Verificar Admin: dr.carlos@test.com
  await client.query(
    `UPDATE usuarios SET password_hash = $1, activo = true, eliminado = false, rol_id = $2, rol_codigo = 'ADMIN'
     WHERE email = 'dr.carlos@test.com'`,
    [hashUser, rolAdminId]
  );
  console.log('✅ Actualizado dr.carlos@test.com (ADMIN)');

  // 6. Verificar SuperAdmin: superadmin@saas.com
  await client.query(
    `UPDATE usuarios SET password_hash = $1, activo = true, eliminado = false
     WHERE email = 'superadmin@saas.com'`,
    [hashSuper]
  );
  console.log('✅ Actualizado superadmin@saas.com (SUPERADMIN)');

  // 7. Resumen final de usuarios en Del Sol
  const resFinal = await client.query(
    `SELECT u.nombre, u.apellido, u.email, u.rol_codigo, u.activo, c.nombre as consultorio
     FROM usuarios u
     JOIN consultorios c ON u.consultorio_id = c.id
     WHERE u.email IN ('superadmin@saas.com', 'dr.carlos@test.com', 'medico@test.com', 'secretaria@test.com')`
  );
  console.table(resFinal.rows);

  await client.end();
}

run().catch(console.error);
