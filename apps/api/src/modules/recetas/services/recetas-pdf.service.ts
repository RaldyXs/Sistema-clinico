import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Receta, EstadoReceta } from '../entities/receta.entity.js';

/**
 * Servicio generador de documentos médicos oficiales en formato PDF.
 *
 * Emplea PDFKit para renderizar prescripciones vectoriales de alta fidelidad:
 * - Membrete oficial del consultorio emisor
 * - Datos de filiación del paciente y médico tratante
 * - Sección Rp. (Prescripción) estructurada con posología y advertencias
 * - Control de anulación con marca de agua legal
 * - Firma profesional y cláusula de autenticidad
 */
@Injectable()
export class RecetasPdfService {
  /**
   * Genera el buffer del documento PDF de una receta médica.
   */
  async generarPdf(receta: Receta): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const medicoNombre = [receta.profesional?.nombre, receta.profesional?.apellido]
          .filter(Boolean)
          .join(' ') || 'Médico Tratante';

        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 40, bottom: 40, left: 45, right: 45 },
          info: {
            Title: `Receta Médica ${receta.numeroReceta}`,
            Author: medicoNombre,
            Subject: 'Prescripción Médica Oficial',
            Keywords: 'receta, prescripcion, clinica, salud',
            CreationDate: new Date(receta.fechaEmision),
          },
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        this.construirDocumento(doc, receta);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private construirDocumento(doc: InstanceType<typeof PDFDocument>, receta: Receta): void {
    const primaryColor = '#1e3a8a';   // Azul médico profundo
    const secondaryColor = '#0284c7'; // Azul cian / acento
    const textColor = '#1f2937';      // Gris grafito oscuro
    const mutedColor = '#6b7280';     // Gris intermedio
    const dangerColor = '#b91c1c';    // Rojo advertencia

    const anchoUtil = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const xInicio = doc.page.margins.left;

    // ─── 1. MEMBRETE SUPERIOR DEL CONSULTORIO ──────────────────────────────────
    doc.rect(xInicio, 35, anchoUtil, 4).fill(primaryColor);

    const consultorioNombre = receta.consultorio?.nombre || 'Consultorio Médico';
    const consultorioTel = receta.consultorio?.telefono ? `Tel: ${receta.consultorio.telefono}` : '';
    const consultorioDir = receta.consultorio?.direccion || '';

    doc.font('Helvetica-Bold').fontSize(16).fillColor(primaryColor);
    doc.text(consultorioNombre.toUpperCase(), xInicio, 48, { width: 320 });

    doc.font('Helvetica').fontSize(8).fillColor(mutedColor);
    const datosContacto = [consultorioDir, consultorioTel]
      .filter(Boolean)
      .join('  |  ');
    if (datosContacto) {
      doc.text(datosContacto, xInicio, doc.y + 2, { width: 320 });
    }

    // Cuadro de Folio y Fecha (Superior Derecho)
    const anchoFolioBox = 160;
    const xFolioBox = doc.page.width - doc.page.margins.right - anchoFolioBox;
    doc.roundedRect(xFolioBox, 45, anchoFolioBox, 48, 4).lineWidth(1).strokeColor('#cbd5e1').stroke();
    
    doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor);
    doc.text('RECETA MÉDICA OFICIAL', xFolioBox, 50, { width: anchoFolioBox, align: 'center' });
    
    doc.font('Helvetica-Bold').fontSize(11).fillColor(textColor);
    doc.text(receta.numeroReceta, xFolioBox, 62, { width: anchoFolioBox, align: 'center' });

    const fechaEmisionStr = new Date(receta.fechaEmision).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    doc.font('Helvetica').fontSize(8).fillColor(mutedColor);
    doc.text(`Fecha: ${fechaEmisionStr}`, xFolioBox, 77, { width: anchoFolioBox, align: 'center' });

    // ─── 2. ALERTA DE ESTADO (ANULADA) ─────────────────────────────────────────
    if (receta.estado === EstadoReceta.ANULADA) {
      doc.moveDown(1.5);
      const yAlerta = 105;
      doc.rect(xInicio, yAlerta, anchoUtil, 32).fill('#fee2e2');
      doc.rect(xInicio, yAlerta, 4, 32).fill(dangerColor);

      doc.font('Helvetica-Bold').fontSize(10).fillColor(dangerColor);
      doc.text('DOCUMENTO ANULADO - SIN VALIDEZ MÉDICA NI FARMACÉUTICA', xInicio + 12, yAlerta + 5);
      doc.font('Helvetica').fontSize(8).fillColor('#7f1d1d');
      doc.text(`Motivo: ${receta.motivoAnulacion || 'Sin motivo especificado'}`, xInicio + 12, yAlerta + 18);
      doc.y = yAlerta + 38;
    } else {
      doc.y = 105;
    }

    // ─── 3. FICHA DEL PACIENTE Y MÉDICO PRESCRIPTOR ────────────────────────────
    const yFicha = doc.y;
    doc.rect(xInicio, yFicha, anchoUtil, 64).fill('#f8fafc');
    doc.roundedRect(xInicio, yFicha, anchoUtil, 64, 3).lineWidth(0.5).strokeColor('#e2e8f0').stroke();

    // Columna Izquierda: Paciente
    const pacienteNombre = [receta.paciente?.nombre, receta.paciente?.apellido]
      .filter(Boolean)
      .join(' ') || 'Paciente';
    const pacienteDoc = receta.paciente?.documentoIdentidad ? `Doc: ${receta.paciente.documentoIdentidad}` : '';
    let pacienteEdad = '';
    if (receta.paciente?.fechaNacimiento) {
      const fn = new Date(receta.paciente.fechaNacimiento);
      const hoy = new Date();
      let edad = hoy.getFullYear() - fn.getFullYear();
      const m = hoy.getMonth() - fn.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < fn.getDate())) edad--;
      pacienteEdad = `Edad: ${edad} años`;
    }
    const pacienteSexo = receta.paciente?.genero ? `Género: ${receta.paciente.genero}` : '';

    doc.font('Helvetica-Bold').fontSize(8).fillColor(secondaryColor);
    doc.text('DATOS DEL PACIENTE', xInicio + 12, yFicha + 8);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(textColor);
    doc.text(pacienteNombre, xInicio + 12, yFicha + 20, { width: 240 });

    doc.font('Helvetica').fontSize(8).fillColor(mutedColor);
    const subDatosPaciente = [pacienteDoc, pacienteEdad, pacienteSexo].filter(Boolean).join('  |  ');
    doc.text(subDatosPaciente, xInicio + 12, yFicha + 35, { width: 240 });

    // Columna Derecha: Médico y Consulta
    const xColMed = xInicio + 270;
    const medicoNombre = [receta.profesional?.nombre, receta.profesional?.apellido]
      .filter(Boolean)
      .join(' ') || 'Profesional de la Salud';
    const medicoEmail = receta.profesional?.email || '';

    doc.font('Helvetica-Bold').fontSize(8).fillColor(secondaryColor);
    doc.text('MÉDICO PRESCRIPTOR', xColMed, yFicha + 8);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(textColor);
    doc.text(medicoNombre, xColMed, yFicha + 20, { width: 230 });

    doc.font('Helvetica').fontSize(8).fillColor(mutedColor);
    const vencimientoStr = receta.fechaVencimiento
      ? `Válida hasta: ${new Date(receta.fechaVencimiento).toLocaleDateString('es-ES')}`
      : 'Vigencia: 30 días';
    doc.text([medicoEmail, vencimientoStr].filter(Boolean).join('  |  '), xColMed, yFicha + 35, { width: 230 });

    doc.y = yFicha + 72;

    // ─── 4. DIAGNÓSTICO CLÍNICO DE REFERENCIA (Opcional) ───────────────────────
    if (receta.diagnosticoReferencia) {
      doc.moveDown(0.3);
      const yDiag = doc.y;
      doc.rect(xInicio, yDiag, anchoUtil, 22).fill('#f1f5f9');
      doc.font('Helvetica-Bold').fontSize(8).fillColor(primaryColor);
      doc.text('DIAGNÓSTICO CIE-10 / MOTIVO: ', xInicio + 10, yDiag + 6, { continued: true });
      doc.font('Helvetica').fontSize(8).fillColor(textColor);
      doc.text(receta.diagnosticoReferencia);
      doc.y = yDiag + 28;
    }

    // ─── 5. CUERPO DE PRESCRIPCIÓN: SECCIÓN RP. ────────────────────────────────
    doc.moveDown(0.5);
    const yRp = doc.y;

    // Símbolo de Prescripción Rx
    doc.font('Helvetica-Bold').fontSize(16).fillColor(primaryColor);
    doc.text('Rp.', xInicio, yRp);

    doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor);
    doc.text('INDICACIONES FARMACOLÓGICAS', xInicio + 32, yRp + 3);

    doc.rect(xInicio, yRp + 20, anchoUtil, 1.5).fill(secondaryColor);
    doc.y = yRp + 26;

    // Listado atómico de medicamentos
    const medicamentos = receta.medicamentos || [];
    medicamentos.forEach((item, index) => {
      const yItem = doc.y;
      
      // Fondo sutil alternado
      if (index % 2 === 1) {
        doc.rect(xInicio, yItem, anchoUtil, 46).fill('#f8fafc');
      }

      // Viñeta numérica
      doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor);
      doc.text(`${index + 1}.`, xInicio + 8, yItem + 6);

      // Nombre y Presentación
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(textColor);
      doc.text(item.medicamento.toUpperCase(), xInicio + 24, yItem + 6, { continued: true });
      doc.font('Helvetica').fontSize(9).fillColor(mutedColor);
      doc.text(`  —  ${item.presentacion}`);

      // Posología y Administración
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#334155');
      doc.text('   Dosis: ', xInicio + 24, yItem + 20, { continued: true });
      doc.font('Helvetica').fontSize(8.5).fillColor(textColor);
      doc.text(`${item.dosis} (${item.via})`, { continued: true });
      doc.font('Helvetica-Bold').fillColor('#334155');
      doc.text('   Frecuencia: ', { continued: true });
      doc.font('Helvetica').fillColor(textColor);
      doc.text(`${item.frecuencia}`, { continued: true });
      doc.font('Helvetica-Bold').fillColor('#334155');
      doc.text('   Duración: ', { continued: true });
      doc.font('Helvetica').fillColor(textColor);
      doc.text(`${item.duracion}`);

      // Cantidad a despachar o indicaciones particulares
      const extras: string[] = [];
      if (item.cantidad) extras.push(`Cantidad a despachar: ${item.cantidad} unidades/cajas`);
      if (item.indicaciones) extras.push(`Indicaciones: ${item.indicaciones}`);

      if (extras.length > 0) {
        doc.font('Helvetica-Oblique').fontSize(8).fillColor(mutedColor);
        doc.text(`   * ${extras.join(' | ')}`, xInicio + 24, yItem + 32);
        doc.y = yItem + 48;
      } else {
        doc.y = yItem + 36;
      }

      // Línea divisoria suave
      doc.rect(xInicio + 15, doc.y, anchoUtil - 30, 0.5).fill('#e2e8f0');
      doc.moveDown(0.4);
    });

    // ─── 6. RECOMENDACIONES GENERALES ──────────────────────────────────────────
    if (receta.indicacionesGenerales) {
      doc.moveDown(0.8);
      const yRec = doc.y;
      doc.rect(xInicio, yRec, anchoUtil, 18).fill('#f1f5f9');
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(primaryColor);
      doc.text('RECOMENDACIONES GENERALES E INDICACIONES NO FARMACOLÓGICAS', xInicio + 10, yRec + 5);

      doc.y = yRec + 24;
      doc.font('Helvetica').fontSize(8.5).fillColor(textColor);
      doc.text(receta.indicacionesGenerales, xInicio + 10, doc.y, {
        width: anchoUtil - 20,
        lineGap: 2,
      });
      doc.moveDown(0.6);
    }

    // ─── 7. BLOQUE DE FIRMA Y SELLO MÉDICO ──────────────────────────────────────
    const yFirma = doc.page.height - 135;
    const xFirma = doc.page.width - doc.page.margins.right - 220;

    // Si el médico tiene firma digital configurada (base64 o archivo)
    if (receta.profesional?.firmaDigitalUrl) {
      try {
        const rawFirma = receta.profesional.firmaDigitalUrl;
        let imgBuffer: Buffer | null = null;
        if (rawFirma.startsWith('data:image/')) {
          const base64Data = rawFirma.split(',')[1];
          if (base64Data) {
            imgBuffer = Buffer.from(base64Data, 'base64');
          }
        }
        if (imgBuffer) {
          doc.image(imgBuffer, xFirma + 25, yFirma - 48, {
            fit: [150, 45],
            align: 'center',
            valign: 'center',
          });
        }
      } catch {
        // En caso de formato no compatible, continúa con el trazado estándar
      }
    }

    doc.moveTo(xFirma, yFirma).lineTo(xFirma + 200, yFirma).lineWidth(0.8).strokeColor('#94a3b8').stroke();

    const medicoFirma = [receta.profesional?.nombre, receta.profesional?.apellido]
      .filter(Boolean)
      .join(' ') || 'Médico Tratante';

    doc.font('Helvetica-Bold').fontSize(9).fillColor(textColor);
    doc.text(medicoFirma, xFirma, yFirma + 5, {
      width: 200,
      align: 'center',
    });

    const especialidadTexto = receta.profesional?.especialidad ? `${receta.profesional.especialidad}` : 'Firma y Sello Profesional';
    doc.font('Helvetica').fontSize(8).fillColor(mutedColor);
    doc.text(especialidadTexto, xFirma, yFirma + 17, {
      width: 200,
      align: 'center',
    });

    if (receta.profesional?.matriculaProfesional) {
      doc.font('Helvetica').fontSize(7.5).fillColor(primaryColor);
      doc.text(`Mat. Profesional: ${receta.profesional.matriculaProfesional}`, xFirma, yFirma + 28, {
        width: 200,
        align: 'center',
      });
    }

    // ─── 8. PIE DE PÁGINA MÉDICO-LEGAL ─────────────────────────────────────────
    const yPie = doc.page.height - 55;
    doc.rect(xInicio, yPie - 5, anchoUtil, 0.5).fill('#cbd5e1');

    doc.font('Helvetica').fontSize(7).fillColor(mutedColor);
    doc.text(
      'Documento médico oficial generado electrónicamente por Sistema Clínico SaaS. Válido para dispensación farmacéutica según normativa sanitaria.',
      xInicio,
      yPie,
      { width: anchoUtil, align: 'center' },
    );

    const tokenVerificacion = `Folio: ${receta.numeroReceta}  |  ID: ${receta.id}  |  Emisión: ${fechaEmisionStr}`;
    doc.text(tokenVerificacion, xInicio, yPie + 10, {
      width: anchoUtil,
      align: 'center',
    });
  }
}
