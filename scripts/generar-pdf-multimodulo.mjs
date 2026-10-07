import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';

const OUTPUT_PATH = path.resolve(process.cwd(), 'Gestia_Mejoras_Rediseno_Multimodulo.pdf');

function generarPDF() {
  console.log('Generando documento PDF de alta calidad con PDFKit...');

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 38, bottom: 40, left: 38, right: 38 },
    bufferPages: true,
  });

  const stream = fs.createWriteStream(OUTPUT_PATH);
  doc.pipe(stream);

  // Paleta de diseño ejecutivo clínico
  const C_NAVY = '#0f172a';       // Slate 900
  const C_DARK = '#1e293b';       // Slate 800
  const C_BODY = '#334155';       // Slate 700
  const C_MUTED = '#64748b';      // Slate 500
  const C_BORDER = '#cbd5e1';     // Slate 300
  const C_BG_CARD = '#f8fafc';    // Slate 50
  const C_WHITE = '#ffffff';

  const C_SKY = '#0284c7';        // Sky 600
  const C_SKY_BG = '#f0f9ff';     // Sky 50
  const C_SKY_BORDER = '#bae6fd'; // Sky 200

  const C_EMERALD = '#059669';    // Emerald 600
  const C_EMERALD_BG = '#ecfdf5'; // Emerald 50
  const C_EMERALD_BORDER = '#a7f3d0';

  const C_PURPLE = '#7c3aed';     // Violet 600
  const C_PURPLE_BG = '#f5f3ff';  // Violet 50
  const C_PURPLE_BORDER = '#ddd6fe';

  const C_AMBER = '#d97706';      // Amber 600
  const C_AMBER_BG = '#fffbeb';   // Amber 50
  const C_AMBER_BORDER = '#fde68a';

  const C_ROSE = '#e11d48';       // Rose 600
  const C_ROSE_BG = '#fff1f2';    // Rose 50
  const C_ROSE_BORDER = '#fecdd3';

  const PAGE_W = 519;             // 595 - 38 - 38
  const LEFT_X = 38;

  // Helper Badge
  const drawBadge = (x, y, text, bgCol, textCol, borderCol = null, fontSize = 7.5) => {
    doc.font('Helvetica-Bold').fontSize(fontSize);
    const textW = doc.widthOfString(text);
    const padX = 6;
    const h = 13;
    const w = textW + padX * 2;

    doc.roundedRect(x, y, w, h, 3).fill(bgCol);
    if (borderCol) {
      doc.roundedRect(x, y, w, h, 3).lineWidth(0.5).stroke(borderCol);
    }
    doc.fillColor(textCol).text(text, x + padX, y + 2.5);
    return w;
  };

  // Helper Header
  const drawHeader = (titulo, subtitulo) => {
    // Barra superior
    doc.rect(LEFT_X, 36, PAGE_W, 3).fill(C_SKY);

    // Marca y subtítulo
    doc.font('Helvetica-Bold').fontSize(18).fillColor(C_NAVY).text('GESTIA', LEFT_X, 46, { continued: true });
    doc.font('Helvetica-Bold').fontSize(9).fillColor(C_SKY).text('   SUITE CLÍNICA PROFESIONAL');

    drawBadge(LEFT_X + PAGE_W - 135, 47, 'VERSIÓN 2.0 • OCTUBRE 2026', C_SKY_BG, C_SKY, C_SKY_BORDER, 7.5);

    doc.font('Helvetica-Bold').fontSize(11).fillColor(C_DARK).text(titulo, LEFT_X, 70);
    if (subtitulo) {
      doc.font('Helvetica').fontSize(8.5).fillColor(C_MUTED).text(subtitulo, LEFT_X, 84);
    }

    doc.strokeColor(C_BORDER).lineWidth(0.5).moveTo(LEFT_X, 98).lineTo(LEFT_X + PAGE_W, 98).stroke();
  };

  // Helper Section Title
  const drawSectionTitle = (y, num, text) => {
    doc.roundedRect(LEFT_X, y, 16, 16, 3).fill(C_SKY);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(C_WHITE).text(num, LEFT_X + 4.5, y + 3);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(C_NAVY).text(text, LEFT_X + 22, y + 2.5);

    doc.strokeColor(C_BORDER).lineWidth(0.5).moveTo(LEFT_X, y + 21).lineTo(LEFT_X + PAGE_W, y + 21).stroke();
    return y + 28;
  };

  // ==========================================
  // PÁGINA 1: PORTAL LAUNCHER Y MATRIZ DE ROLES
  // ==========================================
  drawHeader(
    'Especificación y Roadmap de Mejoras: Arquitectura Multimódulo',
    'Documento técnico de arquitectura, separación de roles por carpeta y gobernanza clínica'
  );

  let y = 108;

  // Tarjeta Resumen de Visión
  doc.roundedRect(LEFT_X, y, PAGE_W, 58, 5).fillAndStroke(C_BG_CARD, C_BORDER);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(C_NAVY).text('🎯 Transformación de Arquitectura de Producto', LEFT_X + 12, y + 8);
  doc.font('Helvetica').fontSize(8).fillColor(C_BODY).text(
    'El sistema evoluciona de un panel monolítico con pestañas fijas a una Plataforma Modular por Carpetas/Roles. Al iniciar sesión, el usuario ya no es dirigido a un dashboard arbitrario, sino a un Portal Launcher que le presenta de forma clara y visual únicamente las áreas operativas autorizadas para su rol (Médico, Facturación, Secretaría, Base de Datos o Administración), garantizando confidencialidad médica y eficiencia en el flujo clínico.',
    LEFT_X + 12,
    y + 20,
    { width: PAGE_W - 24, lineGap: 1.5 }
  );

  y += 68;

  // Sección 1: Matriz RBAC
  y = drawSectionTitle(y, '1', 'Matriz de Control de Acceso por Rol (RBAC)');

  doc.font('Helvetica').fontSize(8).fillColor(C_MUTED).text(
    'Segregación estricta de funciones: cada profesional solo visualiza las herramientas pertinentes a su trabajo diario.',
    LEFT_X,
    y
  );
  y += 12;

  // Tabla RBAC
  const colW = [169, 70, 70, 70, 70, 70];
  const tableH = 18;

  // Header tabla
  doc.roundedRect(LEFT_X, y, PAGE_W, tableH, 3).fill(C_NAVY);
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C_WHITE);
  doc.text('MÓDULO CLÍNICO', LEFT_X + 8, y + 5);
  doc.text('MÉDICO', LEFT_X + 175, y + 5);
  doc.text('FACTURADOR', LEFT_X + 245, y + 5);
  doc.text('SECRETARÍA', LEFT_X + 315, y + 5);
  doc.text('DIRECTOR', LEFT_X + 385, y + 5);
  doc.text('SUPERADMIN', LEFT_X + 455, y + 5);

  y += tableH;

  const rows = [
    { mod: 'Gestión Médica (Consultas, Recetas, Citas)', med: 'ACCESO', fac: 'BLOQUEO', sec: 'BLOQUEO', adm: 'ACCESO', saas: '—' },
    { mod: 'Facturación Virtual (Consultas, Labs, Imágenes)', med: 'BLOQUEO', fac: 'ACCESO', sec: 'BLOQUEO', adm: 'ACCESO', saas: '—' },
    { mod: 'Secretaría (Agenda, Carga de Resultados)', med: 'BLOQUEO', fac: 'BLOQUEO', sec: 'ACCESO', adm: 'ACCESO', saas: '—' },
    { mod: 'Base de Datos (Expedientes, Cédula, Labs)', med: 'ACCESO', fac: 'BLOQUEO', sec: 'LECTURA', adm: 'TOTAL', saas: '—' },
    { mod: 'Administración (KPIs, Seguridad, Backups)', med: 'BLOQUEO', fac: 'BLOQUEO', sec: 'BLOQUEO', adm: 'ACCESO', saas: '—' },
    { mod: 'Plataforma SaaS (Tenants, Suscripciones)', med: 'BLOQUEO', fac: 'BLOQUEO', sec: 'BLOQUEO', adm: 'BLOQUEO', saas: 'TOTAL' },
  ];

  rows.forEach((r, idx) => {
    const bgRow = idx % 2 === 0 ? C_WHITE : C_BG_CARD;
    doc.rect(LEFT_X, y, PAGE_W, tableH).fill(bgRow);
    doc.strokeColor(C_BORDER).lineWidth(0.4).moveTo(LEFT_X, y + tableH).lineTo(LEFT_X + PAGE_W, y + tableH).stroke();

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C_DARK).text(r.mod, LEFT_X + 8, y + 5, { width: 160 });

    const printCell = (val, xOffset) => {
      if (val === 'ACCESO' || val === 'TOTAL') {
        drawBadge(LEFT_X + xOffset, y + 3, val, C_EMERALD_BG, C_EMERALD, C_EMERALD_BORDER, 6.5);
      } else if (val === 'LECTURA') {
        drawBadge(LEFT_X + xOffset, y + 3, val, C_PURPLE_BG, C_PURPLE, C_PURPLE_BORDER, 6.5);
      } else if (val === 'BLOQUEO') {
        drawBadge(LEFT_X + xOffset, y + 3, val, '#fee2e2', '#b91c1c', '#fca5a5', 6.5);
      } else {
        doc.font('Helvetica').fontSize(8).fillColor(C_MUTED).text(val, LEFT_X + xOffset + 10, y + 5);
      }
    };

    printCell(r.med, 175);
    printCell(r.fac, 245);
    printCell(r.sec, 315);
    printCell(r.adm, 385);
    printCell(r.saas, 455);

    y += tableH;
  });

  y += 14;

  // Sección 2: Módulos Clínicos (Parte 1: Gestión Médica y Facturación)
  y = drawSectionTitle(y, '2', 'Detalle Operativo de los Módulos Principales');

  // Tarjeta 1: Gestión Médica
  const cardW = (PAGE_W - 12) / 2;
  let cardH = 145;

  doc.roundedRect(LEFT_X, y, cardW, cardH, 5).fillAndStroke(C_WHITE, C_SKY_BORDER);
  doc.rect(LEFT_X, y, cardW, 3).fill(C_SKY);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C_NAVY).text('🏥 Gestión Médica', LEFT_X + 10, y + 9);
  drawBadge(LEFT_X + cardW - 75, y + 7, 'Médico & Admin', C_SKY_BG, C_SKY, C_SKY_BORDER, 6.5);

  doc.strokeColor(C_SKY_BORDER).lineWidth(0.4).moveTo(LEFT_X + 10, y + 25).lineTo(LEFT_X + cardW - 10, y + 25).stroke();

  let itemY = y + 30;
  const itemsMed = [
    { label: 'Monitor de Sala en Vivo', desc: 'Control de citas del día: Esperando en sala, En atención, Atendido o Inasistencia.' },
    { label: 'Ficha de Paciente Inline', desc: 'Panel lateral (drawer) para editar el historial completo sin salir de la cita médica.' },
    { label: 'Diagnóstico & Prescripción', desc: 'Evolución clínica estructurada, diagnóstico CIE y medicación con plazo de tratamiento.' },
    { label: 'Recetas en PDF con Firma', desc: 'Generación directa de recetas e indicaciones firmadas para impresión o envío.' },
  ];
  itemsMed.forEach((it) => {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C_DARK).text(`• ${it.label}: `, LEFT_X + 10, itemY, { continued: true });
    doc.font('Helvetica').fontSize(7.2).fillColor(C_BODY).text(it.desc, { width: cardW - 20, lineGap: 1 });
    itemY += 27;
  });

  // Tarjeta 2: Facturación Virtual
  const rightX = LEFT_X + cardW + 12;
  doc.roundedRect(rightX, y, cardW, cardH, 5).fillAndStroke(C_WHITE, C_EMERALD_BORDER);
  doc.rect(rightX, y, cardW, 3).fill(C_EMERALD);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C_NAVY).text('💳 Facturación Virtual', rightX + 10, y + 9);
  drawBadge(rightX + cardW - 85, y + 7, 'Facturador & Admin', C_EMERALD_BG, C_EMERALD, C_EMERALD_BORDER, 6.5);

  doc.strokeColor(C_EMERALD_BORDER).lineWidth(0.4).moveTo(rightX + 10, y + 25).lineTo(rightX + cardW - 10, y + 25).stroke();

  itemY = y + 30;
  const itemsFac = [
    { label: 'Facturación por Servicio', desc: 'Emisión electrónica segmentada: Consulta Médica, Laboratorio, Imágenes y Procedimientos.' },
    { label: 'Copagos & Aseguradoras', desc: 'Cálculo automatizado de cobertura según póliza del paciente y aseguradora asociada.' },
    { label: 'Historial & Liquidaciones', desc: 'Filtros avanzados por médico emisor, fecha, método de pago y estado de cobro.' },
    { label: 'Control de Saldos', desc: 'Panel de facturas impagas y control de cuentas por cobrar para el personal de caja.' },
  ];
  itemsFac.forEach((it) => {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C_DARK).text(`• ${it.label}: `, rightX + 10, itemY, { continued: true });
    doc.font('Helvetica').fontSize(7.2).fillColor(C_BODY).text(it.desc, { width: cardW - 20, lineGap: 1 });
    itemY += 27;
  });

  // Pie de página 1
  doc.font('Helvetica').fontSize(7).fillColor(C_MUTED).text('Gestia Clinic OS • Plataforma de Gestión Médica • Página 1 de 2', LEFT_X, 785);

  // ==========================================
  // PÁGINA 2: SECRETARÍA, BASE DE DATOS Y GIT
  // ==========================================
  doc.addPage();
  drawHeader(
    'Módulos de Apoyo, Seguridad Auditada y Protocolo Git',
    'Secretaría, Expedientes Clínicos, Blindaje de Datos y Metodología Profesional'
  );

  y = 108;

  // Sección 3: Secretaría y Base de Datos
  y = drawSectionTitle(y, '3', 'Módulos de Secretaría y Expedientes Clínicos');

  // Tarjeta 3: Secretaría
  doc.roundedRect(LEFT_X, y, cardW, 140, 5).fillAndStroke(C_WHITE, C_PURPLE_BORDER);
  doc.rect(LEFT_X, y, cardW, 3).fill(C_PURPLE);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C_NAVY).text('📋 Secretaría / Asistente', LEFT_X + 10, y + 9);
  drawBadge(LEFT_X + cardW - 80, y + 7, 'Recepción & Admin', C_PURPLE_BG, C_PURPLE, C_PURPLE_BORDER, 6.5);

  doc.strokeColor(C_PURPLE_BORDER).lineWidth(0.4).moveTo(LEFT_X + 10, y + 25).lineTo(LEFT_X + cardW - 10, y + 25).stroke();

  itemY = y + 30;
  const itemsSec = [
    { label: 'Agenda Médica Central', desc: 'Agendamiento y confirmación de turnos, reprogramaciones y filtro por especialista.' },
    { label: 'Admisión Exprés', desc: 'Registro ágil de pacientes en recepción, asignación de médico y datos de seguro.' },
    { label: 'Carga de Resultados', desc: 'Módulo para subir informes externos (PDF de biopsias, imágenes de ecografía, analíticas).' },
  ];
  itemsSec.forEach((it) => {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C_DARK).text(`• ${it.label}: `, LEFT_X + 10, itemY, { continued: true });
    doc.font('Helvetica').fontSize(7.2).fillColor(C_BODY).text(it.desc, { width: cardW - 20, lineGap: 1 });
    itemY += 34;
  });

  // Tarjeta 4: Base de Datos de Pacientes
  doc.roundedRect(rightX, y, cardW, 140, 5).fillAndStroke(C_WHITE, C_AMBER_BORDER);
  doc.rect(rightX, y, cardW, 3).fill(C_AMBER);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C_NAVY).text('🗄️ Base de Datos de Pacientes', rightX + 10, y + 9);
  drawBadge(rightX + cardW - 75, y + 7, 'Toda la Clínica', C_AMBER_BG, C_AMBER, C_AMBER_BORDER, 6.5);

  doc.strokeColor(C_AMBER_BORDER).lineWidth(0.4).moveTo(rightX + 10, y + 25).lineTo(rightX + cardW - 10, y + 25).stroke();

  itemY = y + 30;
  const itemsBD = [
    { label: 'Ficha Maestra Integral', desc: 'Cédula de identidad, número de póliza, aseguradora, médicos tratantes e historial de citas.' },
    { label: 'Filtros Multicriterio', desc: 'Búsqueda por orden alfabético, por compañía de seguros, por médico tratante y por fecha.' },
    { label: 'Historial de Pruebas Clave', desc: 'Registro cronológico de Papanicolao (resultado y fecha), laboratorios e imágenes diagnósticas.' },
  ];
  itemsBD.forEach((it) => {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C_DARK).text(`• ${it.label}: `, rightX + 10, itemY, { continued: true });
    doc.font('Helvetica').fontSize(7.2).fillColor(C_BODY).text(it.desc, { width: cardW - 20, lineGap: 1 });
    itemY += 34;
  });

  y += 152;

  // Sección 4: Blindajes de Seguridad Implementados
  y = drawSectionTitle(y, '4', 'Auditoría de Seguridad y Blindajes Implementados en Backend');

  const secW = (PAGE_W - 8) / 2;
  const secH = 50;

  // 4 cajas de seguridad
  const secBoxes = [
    { title: 'Anti-Escalada SUPERADMIN (CWE-269)', desc: 'Objeto RolTenant estricto en DTOs. Ningún colaborador puede asignarse ni elevar a SuperAdmin.', border: C_ROSE_BORDER, bg: C_ROSE_BG, tag: C_ROSE },
    { title: 'Bloqueo de Auto-Edición de Rol', desc: 'Si un usuario modifica su propio perfil, el controlador bloquea cualquier cambio en rolCodigo o activo.', border: C_PURPLE_BORDER, bg: C_PURPLE_BG, tag: C_PURPLE },
    { title: 'Protección Anti-Fuerza Bruta', desc: '5 intentos fallidos consecutivos bloquean la cuenta automáticamente por 15 minutos en DB PostgreSQL.', border: C_AMBER_BORDER, bg: C_AMBER_BG, tag: C_AMBER },
    { title: 'Rate Limiting & CORS Cerrado', desc: 'Límite reforzado (10 req/min en login, 5 en 2FA). Se eliminó comodín * para orígenes verificados.', border: C_SKY_BORDER, bg: C_SKY_BG, tag: C_SKY },
  ];

  secBoxes.forEach((bx, idx) => {
    const colX = idx % 2 === 0 ? LEFT_X : LEFT_X + secW + 8;
    const rowY = idx < 2 ? y : y + secH + 6;

    doc.roundedRect(colX, rowY, secW, secH, 4).fillAndStroke(C_WHITE, bx.border);
    doc.rect(colX, rowY, 3, secH).fill(bx.tag);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C_NAVY).text(bx.title, colX + 8, rowY + 6);
    doc.font('Helvetica').fontSize(7.2).fillColor(C_BODY).text(bx.desc, colX + 8, rowY + 18, { width: secW - 14, lineGap: 1 });
  });

  y += secH * 2 + 18;

  // Sección 5: Protocolo Git y Gestión Profesional del Código
  y = drawSectionTitle(y, '5', 'Gobernanza del Código Fuente y Gestión con Git');

  doc.roundedRect(LEFT_X, y, PAGE_W, 148, 5).fillAndStroke(C_NAVY, C_DARK);

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C_SKY).text('🔒 Recomendación Crítica: Repositorio GitHub Privado', LEFT_X + 12, y + 8);
  doc.font('Helvetica').fontSize(7.5).fillColor('#e2e8f0').text(
    'Al estar orientado a un producto comercial para una clínica, el repositorio debe mantenerse en estado PRIVADO para resguardar la propiedad intelectual, modelos de datos y lógica financiera ante accesos públicos no autorizados.',
    LEFT_X + 12,
    y + 20,
    { width: PAGE_W - 24, lineGap: 1.2 }
  );

  doc.strokeColor('#334155').lineWidth(0.5).moveTo(LEFT_X + 12, y + 42).lineTo(LEFT_X + PAGE_W - 12, y + 42).stroke();

  doc.font('Helvetica-Bold').fontSize(8).fillColor(C_WHITE).text('Comandos de Gestión y Buenas Prácticas Git:', LEFT_X + 12, y + 48);

  const gitLines = [
    '1. Pasar a Privado:  GitHub -> Repositorio "Sistema-clinico" -> Settings -> Danger Zone -> Change visibility -> Private',
    '2. Comprobación:     git status && git branch                                     (Ver estado limpio y rama main)',
    '3. Stage seguro:     git add apps/web/ apps/api/ docs/                            (Control de cambios atómicos por módulo)',
    '4. Commit semántico: git commit -m "feat: arquitectura multimodulo con portal launcher y blindaje de seguridad"',
    '5. Despliegue mint:  Regla estricta: NUNCA desplegar al servidor Linux Mint sin validación previa local y autorización.',
  ];

  let gitY = y + 62;
  gitLines.forEach((line) => {
    doc.font('Courier').fontSize(7.2).fillColor('#38bdf8').text(line, LEFT_X + 12, gitY, { width: PAGE_W - 24 });
    gitY += 15;
  });

  // Pie de página 2
  doc.font('Helvetica').fontSize(7).fillColor(C_MUTED).text('Gestia Clinic OS • Documentación Técnica de Arquitectura • Página 2 de 2', LEFT_X, 785);

  doc.end();

  stream.on('finish', () => {
    console.log(`✅ PDF generado exitosamente en: ${OUTPUT_PATH}`);
  });
}

generarPDF();
