import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Simple .env parser without external dependencies
function loadEnv() {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

const env = { ...process.env, ...loadEnv() };
const apiKey = env.NOTION_API_KEY;
const databaseId = env.NOTION_ROADMAP_DATABASE_ID;

if (!apiKey || !databaseId) {
  console.error('❌ Error: NOTION_API_KEY o NOTION_ROADMAP_DATABASE_ID no están configurados en .env');
  process.exit(1);
}

const NOTION_HEADERS = {
  'Authorization': `Bearer ${apiKey}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json'
};

async function queryRoadmap() {
  const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: NOTION_HEADERS,
    body: JSON.stringify({
      sorts: [{ property: 'Orden', direction: 'ascending' }]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error consultando Notion (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.results.map(page => ({
    id: page.id,
    orden: page.properties.Orden?.number ?? 0,
    tarea: page.properties.Tarea?.title?.map(t => t.plain_text).join('') ?? 'Sin título',
    fase: page.properties.Fase?.select?.name ?? '',
    estado: page.properties.Estado?.select?.name ?? 'Pendiente',
    prioridad: page.properties.Prioridad?.select?.name ?? ''
  }));
}

async function updateTaskStatus(pageId, status) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: NOTION_HEADERS,
    body: JSON.stringify({
      properties: {
        Estado: {
          select: { name: status }
        }
      }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error actualizando tarea (${res.status}): ${errText}`);
  }

  return await res.json();
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';

  try {
    const tasks = await queryRoadmap();

    if (command === 'list' || command === 'status') {
      console.log('\n📋 ROADMAP — SISTEMA CLÍNICO (NOTION)');
      console.log('='.repeat(65));
      let currentPhase = '';
      for (const t of tasks) {
        if (t.fase !== currentPhase) {
          currentPhase = t.fase;
          console.log(`\n📌 ${currentPhase}:`);
        }
        const icon = t.estado === 'Completado' ? '✅' : t.estado === 'En progreso' ? '🔄' : '⏳';
        console.log(`  ${icon} [Orden ${t.orden}] ${t.tarea} (${t.estado})`);
      }
      console.log('\n' + '='.repeat(65));
    } else if (command === 'current' || command === 'next') {
      const inProgress = tasks.find(t => t.estado === 'En progreso');
      const nextPending = tasks.find(t => t.estado === 'Pendiente');
      if (inProgress) {
        console.log(`\n🔄 Tarea en progreso: [Orden ${inProgress.orden}] "${inProgress.tarea}" (${inProgress.fase})`);
      } else if (nextPending) {
        console.log(`\n⏳ Siguiente tarea pendiente: [Orden ${nextPending.orden}] "${nextPending.tarea}" (${nextPending.fase})`);
      } else {
        console.log('\n🎉 ¡Todas las tareas están completadas!');
      }
    } else if (command === 'set') {
      // e.g.: node notion-roadmap.js set --order 5 --status "En progreso"
      const orderIdx = args.indexOf('--order');
      const statusIdx = args.indexOf('--status');
      if (orderIdx === -1 || statusIdx === -1) {
        console.error('Uso: node scripts/notion-roadmap.js set --order <num> --status "<Pendiente|En progreso|Completado|Bloqueado>"');
        process.exit(1);
      }
      const orderNum = parseInt(args[orderIdx + 1], 10);
      const newStatus = args[statusIdx + 1];
      const target = tasks.find(t => t.orden === orderNum);
      if (!target) {
        console.error(`❌ No se encontró ninguna tarea con el orden ${orderNum}`);
        process.exit(1);
      }
      await updateTaskStatus(target.id, newStatus);
      console.log(`\n✅ Tarea actualizada en Notion: [Orden ${target.orden}] "${target.tarea}" -> ${newStatus}`);
    } else {
      console.log('Comandos disponibles: list, current, set --order <n> --status <status>');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
