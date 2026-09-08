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

  // 1. Consultorio matriz
  let resCons = await client.query("SELECT id FROM consultorios WHERE nombre = 'Plataforma SaaS Global'");
  let consultorioId;
  if (resCons.rows.length === 0) {
    const insertCons = await client.query(
      `INSERT INTO consultorios (nombre, email, telefono, direccion, activo, modulos_activos)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      ['Plataforma SaaS Global', 'soporte@saas.com', '+1 (800) 555-SAAS', 'Sede Central Operativa', true, JSON.stringify({ general: true, saas: true })]
    );
    consultorioId = insertCons.rows[0].id;
    console.log('✅ Consultorio Matriz creado:', consultorioId);
  } else {
    consultorioId = resCons.rows[0].id;
    console.log('✅ Consultorio Matriz existente:', consultorioId);
  }

  // 2. Rol SUPERADMIN
  let resRol = await client.query("SELECT id FROM roles WHERE codigo = 'SUPERADMIN'");
  let rolId;
  if (resRol.rows.length === 0) {
    const insertRol = await client.query(
      `INSERT INTO roles (codigo, nombre, descripcion, es_sistema)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['SUPERADMIN', 'Super Administrador de Plataforma', 'Acceso directivo a métricas globales de negocio, inquilinos y control SaaS', true]
    );
    rolId = insertRol.rows[0].id;
    console.log('✅ Rol SUPERADMIN creado:', rolId);
  } else {
    rolId = resRol.rows[0].id;
    console.log('✅ Rol SUPERADMIN existente:', rolId);
  }

  // 3. Usuario SuperAdmin
  let resUser = await client.query("SELECT id, email, rol_codigo FROM usuarios WHERE email = 'superadmin@saas.com'");
  if (resUser.rows.length === 0) {
    const hash = await bcrypt.hash('SuperAdmin1234!', 10);
    const insertUser = await client.query(
      `INSERT INTO usuarios (email, password_hash, nombre, apellido, rol_id, rol_codigo, consultorio_id, activo, two_factor_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      ['superadmin@saas.com', hash, 'Super', 'Administrador SaaS', rolId, 'SUPERADMIN', consultorioId, true, false]
    );
    console.log('✅ Usuario SuperAdmin creado con ID:', insertUser.rows[0].id);
  } else {
    console.log('✅ Usuario SuperAdmin existente:', resUser.rows[0]);
  }

  // 4. Asegurar que Dr. Carlos (Del Sol) y Dra. Elena (San Rafael) tengan suscripciones activas
  const planes = await client.query("SELECT id, codigo FROM saas_planes WHERE codigo = 'PROFESIONAL'");
  if (planes.rows.length > 0) {
    const profPlanId = planes.rows[0].id;
    const clinics = await client.query("SELECT id, nombre FROM consultorios WHERE nombre != 'Plataforma SaaS Global'");
    for (const c of clinics.rows) {
      const sub = await client.query("SELECT id FROM saas_suscripciones WHERE consultorio_id = $1", [c.id]);
      if (sub.rows.length === 0) {
        const ahora = new Date();
        const fin = new Date(ahora);
        fin.setDate(fin.getDate() + 30);
        await client.query(
          `INSERT INTO saas_suscripciones (consultorio_id, plan_id, estado, periodo, fecha_inicio, fecha_fin, precio_cobrado, renovacion_automatica)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [c.id, profPlanId, 'ACTIVA', 'MENSUAL', ahora, fin, 79.0, true]
        );
        console.log(`✅ Suscripción Plan Profesional creada para: ${c.nombre}`);
      }
    }
  }

  await client.end();
  console.log('🚀 Base de datos sincronizada para la separación de roles SuperAdmin y Clientes.');
}

run().catch(console.error);
