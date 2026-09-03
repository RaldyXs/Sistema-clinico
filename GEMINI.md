# Reglas del Proyecto — Sistema Clínico

Este archivo define las directrices y el flujo de trabajo para el desarrollo del **Sistema Clínico** con el asistente **Antigravity**.

---

## 1. Contexto y Arquitectura
- **Nombre:** Sistema Clínico (Plataforma multi-consultorio y multi-especialidad).
- **Estructura:** Monorepo con npm workspaces (`apps/web`, `apps/api`, `packages/*`).
- **Frontend (`apps/web`):** React 19, TypeScript, Vite, Tailwind CSS, Shadcn UI.
- **Backend (`apps/api`):** NestJS, TypeScript, TypeORM, PostgreSQL 16 (nativo local).
- **Fuente de Verdad del Estado:** `docs/PROJECT_STATUS.md` y el Roadmap de Notion.

---

## 2. Flujo de Trabajo Unificado (Reemplazo Gemini + ChatGPT)
Antigravity asume el rol completo:
1. **Desarrollo y Pruebas:** Escribir código, instalar dependencias, compilar y ejecutar suites de validación (`npm run build`, `npm run lint`, etc.).
2. **Sincronización del Roadmap:**
   - Consultar la tarea activa o siguiente: `node scripts/notion-roadmap.mjs current`
   - Al iniciar una tarea, marcarla en Notion como `En progreso`: `node scripts/notion-roadmap.mjs set --order <N> --status "En progreso"`
   - Al finalizar, actualizar `docs/PROJECT_STATUS.md` con los detalles exactos (archivos creados/modificados, pruebas ejecutadas, resultado y commit sugerido).
   - Marcar la tarea en Notion como `Completado`: `node scripts/notion-roadmap.mjs set --order <N> --status "Completado"`
   - Indicar al usuario que es momento de realizar el commit y proveer el mensaje sugerido siguiendo Conventional Commits. (El usuario siempre ejecuta `git commit` y `git push` manualmente en su terminal).

---

## 3. Estándares Técnicos
- Mantener tipado estricto en TypeScript sin usar `any`.
- Los componentes de Shadcn UI residen en `apps/web/src/components/ui`.
- Todas las interacciones con base de datos se hacen exclusivamente desde NestJS mediante TypeORM.
- Las credenciales nunca se suben a Git; residen en `.env` (ignorado en `.gitignore`).
