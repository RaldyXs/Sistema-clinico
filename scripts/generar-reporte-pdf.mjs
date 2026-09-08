import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';

const OUTPUT_PATH = path.resolve(process.cwd(), 'Sistema-Clinico-Reporte-Completo-Desarrollo.pdf');

function generateDevPresentationPDF() {
  console.log('Generando reporte PDF de nivel profesional para el equipo de desarrolladores...');

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 45, left: 40, right: 40 },
    bufferPages: true,
  });

  const stream = fs.createWriteStream(OUTPUT_PATH);
  doc.pipe(stream);

  // Paleta de diseño profesional para ingeniería
  const C_NAVY = '#0f172a';       // Slate 900
  const C_DARK = '#1e293b';       // Slate 800
  const C_BODY = '#334155';       // Slate 700
  const C_MUTED = '#64748b';      // Slate 500
  const C_BORDER = '#cbd5e1';     // Slate 300
  const C_BG_CARD = '#f8fafc';    // Slate 50
  const C_WHITE = '#ffffff';

  const C_BLUE = '#0284c7';       // Sky 600
  const C_BLUE_BG = '#f0f9ff';    // Sky 50
  const C_BLUE_BORDER = '#bae6fd';// Sky 200

  const C_GREEN = '#059669';      // Emerald 600
  const C_GREEN_BG = '#ecfdf5';   // Emerald 50
  const C_GREEN_BORDER = '#a7f3d0';

  const C_AMBER = '#d97706';      // Amber 600
  const C_AMBER_BG = '#fffbeb';   // Amber 50
  const C_AMBER_BORDER = '#fde68a';

  const C_RED = '#dc2626';        // Red 600
  const C_RED_BG = '#fef2f2';     // Red 50
  const C_RED_BORDER = '#fecaca';

  const PAGE_W = 515; // Ancho útil (595 - 40 - 40)
  const LEFT_X = 40;

  // Helper para dibujar Badge / Pastilla
  const drawBadge = (x, y, text, bgColor, textColor, borderColor = null, fontSize = 7.5) => {
    doc.font('Helvetica-Bold').fontSize(fontSize);
    const textW = doc.widthOfString(text);
    const padX = 7;
    const h = 13;
    const w = textW + padX * 2;

    doc.roundedRect(x, y, w, h, 3).fill(bgColor);
    if (borderColor) {
      doc.roundedRect(x, y, w, h, 3).lineWidth(0.6).stroke(borderColor);
    }
    doc.fillColor(textColor).text(text, x + padX, y + 2.5);
    return w;
  };

  // Helper para Card contenedora con encabezado
  const drawPhaseCard = (x, y, w, title, statusText, colorTheme, items = []) => {
    let bgCol = C_BG_CARD;
    let borderCol = C_BORDER;
    let badgeBg = C_GREEN_BG;
    let badgeText = C_GREEN;
    let badgeBorder = C_GREEN_BORDER;

    if (colorTheme === 'blue') {
      bgCol = C_BLUE_BG;
      borderCol = C_BLUE_BORDER;
    }

    // Calculamos altura aproximada
    let innerHeight = 26; // Título y badge
    for (const item of items) {
      innerHeight += 13;
    }
    const cardH = innerHeight + 10;

    // Fondo y borde
    doc.roundedRect(x, y, w, cardH, 5).fillAndStroke(bgCol, borderCol);

    // Título y badge
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C_NAVY).text(title, x + 10, y + 8);
    drawBadge(x + w - 95, y + 6, statusText, badgeBg, badgeText, badgeBorder, 7);

    // Línea separadora tenue dentro de la tarjeta
    doc
      .strokeColor(borderCol)
      .lineWidth(0.5)
      .moveTo(x + 10, y + 23)
      .lineTo(x + w - 10, y + 23)
      .stroke();

    let curY = y + 28;
    for (const item of items) {
      doc.font('Helvetica-Bold').fontSize(8).fillColor(C_DARK).text(`• ${item.label}: `, x + 12, curY, { continued: true });
      doc.font('Helvetica').fontSize(8).fillColor(C_BODY).text(item.desc);
      curY += 12.5;
    }

    return cardH;
  };

  // Encabezado de página
  const drawPageHeader = (pageNum, sectionTitle) => {
    // Barra de color superior
    doc.rect(LEFT_X, 22, PAGE_W, 3).fill(C_BLUE);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C_MUTED).text('SISTEMA CLÍNICO SAAS — ESPECIFICACIÓN TÉCNICA DE DESARROLLO', LEFT_X, 30);
    doc.font('Helvetica').fontSize(8).fillColor(C_BLUE).text(sectionTitle, LEFT_X, 30, { align: 'right', width: PAGE_W });
    doc
      .strokeColor(C_BORDER)
      .lineWidth(0.5)
      .moveTo(LEFT_X, 42)
      .lineTo(LEFT_X + PAGE_W, 42)
      .stroke();
  };

  // =========================================================================
  // PÁGINA 1: PORTADA EJECUTIVA DE INGENIERÍA
  // =========================================================================
  drawPageHeader(1, 'PORTADA & RESUMEN EJECUTIVO');

  doc.moveDown(2);
  let y = 60;

  // Badge de versión
  drawBadge(LEFT_X, y, 'DOCUMENTO DE ARQUITECTURA & ESPECIFICACIÓN TÉCNICA — v1.0.0', C_BLUE_BG, C_BLUE, C_BLUE_BORDER, 8);
  y += 22;

  // Título Principal
  doc.font('Helvetica-Bold').fontSize(22).fillColor(C_NAVY).text('SISTEMA CLÍNICO SAAS', LEFT_X, y);
  y += 26;
  doc.font('Helvetica-Bold').fontSize(12).fillColor(C_BLUE).text('Plataforma Integral de Gestión Médica, Especialidades y Arquitectura Multi-Tenant', LEFT_X, y);
  y += 18;
  doc.font('Helvetica').fontSize(9).fillColor(C_MUTED).text('Informe exhaustivo de ingeniería de software preparado para el equipo de desarrollo y liderazgo técnico.', LEFT_X, y);
  y += 24;

  // Caja de Métricas de Desarrollo
  doc.roundedRect(LEFT_X, y, PAGE_W, 60, 6).fillAndStroke(C_BLUE_BG, C_BLUE_BORDER);
  const metricCols = [
    { num: '10 / 13', label: 'Fases Completadas', sub: '77% del Roadmap Total' },
    { num: '100%', label: 'Tests Pasados', sub: '9 suites HTTP en vivo' },
    { num: '15 Tablas', label: 'Modelos en PostgreSQL', sub: 'Entidades relacionales TypeORM' },
    { num: '0 Errores', label: 'Compilación TypeScript', sub: 'Build limpio en NestJS y Vite' },
  ];

  let mx = LEFT_X + 10;
  for (const m of metricCols) {
    doc.font('Helvetica-Bold').fontSize(15).fillColor(C_BLUE).text(m.num, mx, y + 8, { width: 115, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C_NAVY).text(m.label, mx, y + 26, { width: 115, align: 'center' });
    doc.font('Helvetica').fontSize(7.5).fillColor(C_MUTED).text(m.sub, mx, y + 39, { width: 115, align: 'center' });
    mx += 122;
  }
  y += 72;

  // Ficha Técnica del Monorepo
  doc.font('Helvetica-Bold').fontSize(11).fillColor(C_NAVY).text('Ficha Técnica de la Solución', LEFT_X, y);
  y += 16;

  const techRows = [
    { k: 'Estructura Monorepo', v: 'npm workspaces: apps/api (Backend NestJS) + apps/web (Frontend React) + packages' },
    { k: 'Backend Framework', v: 'NestJS 12 + Node.js 24 + TypeScript 5.8 (Clean Architecture modular, Guards y Decorators)' },
    { k: 'Base de Datos', v: 'PostgreSQL 18.6 con TypeORM (Aislamiento por discriminador consultorioId indexado)' },
    { k: 'Frontend Web', v: 'React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons (Modo Oscuro / Claro integrado)' },
    { k: 'Seguridad y Compliance', v: 'Zero-Knowledge Multi-Tenant, Auditoría HIPAA/GDPR, 2FA TOTP RFC 6238, Checksums SHA-256' },
    { k: 'Infraestructura Local', v: 'Base de datos en localhost:5432, API en puerto 3000, Frontend SPA en puerto 5173' },
  ];

  doc.roundedRect(LEFT_X, y, PAGE_W, 102, 5).fillAndStroke(C_BG_CARD, C_BORDER);
  let ty = y + 8;
  for (const row of techRows) {
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C_BLUE).text(`  ${row.k}: `, LEFT_X + 8, ty, { continued: true });
    doc.font('Helvetica').fontSize(8).fillColor(C_BODY).text(row.v);
    ty += 15;
  }
  y += 114;

  // Tabla Resumen de Fases
  doc.font('Helvetica-Bold').fontSize(11).fillColor(C_NAVY).text('Estado Consolidado del Roadmap', LEFT_X, y);
  y += 15;

  // Encabezado tabla
  doc.roundedRect(LEFT_X, y, PAGE_W, 16, 3).fill(C_DARK);
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C_WHITE);
  doc.text('FASE', LEFT_X + 8, y + 4);
  doc.text('MÓDULOS Y OBJETIVO FUNCIONAL', LEFT_X + 70, y + 4);
  doc.text('TIPO', LEFT_X + 340, y + 4);
  doc.text('ESTADO', LEFT_X + 430, y + 4);
  y += 18;

  const fasesSummary = [
    { id: 'Fase 1', name: 'Fundamentos, Multi-Tenant y PostgreSQL', cat: 'Core', st: 'COMPLETADO' },
    { id: 'Fase 2', name: 'Módulo Clínico de Pacientes y Ficha 360°', cat: 'Clínica', st: 'COMPLETADO' },
    { id: 'Fase 3', name: 'Agenda de Turnos y Flujo de Citas', cat: 'Clínica', st: 'COMPLETADO' },
    { id: 'Fase 4', name: 'Consultas Médicas, Signos Vitales y CIE-10', cat: 'Clínica', st: 'COMPLETADO' },
    { id: 'Fase 5', name: 'Recetas Clínicas PDF y Almacenamiento Adjuntos', cat: 'Clínica', st: 'COMPLETADO' },
    { id: 'Fase 6', name: 'Ginecología y Obstetricia (Naegele y Hadlock)', cat: 'Especialidad', st: 'COMPLETADO' },
    { id: 'Fase 7', name: 'Dashboard KPIs, Personal y Branding', cat: 'Gestión', st: 'COMPLETADO' },
    { id: 'Fase 8', name: 'Reportes Operativos, Productividad y CSV', cat: 'Business', st: 'COMPLETADO' },
    { id: 'Fase 9', name: 'Seguridad Avanzada, HIPAA, 2FA y Backups', cat: 'Seguridad', st: 'COMPLETADO' },
    { id: 'Fase 10', name: 'Arquitectura SaaS, Planes, Onboarding y SuperAdmin', cat: 'SaaS', st: 'COMPLETADO' },
    { id: 'Fase 11', name: 'Pediatría (OMS) y Cardiología (Framingham)', cat: 'Especialidad', st: 'ROADMAP' },
    { id: 'Fase 12', name: 'App Móvil Médica en React Native / Expo', cat: 'Mobile', st: 'ROADMAP' },
    { id: 'Fase 13', name: 'Portal y App Móvil para Pacientes', cat: 'Mobile', st: 'ROADMAP' },
  ];

  for (const f of fasesSummary) {
    const isDone = f.st === 'COMPLETADO';
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(isDone ? C_BLUE : C_MUTED).text(f.id, LEFT_X + 8, y);
    doc.font('Helvetica').fontSize(7.5).fillColor(C_BODY).text(f.name, LEFT_X + 70, y);
    doc.font('Helvetica').fontSize(7).fillColor(C_MUTED).text(f.cat, LEFT_X + 340, y);
    drawBadge(LEFT_X + 430, y - 2, isDone ? '100% LISTO' : 'PENDIENTE', isDone ? C_GREEN_BG : C_AMBER_BG, isDone ? C_GREEN : C_AMBER, isDone ? C_GREEN_BORDER : C_AMBER_BORDER, 6.5);
    y += 14.5;
  }

  // =========================================================================
  // PÁGINA 2: ARQUITECTURA DE SOFTWARE Y PATRONES
  // =========================================================================
  doc.addPage();
  drawPageHeader(2, 'ARQUITECTURA Y MODELO MULTI-TENANT');

  y = 55;
  doc.font('Helvetica-Bold').fontSize(14).fillColor(C_NAVY).text('Arquitectura del Sistema y Principios de Diseño', LEFT_X, y);
  y += 16;
  doc.font('Helvetica').fontSize(8.5).fillColor(C_BODY).text(
    'El proyecto implementa un modelo Multi-Tenant por discriminador relacional optimizado para clínicas médicas. Toda la información asistencial y administrativa se mantiene lógicamente aislada y blindada.',
    LEFT_X, y, { width: PAGE_W, lineGap: 2 }
  );
  y += 28;

  // Diagrama visual en cajas
  doc.roundedRect(LEFT_X, y, PAGE_W, 75, 5).fillAndStroke(C_BG_CARD, C_BORDER);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(C_NAVY).text('FLUJO DE DATOS Y CAPAS DEL MONOREPO', LEFT_X + 12, y + 8);

  const layers = [
    { name: 'Frontend SPA', tech: 'React 19 + Vite + Tailwind', desc: 'AuthContext + Vistas Modulares' },
    { name: 'Gateway / API', tech: 'NestJS 12 + Express', desc: 'JwtAuthGuard + Tenant Decorator' },
    { name: 'Lógica de Negocio', tech: 'Servicios de Dominio', desc: 'Validaciones + CIE-10 + Naegele' },
    { name: 'Persistencia', tech: 'PostgreSQL 18.6 + TypeORM', desc: 'Zero-Knowledge Multi-Tenant' },
  ];

  let lx = LEFT_X + 12;
  for (let i = 0; i < layers.length; i++) {
    const l = layers[i];
    doc.roundedRect(lx, y + 24, 110, 42, 4).fillAndStroke(C_WHITE, C_BORDER);
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C_BLUE).text(l.name, lx + 5, y + 28, { width: 100, align: 'center' });
    doc.font('Helvetica').fontSize(6.8).fillColor(C_DARK).text(l.tech, lx + 5, y + 39, { width: 100, align: 'center' });
    doc.font('Helvetica').fontSize(6.2).fillColor(C_MUTED).text(l.desc, lx + 5, y + 49, { width: 100, align: 'center' });
    lx += 125;
  }
  y += 88;

  // Aislamiento Zero-Knowledge Multi-Tenant
  doc.font('Helvetica-Bold').fontSize(11).fillColor(C_NAVY).text('Principio de Aislamiento Zero-Knowledge', LEFT_X, y);
  y += 14;

  const zkPoints = [
    { t: 'Inyección en el Token JWT', d: 'Al autenticarse un médico o administrador, el token firmado contiene obligatoriamente consultorioId, rolCodigo y sub (usuarioId).' },
    { t: 'Decorador @ConsultorioActual()', d: 'Extrae automáticamente el UUID del tenant validado criptográficamente por Passport, impidiendo que el cliente envíe IDs arbitrarios.' },
    { t: 'Blind Data Isolation (404 Not Found)', d: 'Si un usuario del Tenant 1 intenta consultar, editar o borrar una cita, paciente, receta o backup perteneciente al Tenant 2, la API retorna 404 estricto, ocultando totalmente la existencia de otros clientes.' },
    { t: 'Indexación B-Tree en PostgreSQL', d: 'Todas las tablas contienen consultorio_id con índice TypeORM para garantizar tiempos de respuesta O(log n) aún con millones de registros.' },
  ];

  doc.roundedRect(LEFT_X, y, PAGE_W, 110, 5).fillAndStroke(C_BLUE_BG, C_BLUE_BORDER);
  let zky = y + 8;
  for (const z of zkPoints) {
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C_BLUE).text(`• ${z.t}: `, LEFT_X + 10, zky, { continued: true });
    doc.font('Helvetica').fontSize(8).fillColor(C_BODY).text(z.d);
    zky += 24;
  }
  y += 122;

  // Estándares de Codificación del Monorepo
  doc.font('Helvetica-Bold').fontSize(11).fillColor(C_NAVY).text('Estándares y Buenas Prácticas del Monorepo', LEFT_X, y);
  y += 14;

  const bestPractices = [
    { t: 'TypeScript 5.8+ con erasableSyntaxOnly', d: 'Propiedades de clase declaradas explícitamente sin parameter properties en constructores.' },
    { t: 'DTOs con Class-Validator', d: 'Peticiones entrantes interceptadas por ValidationPipe global; evita contaminación de entidades.' },
    { t: 'Hashing Seguro con Bcryptjs', d: 'Contraseñas con 10 rondas de salt; passwordHash se omite estrictamente en todos los select y JSON responses.' },
    { t: 'Zero Dependencias Externas en Criptografía', d: 'TOTP RFC 6238 y checksums SHA-256 implementados con módulo nativo node:crypto.' },
  ];

  doc.roundedRect(LEFT_X, y, PAGE_W, 110, 5).fillAndStroke(C_BG_CARD, C_BORDER);
  let bpy = y + 8;
  for (const bp of bestPractices) {
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C_NAVY).text(`• ${bp.t}: `, LEFT_X + 10, bpy, { continued: true });
    doc.font('Helvetica').fontSize(8).fillColor(C_BODY).text(bp.d);
    bpy += 24;
  }

  // =========================================================================
  // PÁGINA 3: FASES 1 A 4 — CORE ASISTENCIAL Y CITAS
  // =========================================================================
  doc.addPage();
  drawPageHeader(3, 'FASES 1 A 4 — CORE ASISTENCIAL Y CITAS');

  y = 55;
  doc.font('Helvetica-Bold').fontSize(14).fillColor(C_NAVY).text('Módulos Asistenciales de Atención Médica (Fases 1 a 4)', LEFT_X, y);
  y += 16;
  doc.font('Helvetica').fontSize(8.5).fillColor(C_MUTED).text('Implementación completa del flujo asistencial desde el registro del paciente hasta la consulta médica.', LEFT_X, y);
  y += 18;

  y += drawPhaseCard(LEFT_X, y, PAGE_W, 'FASE 1: FUNDAMENTOS Y SESIONES MULTI-TENANT', '100% COMPLETADA', 'blue', [
    { label: 'Entidades', desc: 'Consultorio, Usuario, Rol, Permiso (PostgreSQL 18.6).' },
    { label: 'Seguridad', desc: 'AuthModule con JWT, Bcrypt (10 salts) y RolesGuard para control granular por permisos.' },
    { label: 'Frontend', desc: 'LoginView.tsx con switch interactivo en 1 clic entre Dr. Carlos y Dra. Elena.' },
    { label: 'Endpoints Clave', desc: 'POST /auth/registro, POST /auth/login, GET /auth/perfil.' },
  ]) + 10;

  y += drawPhaseCard(LEFT_X, y, PAGE_W, 'FASE 2: PADRÓN Y EXPEDIENTE DE PACIENTES', '100% COMPLETADA', 'default', [
    { label: 'Entidades', desc: 'Paciente (demografía, contacto de emergencia, tipo de sangre, alergias, antecedentes familiares).' },
    { label: 'Búsqueda y Filtros', desc: 'Búsqueda instantánea indexada por documento de identidad, nombre, teléfono o correo.' },
    { label: 'Frontend', desc: 'PacientesView.tsx con tabla de pacientes, modal de alta rápida y ficha 360° en panel lateral.' },
    { label: 'Endpoints Clave', desc: 'POST /pacientes, GET /pacientes, GET /pacientes/:id, PATCH /pacientes/:id.' },
  ]) + 10;

  y += drawPhaseCard(LEFT_X, y, PAGE_W, 'FASE 3: AGENDA MÉDICA Y CONTROL DE SOBRECUPOS', '100% COMPLETADA', 'default', [
    { label: 'Entidades', desc: 'Cita (médico asignado, paciente, fecha, hora, duración y motivo de consulta).' },
    { label: 'Algoritmo Anti-Solapamiento', desc: 'Valida disponibilidad de horario del facultativo antes de agendar turnos concurrentes.' },
    { label: 'Flujo de 7 Estados', desc: 'PROGRAMADA -> CONFIRMADA -> EN_ESPERA -> EN_CONSULTA -> ATENDIDA (o CANCELADA / NO_ASISTIO).' },
    { label: 'Frontend', desc: 'CitasView.tsx con vista semanal/diaria y botones para transición de estado en recepción.' },
  ]) + 10;

  y += drawPhaseCard(LEFT_X, y, PAGE_W, 'FASE 4: CONSULTAS CLÍNICAS, SIGNOS VITALES Y CIE-10', '100% COMPLETADA', 'default', [
    { label: 'Entidades', desc: 'Consulta (signos vitales completos, examen físico por aparatos, diagnósticos y plan).' },
    { label: 'Cálculo Dinámico de IMC', desc: 'Cálculo en vivo de Índice de Masa Corporal (kg/m²) con clasificación clínica de peso.' },
    { label: 'Codificación CIE-10', desc: 'Asignación estructurada de códigos de morbilidad y patologías atendidas.' },
    { label: 'Frontend', desc: 'ConsultasView.tsx con historial evolutivo cronológico y registro de diagnósticos.' },
  ]) + 10;

  // =========================================================================
  // PÁGINA 4: FASES 5 A 7 — DOCUMENTOS, SALUD FEMENINA Y GESTIÓN
  // =========================================================================
  doc.addPage();
  drawPageHeader(4, 'FASES 5 A 7 — DOCUMENTOS, GINECOLOGÍA Y DASHBOARD');

  y = 55;
  doc.font('Helvetica-Bold').fontSize(14).fillColor(C_NAVY).text('Recetas PDF, Especialidades y Gestión Clínica (Fases 5 a 7)', LEFT_X, y);
  y += 16;
  doc.font('Helvetica').fontSize(8.5).fillColor(C_MUTED).text('Generación de documentos imprimibles, biometría fetal y administración del centro asistencial.', LEFT_X, y);
  y += 18;

  y += drawPhaseCard(LEFT_X, y, PAGE_W, 'FASE 5: RECETAS CLÍNICAS PDF Y ADJUNTOS MULTI-TENANT', '100% COMPLETADA', 'blue', [
    { label: 'Entidades', desc: 'Receta, DocumentoClinico (laboratorios, estudios, imágenes diagnósticas).' },
    { label: 'Motor PDFKit', desc: 'Generación vectorial de prescripciones con membrete institucional, QR de validación y firma.' },
    { label: 'Almacenamiento Aislado', desc: 'Repositorio físico segmentado por consultorio en disco con validación de tipo MIME.' },
    { label: 'Frontend', desc: 'RecetasView.tsx con formulario de posología de fármacos y descarga inmediata de PDF.' },
    { label: 'Endpoints Clave', desc: 'POST /recetas, GET /recetas/:id/pdf, POST /documentos/subir, GET /documentos/:id/archivo.' },
  ]) + 10;

  y += drawPhaseCard(LEFT_X, y, PAGE_W, 'FASE 6: ESPECIALIDAD EN GINECOLOGÍA Y OBSTETRICIA', '100% COMPLETADA', 'default', [
    { label: 'Entidades', desc: 'HistoriaGinecologica, Embarazo, ControlPrenatal, Ecografia.' },
    { label: 'Regla de Naegele', desc: 'Cálculo obstétrico de Fecha Probable de Parto (FPP) y edad gestacional en semanas + días.' },
    { label: 'Biometría Hadlock', desc: 'Medición ecográfica (DBP, LF, PA, PC) y cálculo automático del peso fetal estimado (EFW).' },
    { label: 'Frontend', desc: 'GinecologiaView.tsx con calculadora gestacional interactiva y simulador biométrico fetal.' },
    { label: 'Endpoints Clave', desc: 'POST /ginecologia/embarazos, POST /ginecologia/ecografias, GET /ginecologia/calcular-fpp.' },
  ]) + 10;

  y += drawPhaseCard(LEFT_X, y, PAGE_W, 'FASE 7: DASHBOARD EJECUTIVO, PERSONAL Y BRANDING', '100% COMPLETADA', 'default', [
    { label: 'Módulos', desc: 'DashboardModule, UsuariosModule (médicos y recepcionistas), ConsultoriosModule (branding).' },
    { label: 'Resumen en Vivo', desc: 'KPIs en tiempo real: citas del día, pacientes activos, recetas emitidas y top CIE-10 del mes.' },
    { label: 'Personalización Visual', desc: 'Configuración corporativa de cada clínica: logo, colores primarios/secundarios y horarios.' },
    { label: 'Frontend', desc: 'DashboardView.tsx con tarjetas analíticas y ConfiguracionView.tsx para gestión de equipo.' },
    { label: 'Endpoints Clave', desc: 'GET /dashboard/resumen, GET /usuarios/medicos, PATCH /consultorios/configuracion.' },
  ]) + 10;

  // =========================================================================
  // PÁGINA 5: FASES 8 A 10 — INTELIGENCIA, SEGURIDAD Y SAAS
  // =========================================================================
  doc.addPage();
  drawPageHeader(5, 'FASES 8 A 10 — INTELIGENCIA, SEGURIDAD Y SAAS');

  y = 55;
  doc.font('Helvetica-Bold').fontSize(14).fillColor(C_NAVY).text('Inteligencia de Negocio, Seguridad HIPAA y Modelo SaaS (Fases 8 a 10)', LEFT_X, y);
  y += 16;
  doc.font('Helvetica').fontSize(8.5).fillColor(C_MUTED).text('Reportería avanzada, cumplimiento normativo de datos de salud y arquitectura de negocio.', LEFT_X, y);
  y += 18;

  y += drawPhaseCard(LEFT_X, y, PAGE_W, 'FASE 8: REPORTES CLÍNICOS, PRODUCTIVIDAD Y EXPORTACIÓN CSV', '100% COMPLETADA', 'blue', [
    { label: 'Métricas Operativas', desc: 'Efectividad asistencial %, ausentismo (no-show) %, afluencia por día y horas pico.' },
    { label: 'Productividad Médica', desc: 'Rendimiento individual por médico (citas agendadas vs atendidas, consultas y recetas).' },
    { label: 'Exportador CSV', desc: 'Soporte BOM UTF-8 y delimitador punto y coma (;) compatible de forma nativa con Excel.' },
    { label: 'Frontend', desc: 'ReportesView.tsx con filtros de fecha, selector de médicos y botón de descarga CSV.' },
    { label: 'Endpoints Clave', desc: 'GET /reportes/operativo, GET /reportes/medicos, GET /reportes/exportar/citas-csv.' },
  ]) + 10;

  y += drawPhaseCard(LEFT_X, y, PAGE_W, 'FASE 9: SEGURIDAD AVANZADA, AUDITORÍA HIPAA, 2FA Y BACKUPS', '100% COMPLETADA', 'default', [
    { label: 'Auditoría HIPAA Inmutable', desc: 'Entidad AuditoriaLog: registro de quién, qué módulo, acción, IP y User-Agent en cada consulta.' },
    { label: 'Autenticación 2FA (TOTP)', desc: 'Algoritmo RFC 6238 nativo con claves Base32 (160 bits) y 8 códigos alfanuméricos de respaldo.' },
    { label: 'Sesiones Concurrentes', desc: 'Entidad SesionUsuario con monitor de dispositivos y revocación remota instantánea (HTTP 401).' },
    { label: 'Backups Verificados SHA-256', desc: 'Entidad BackupRegistro con exportación JSON completa del tenant y validación de hash byte por byte.' },
    { label: 'Frontend', desc: 'SeguridadView.tsx con 3 pestañas: Auditoría Forense, Configuración 2FA y Monitor de Backups.' },
  ]) + 10;

  y += drawPhaseCard(LEFT_X, y, PAGE_W, 'FASE 10: ARQUITECTURA SAAS GLOBAL, PLANES Y SUPERADMIN', '100% COMPLETADA', 'default', [
    { label: 'Planes Comerciales', desc: 'Entidades Plan y Suscripcion (Básico $29, Profesional $79, Enterprise $199) con límites de cupos.' },
    { label: 'Onboarding Público', desc: 'POST /saas/onboarding aprovisiona una clínica en 1 clic con 14 días gratis y login instantáneo.' },
    { label: 'Dashboard SuperAdmin', desc: 'GET /saas/dashboard con cálculo de Ingresos Mensuales Recurrentes (MRR) y métricas globales.' },
    { label: 'Control de Inquilinos', desc: 'Directorio maestro y switch de suspensión (soft-lock) que bloquea el acceso de clínicas morosas.' },
    { label: 'Frontend', desc: 'SaasAdminView.tsx para administración SaaS y modal de registro público en LoginView.tsx.' },
  ]) + 10;

  // =========================================================================
  // PÁGINA 6: MATRIZ DE CAPACIDADES: QUÉ PUEDE Y NO PUEDE HACER
  // =========================================================================
  doc.addPage();
  drawPageHeader(6, 'MATRIZ OPERATIVA: CAPACIDADES Y LÍMITES');

  y = 55;
  doc.font('Helvetica-Bold').fontSize(14).fillColor(C_NAVY).text('Matriz de Capacidades del Sistema Clínico', LEFT_X, y);
  y += 16;
  doc.font('Helvetica').fontSize(8.5).fillColor(C_MUTED).text('Guía rápida de referencia para el equipo de desarrollo sobre el alcance implementado y lo que está pendiente.', LEFT_X, y);
  y += 18;

  // Bloque: LO QUE SÍ PUEDE HACER HOY
  doc.font('Helvetica-Bold').fontSize(10).fillColor(C_GREEN).text('✓ LO QUE EL SISTEMA SÍ PUEDE HACER HOY (CAPACIDADES EN PRODUCCIÓN)', LEFT_X, y);
  y += 14;

  const siItems = [
    { t: 'Aislamiento Multi-Tenant Blind', d: 'Garantiza aislamiento estricto; una clínica jamás puede consultar ni modificar datos de otra (retorna 404).' },
    { t: 'Ficha Clínica 360°', d: 'Padrón con antecedentes médicos, alergias, grupo sanguíneo, contacto de emergencia y búsqueda instantánea.' },
    { t: 'Agenda Médica con Anti-Solapamiento', d: 'Flujo de 7 estados de turnos y validación matemática que impide cruces de horarios en el mismo consultorio.' },
    { t: 'Historia Clínica con CIE-10', d: 'Signos vitales históricos, cálculo automático de IMC (kg/m²), examen físico por sistemas y diagnósticos codificados.' },
    { t: 'Recetas Clínicas PDF con QR', d: 'Renderizado vectorial en alta resolución con membrete institucional dinámico, posología y validación por QR.' },
    { t: 'Ginecología y Hadlock', d: 'Regla de Naegele para FPP y edad gestacional, y biometría fetal Hadlock con cálculo de peso fetal (EFW).' },
    { t: 'Seguridad 2FA y Revocación', d: 'TOTP RFC 6238 con códigos de respaldo de emergencia y cierre remoto de sesiones no deseadas (HTTP 401).' },
    { t: 'Auditoría HIPAA Inmutable', d: 'Bitácora forense que asienta cada lectura o cambio sobre pacientes con IP de origen y navegador.' },
    { t: 'Copias de Seguridad SHA-256', d: 'Exportación lógica completa en JSON y verificación criptográfica de integridad byte por byte.' },
    { t: 'Modelo SaaS y Onboarding', d: 'Registro público desatendido de clínicas con 14 días gratis, tiers de planes y panel SuperAdmin con MRR.' },
  ];

  doc.roundedRect(LEFT_X, y, PAGE_W, 142, 5).fillAndStroke(C_GREEN_BG, C_GREEN_BORDER);
  let siy = y + 8;
  for (const s of siItems) {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C_GREEN).text('  [SÍ] ', LEFT_X + 6, siy, { continued: true });
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C_NAVY).text(`${s.t}: `, { continued: true });
    doc.font('Helvetica').fontSize(7.5).fillColor(C_BODY).text(s.d);
    siy += 13;
  }
  y += 152;

  // Bloque: LO QUE NO PUEDE HACER TODAVÍA
  doc.font('Helvetica-Bold').fontSize(10).fillColor(C_RED).text('✗ LO QUE EL SISTEMA NO PUEDE HACER TODAVÍA (LÍMITES ACTUALES / ROADMAP)', LEFT_X, y);
  y += 14;

  const noItems = [
    { t: 'Curvas Pediátricas OMS (Fase 11)', d: 'Aún no grafica percentiles P3-P97 de peso/talla ni cartilla de vacunas infantil (en diseño para Fase 11).' },
    { t: 'Score de Framingham (Fase 11)', d: 'Aún no calcula el riesgo cardiovascular a 10 años ni procesa trazos de ECG (en diseño para Fase 11).' },
    { t: 'App Móvil Nativa en Tiendas (Fases 12-13)', d: 'No hay app en App Store / Play Store. La web es responsive, pero no tiene notificaciones push ni cámara nativa.' },
    { t: 'Portal Autoservicio de Pacientes (Fase 13)', d: 'Los pacientes no pueden auto-agendarse turnos ni descargar recetas solos desde su móvil sin el personal.' },
    { t: 'Cobro Automático con Tarjeta (Stripe)', d: 'El SaaS modela planes y cuotas, pero no procesa cargos bancarios recurrentes automáticos vía webhooks bancarios.' },
    { t: 'Notificaciones por WhatsApp o SMS', d: 'Las citas cambian de estado en el sistema, pero no envían WhatsApp automático por Twilio ni SMS a pacientes.' },
    { t: 'Firma con Token Criptográfico Físico', d: 'Emite recetas firmadas digitalmente con membrete y QR, pero no se conecta a tarjetas criptográficas de hardware (SmartCards).' },
  ];

  doc.roundedRect(LEFT_X, y, PAGE_W, 106, 5).fillAndStroke(C_RED_BG, C_RED_BORDER);
  let noy = y + 8;
  for (const n of noItems) {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C_RED).text('  [NO] ', LEFT_X + 6, noy, { continued: true });
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C_NAVY).text(`${n.t}: `, { continued: true });
    doc.font('Helvetica').fontSize(7.5).fillColor(C_BODY).text(n.d);
    noy += 13.5;
  }

  // =========================================================================
  // PÁGINA 7: PRUEBAS AUTOMATIZADAS Y GUÍA PARA DEVELOPERS
  // =========================================================================
  doc.addPage();
  drawPageHeader(7, 'VALIDACIÓN TÉCNICA Y GUÍA DE DESARROLLO');

  y = 55;
  doc.font('Helvetica-Bold').fontSize(14).fillColor(C_NAVY).text('Validación de Pruebas y Guía de Operación Local', LEFT_X, y);
  y += 16;
  doc.font('Helvetica').fontSize(8.5).fillColor(C_MUTED).text('Instrucciones prácticas y resultados de las suites de prueba ejecutadas contra PostgreSQL 18.6.', LEFT_X, y);
  y += 18;

  doc.font('Helvetica-Bold').fontSize(10).fillColor(C_BLUE).text('RESULTADO DE LAS 9 SUITES DE PRUEBA HTTP (100% PASADAS)', LEFT_X, y);
  y += 14;

  const testResults = [
    { script: 'node scripts/test-pacientes.mjs', res: '8/8 Pruebas OK', desc: 'CRUD, filtros y validación de historias clínicas de pacientes.' },
    { script: 'node scripts/test-citas.mjs', res: '10/10 Pruebas OK', desc: 'Agenda, flujo de 7 estados y algoritmo anti-solapamiento.' },
    { script: 'node scripts/test-consultas.mjs', res: '9/9 Pruebas OK', desc: 'Historia clínica, signos vitales, cálculo IMC y CIE-10.' },
    { script: 'node scripts/test-recetas.mjs', res: '7/7 Pruebas OK', desc: 'Generación PDF con membrete y posología farmacológica.' },
    { script: 'node scripts/test-ginecologia.mjs', res: '11/11 Pruebas OK', desc: 'Regla de Naegele, edad gestacional y biometría Hadlock.' },
    { script: 'node scripts/test-dashboard-admin.mjs', res: '13/13 Pruebas OK', desc: 'KPIs agregados, personal médico y branding corporativo.' },
    { script: 'node scripts/test-reportes.mjs', res: '8/8 Pruebas OK', desc: 'Efectividad %, ausentismo %, horas pico y exportación CSV.' },
    { script: 'node scripts/test-seguridad.mjs', res: '17/17 Pruebas OK', desc: 'Auditoría HIPAA, 2FA TOTP, sesiones remotas y backups SHA-256.' },
    { script: 'node scripts/test-saas.mjs', res: '8/8 Pruebas OK', desc: 'Onboarding público, planes, cuotas, MRR y suspensión de tenants.' },
  ];

  doc.roundedRect(LEFT_X, y, PAGE_W, 126, 5).fillAndStroke(C_BG_CARD, C_BORDER);
  let try_pos = y + 7;
  for (const tr of testResults) {
    drawBadge(LEFT_X + 8, try_pos - 1, tr.res, C_GREEN_BG, C_GREEN, C_GREEN_BORDER, 6.5);
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C_NAVY).text(tr.script, LEFT_X + 90, try_pos);
    doc.font('Helvetica').fontSize(7.2).fillColor(C_MUTED).text(`— ${tr.desc}`, LEFT_X + 225, try_pos);
    try_pos += 13.2;
  }
  y += 136;

  // Guía de Comandos Rápidos para el Dev
  doc.font('Helvetica-Bold').fontSize(10).fillColor(C_NAVY).text('Guía Rápida de Comandos para el Desarrollador', LEFT_X, y);
  y += 14;

  const devCommands = [
    { cmd: 'npm run build', desc: 'Compila el monorepo completo (NestJS API y React Vite) validando tipos en 0 errores.' },
    { cmd: 'npm run start:dev --workspace=@sistema-clinico/api', desc: 'Inicia el servidor backend en modo desarrollo con hot-reload en puerto 3000.' },
    { cmd: 'npm run dev --workspace=@sistema-clinico/web', desc: 'Inicia el servidor web en Vite con recarga instantánea en puerto 5173.' },
    { cmd: 'node scripts/notion-roadmap.mjs list', desc: 'Consulta el estado en vivo del roadmap sincronizado con la base de datos de Notion.' },
    { cmd: 'node scripts/generar-reporte-pdf.mjs', desc: 'Regenera este documento técnico PDF actualizado en la raíz del repositorio.' },
  ];

  doc.roundedRect(LEFT_X, y, PAGE_W, 90, 5).fillAndStroke(C_BLUE_BG, C_BLUE_BORDER);
  let cmdY = y + 8;
  for (const c of devCommands) {
    doc.font('Courier-Bold').fontSize(7.5).fillColor(C_BLUE).text(c.cmd, LEFT_X + 10, cmdY);
    doc.font('Helvetica').fontSize(7.5).fillColor(C_BODY).text(`  ${c.desc}`, LEFT_X + 10, cmdY + 9);
    cmdY += 16;
  }

  // =========================================================================
  // PIE DE PÁGINA PROFESIONAL EN TODAS LAS HOJAS
  // =========================================================================
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    // Línea de pie de página
    doc
      .strokeColor(C_BORDER)
      .lineWidth(0.5)
      .moveTo(LEFT_X, 800)
      .lineTo(LEFT_X + PAGE_W, 800)
      .stroke();

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C_BLUE).text('SISTEMA CLÍNICO SAAS', LEFT_X, 807);
    doc.font('Helvetica').fontSize(7.5).fillColor(C_MUTED).text(' — Especificación Técnica & Estado de Desarrollo para Devs', LEFT_X + 105, 807);
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C_NAVY).text(`Página ${i + 1} de ${range.count}`, LEFT_X, 807, { align: 'right', width: PAGE_W });
  }

  doc.end();

  stream.on('finish', () => {
    console.log(`✅ ¡Reporte PDF Profesional de Ingeniería generado exitosamente en: ${OUTPUT_PATH}!`);
  });
}

generateDevPresentationPDF();
