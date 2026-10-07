import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';

const OUTPUT_PATH = path.resolve(process.cwd(), 'Gestia_Propuesta_Modulos_Clinica.pdf');
const ALT_OUTPUT_PATH = path.resolve(process.cwd(), 'Gestia_Mejoras_Rediseno_Multimodulo.pdf');

function generarPDFCliente() {
  console.log('Generando documento ejecutivo limpio para presentación al cliente...');

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 44, bottom: 44, left: 46, right: 46 },
    bufferPages: true,
  });

  const stream = fs.createWriteStream(OUTPUT_PATH);
  doc.pipe(stream);

  // Paleta minimalista y sobria (diseño corporativo de salud)
  const C_DARK = '#0f172a';       // Slate 900 - Títulos principales
  const C_BODY = '#334155';       // Slate 700 - Texto principal
  const C_MUTED = '#64748b';      // Slate 500 - Subtítulos y metadatos
  const C_PRIMARY = '#0369a1';    // Sky 700 - Azul clínico sobrio
  const C_BORDER = '#e2e8f0';     // Slate 200 - Líneas sutiles
  const C_BG_CARD = '#f8fafc';    // Slate 50 - Fondos suaves

  const PAGE_W = 503;             // 595 - 46 - 46
  const LEFT_X = 46;

  // Helper: Encabezado elegante y limpio
  const drawHeader = (titulo, subtitulo) => {
    // Línea superior delgada
    doc.rect(LEFT_X, 36, PAGE_W, 2).fill(C_PRIMARY);

    doc.font('Helvetica-Bold').fontSize(16).fillColor(C_DARK).text('GESTIA', LEFT_X, 46, { continued: true });
    doc.font('Helvetica').fontSize(9).fillColor(C_MUTED).text('   |   SISTEMA DE GESTIÓN CLÍNICA');

    doc.font('Helvetica').fontSize(8).fillColor(C_MUTED).text('PROPUESTA TÉCNICA Y OPERATIVA', LEFT_X, 49, { align: 'right', width: PAGE_W });

    doc.strokeColor(C_BORDER).lineWidth(0.6).moveTo(LEFT_X, 68).lineTo(LEFT_X + PAGE_W, 68).stroke();

    doc.font('Helvetica-Bold').fontSize(12).fillColor(C_DARK).text(titulo, LEFT_X, 78);
    if (subtitulo) {
      doc.font('Helvetica').fontSize(8.5).fillColor(C_MUTED).text(subtitulo, LEFT_X, 93);
    }

    doc.strokeColor(C_BORDER).lineWidth(0.6).moveTo(LEFT_X, 107).lineTo(LEFT_X + PAGE_W, 107).stroke();
  };

  // Helper: Caja de Módulo Limpia (sin ruido visual)
  const drawModuleSection = (y, icono, titulo, subtitulo, puntos) => {
    const cardPadding = 12;
    let contentH = 26; // Titulo y subtitulo
    for (const p of puntos) {
      contentH += 25; // cada punto
    }
    const cardH = contentH + cardPadding * 2;

    // Fondo limpio con borde sutil
    doc.roundedRect(LEFT_X, y, PAGE_W, cardH, 4).fillAndStroke(C_BG_CARD, C_BORDER);
    // Acento lateral izquierdo muy limpio
    doc.rect(LEFT_X, y, 3, cardH).fill(C_PRIMARY);

    // Título del módulo
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(C_DARK).text(`${icono}  ${titulo}`, LEFT_X + cardPadding + 2, y + cardPadding);
    doc.font('Helvetica').fontSize(8).fillColor(C_MUTED).text(subtitulo, LEFT_X + cardPadding + 2, y + cardPadding + 14);

    // Línea separadora suave
    doc.strokeColor(C_BORDER).lineWidth(0.5)
      .moveTo(LEFT_X + cardPadding, y + cardPadding + 25)
      .lineTo(LEFT_X + PAGE_W - cardPadding, y + cardPadding + 25)
      .stroke();

    let curY = y + cardPadding + 32;
    for (const p of puntos) {
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C_DARK).text(`•  ${p.titulo}: `, LEFT_X + cardPadding + 4, curY, { continued: true });
      doc.font('Helvetica').fontSize(8.2).fillColor(C_BODY).text(p.desc, { width: PAGE_W - (cardPadding * 2) - 10, lineGap: 1.5 });
      curY += 25;
    }

    return y + cardH + 12;
  };

  // ==========================================
  // PÁGINA 1: PRESENTACIÓN Y MÓDULOS 1 Y 2
  // ==========================================
  drawHeader(
    'Arquitectura Modular Especializada por Áreas de Trabajo',
    'Separación de funciones para médicos, facturación, secretaría y archivo clínico'
  );

  let y = 118;

  // Resumen Ejecutivo breve para el cliente
  doc.font('Helvetica').fontSize(8.5).fillColor(C_BODY).text(
    'Gestia transforma la operativa de la clínica mediante un portal de acceso organizado por carpetas funcionales. Al ingresar a la plataforma, cada profesional visualiza únicamente las herramientas pertinentes a su labor, agilizando el flujo diario de atención, evitando distracciones administrativas y garantizando la total confidencialidad de la información médica.',
    LEFT_X,
    y,
    { width: PAGE_W, lineGap: 2.2 }
  );

  y += 44;

  // 1. GESTIÓN MÉDICA
  y = drawModuleSection(
    y,
    '🏥',
    'Carpeta 1: Gestión Médica',
    'Espacio exclusivo para el personal médico y asistencial',
    [
      {
        titulo: 'Monitor de Pacientes del Día en Tiempo Real',
        desc: 'Visualización clara de la sala de espera: control de quién llegó, quién está en consulta, pacientes atendidos e inasistencias en tiempo real.',
      },
      {
        titulo: 'Ficha Clínica Integrada en la Consulta',
        desc: 'El médico accede y actualiza el expediente del paciente directamente desde la cita médica, sin necesidad de cambiar de pantalla ni salir a otros módulos.',
      },
      {
        titulo: 'Diagnóstico y Evolución Médica',
        desc: 'Registro ordenado de motivo de consulta, observaciones clínicas, diagnósticos y trazabilidad completa de atenciones previas.',
      },
      {
        titulo: 'Tratamiento y Recetas Médicas',
        desc: 'Prescripción de medicamentos con posología y plazo de tratamiento, con emisión inmediata de receta médica en formato digital e imprimible.',
      },
    ]
  );

  // 2. FACTURACIÓN
  y = drawModuleSection(
    y,
    '💳',
    'Carpeta 2: Facturación',
    'Acceso reservado exclusivamente para el facturador y área administrativa',
    [
      {
        titulo: 'Acceso Restringido y Seguro',
        desc: 'Módulo diseñado exclusivamente para el responsable de cobranzas y facturación, protegiendo las notas médicas confidenciales.',
      },
      {
        titulo: 'Facturación Segmentada por Servicio',
        desc: 'Generación de facturas virtuales diferenciadas por tipo de prestación: Consultas Médicas, Pruebas de Laboratorio, Imagenología (rayos X, ecografías) y Procedimientos.',
      },
      {
        titulo: 'Gestión de Aseguradoras y Copagos',
        desc: 'Registro de coberturas de seguros médicos, cálculo automatizado de porcentajes cubiertos y cobro transparente al paciente.',
      },
      {
        titulo: 'Control de Cobranzas y Saldos Pendientes',
        desc: 'Historial completo de pagos y seguimiento ordenado de cuentas por cobrar para un cuadre de caja preciso.',
      },
    ]
  );

  // Pie de página 1
  doc.font('Helvetica').fontSize(7.5).fillColor(C_MUTED).text(
    'Gestia • Propuesta de Solución Clínica   |   Página 1 de 2',
    LEFT_X,
    792
  );

  // ==========================================
  // PÁGINA 2: MÓDULOS 3 Y 4 + SEGURIDAD
  // ==========================================
  doc.addPage();
  drawHeader(
    'Recepción, Expedientes Clínicos y Confidencialidad',
    'Herramientas para secretaría, archivo central y resguardo de la información'
  );

  y = 118;

  // 3. SECRETARÍA / ASISTENTE
  y = drawModuleSection(
    y,
    '📋',
    'Carpeta 3: Secretaría / Asistente',
    'Diseñado para el personal de recepción, atención al paciente y admisión',
    [
      {
        titulo: 'Agenda Médica Centralizada',
        desc: 'Agendamiento y confirmación de citas por médico y especialidad, reprogramación de turnos y control de cancelaciones.',
      },
      {
        titulo: 'Admisión Rápida de Pacientes',
        desc: 'Consulta y actualización ágil de datos de contacto, teléfonos, direcciones y datos de seguro antes de la consulta.',
      },
      {
        titulo: 'Carga de Resultados Externos',
        desc: 'Herramienta para adjuntar de inmediato informes de laboratorio, resultados de biopsias e imágenes de estudios al expediente del paciente.',
      },
    ]
  );

  // 4. BASE DE DATOS DE PACIENTES
  y = drawModuleSection(
    y,
    '🗄️',
    'Carpeta 4: Base de Datos de Pacientes',
    'Archivo clínico digital con búsqueda multicriterio y expediente integral',
    [
      {
        titulo: 'Filtros y Búsqueda Inmediata',
        desc: 'Organización de pacientes por orden alfabético, por médico que lo atiende, por aseguradora o por fecha de última visita.',
      },
      {
        titulo: 'Ficha Maestra al Hacer Clic',
        desc: 'Al seleccionar un paciente se despliega su información esencial: Nombre, edad, cédula de identidad, aseguradora, número de póliza y médicos tratantes.',
      },
      {
        titulo: 'Historial de Pruebas Diagnósticas',
        desc: 'Control cronológico de estudios clave: visualización clara de resultados de Papanicolao (ej. resultado de hace 6 meses), analíticas de laboratorio e imágenes asociadas.',
      },
    ]
  );

  // Sección de Seguridad y Garantías Operativas
  doc.roundedRect(LEFT_X, y, PAGE_W, 70, 4).fillAndStroke('#f0f9ff', '#bae6fd');
  doc.rect(LEFT_X, y, 3, 70).fill(C_PRIMARY);

  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C_DARK).text('🔒  Garantías de Seguridad y Confidencialidad Médica', LEFT_X + 14, y + 10);
  doc.font('Helvetica').fontSize(8.2).fillColor(C_BODY).text(
    '• Privacidad Estricta por Roles: Cada colaborador accede únicamente a lo necesario para su función. El personal administrativo no accede a notas médicas íntimas, y el personal médico cuenta con un entorno libre de procesos de cobro.\n• Resguardo de Información Sensible: Historiales protegidos contra accesos no autorizados y respaldo periódico continuo de la información de la clínica.',
    LEFT_X + 14,
    y + 25,
    { width: PAGE_W - 28, lineGap: 2 }
  );

  // Pie de página 2
  doc.font('Helvetica').fontSize(7.5).fillColor(C_MUTED).text(
    'Gestia • Propuesta de Solución Clínica   |   Página 2 de 2',
    LEFT_X,
    792
  );

  doc.end();

  stream.on('finish', () => {
    // Copiar también al nombre previo para sincronización
    fs.copyFileSync(OUTPUT_PATH, ALT_OUTPUT_PATH);
    console.log(`✅ PDF limpio para cliente generado en: ${OUTPUT_PATH}`);
  });
}

generarPDFCliente();
