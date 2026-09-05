/**
 * Catálogo Internacional de Enfermedades (CIE-10 / ICD-10).
 *
 * Base de datos clínica de referencia para autocompletado médico,
 * estandarización diagnóstica y codificación epidemiológica en consultas ambulatorias.
 */
export interface CodigoCie10 {
  codigo: string;
  descripcion: string;
  capitulo: string;
}

export const CATALOGO_CIE10: CodigoCie10[] = [
  // ─── ENFERMEDADES INFECCIOSAS Y PARASITARIAS (A00-B99) ──────────────────────
  { codigo: 'A09', descripcion: 'Diarrea y gastroenteritis de presunto origen infeccioso', capitulo: 'Infecciosas' },
  { codigo: 'A08.4', descripcion: 'Infección viral intestinal, no especificada', capitulo: 'Infecciosas' },
  { codigo: 'B34.2', descripcion: 'Infección por coronavirus, no especificada', capitulo: 'Infecciosas' },
  { codigo: 'B34.9', descripcion: 'Infección viral, no especificada', capitulo: 'Infecciosas' },
  { codigo: 'B35.9', descripcion: 'Dermatofitosis [micosis superficial], no especificada', capitulo: 'Infecciosas' },

  // ─── ENDOCRINAS, NUTRICIONALES Y METABÓLICAS (E00-E90) ──────────────────────
  { codigo: 'E10.9', descripcion: 'Diabetes mellitus tipo 1 sin mención de complicación', capitulo: 'Endocrinas' },
  { codigo: 'E11.9', descripcion: 'Diabetes mellitus tipo 2 sin mención de complicación', capitulo: 'Endocrinas' },
  { codigo: 'E03.9', descripcion: 'Hipotiroidismo, no especificado', capitulo: 'Endocrinas' },
  { codigo: 'E05.9', descripcion: 'Tirotoxicosis [hipertiroidismo], no especificada', capitulo: 'Endocrinas' },
  { codigo: 'E66.0', descripcion: 'Obesidad debida a exceso de calorías', capitulo: 'Endocrinas' },
  { codigo: 'E66.9', descripcion: 'Obesidad, no especificada', capitulo: 'Endocrinas' },
  { codigo: 'E78.0', descripcion: 'Hipercolesterolemia pura', capitulo: 'Endocrinas' },
  { codigo: 'E78.1', descripcion: 'Hipertrigliceridemia pura', capitulo: 'Endocrinas' },
  { codigo: 'E78.5', descripcion: 'Hiperlipidemia no especificada (Dislipidemia)', capitulo: 'Endocrinas' },
  { codigo: 'E79.0', descripcion: 'Hiperuricemia sin signos de artritis o gota', capitulo: 'Endocrinas' },

  // ─── TRASTORNOS MENTALES Y DEL COMPORTAMIENTO (F00-F99) ────────────────────
  { codigo: 'F41.1', descripcion: 'Trastorno de ansiedad generalizada', capitulo: 'Salud Mental' },
  { codigo: 'F41.2', descripcion: 'Trastorno mixto de ansiedad y depresión', capitulo: 'Salud Mental' },
  { codigo: 'F32.0', descripcion: 'Episodio depresivo leve', capitulo: 'Salud Mental' },
  { codigo: 'F32.1', descripcion: 'Episodio depresivo moderado', capitulo: 'Salud Mental' },
  { codigo: 'F43.0', descripcion: 'Reacción al estrés agudo', capitulo: 'Salud Mental' },
  { codigo: 'F51.0', descripcion: 'Insomnio no orgánico', capitulo: 'Salud Mental' },

  // ─── SISTEMA NERVIOSO (G00-G99) ─────────────────────────────────────────────
  { codigo: 'G43.9', descripcion: 'Migraña, no especificada', capitulo: 'Neurología' },
  { codigo: 'G44.2', descripcion: 'Cefalea debida a tensión (tensional)', capitulo: 'Neurología' },
  { codigo: 'G44.8', descripcion: 'Otros síndromes de cefalea especificados', capitulo: 'Neurología' },
  { codigo: 'G47.0', descripcion: 'Trastornos del inicio y del mantenimiento del sueño', capitulo: 'Neurología' },

  // ─── SISTEMA CIRCULATORIO (I00-I99) ─────────────────────────────────────────
  { codigo: 'I10', descripcion: 'Hipertensión esencial (primaria)', capitulo: 'Cardiovascular' },
  { codigo: 'I11.9', descripcion: 'Enfermedad cardíaca hipertensiva sin insuficiencia cardíaca', capitulo: 'Cardiovascular' },
  { codigo: 'I20.9', descripcion: 'Angina de pecho, no especificada', capitulo: 'Cardiovascular' },
  { codigo: 'I25.1', descripcion: 'Enfermedad aterosclerótica del corazón', capitulo: 'Cardiovascular' },
  { codigo: 'I50.9', descripcion: 'Insuficiencia cardíaca, no especificada', capitulo: 'Cardiovascular' },
  { codigo: 'I83.9', descripcion: 'Venas varicosas de miembros inferiores sin úlcera ni inflamación', capitulo: 'Cardiovascular' },

  // ─── SISTEMA RESPIRATORIO (J00-J99) ─────────────────────────────────────────
  { codigo: 'J00', descripcion: 'Rinofaringitis aguda (Resfriado común)', capitulo: 'Respiratorio' },
  { codigo: 'J01.9', descripcion: 'Sinusitis aguda, no especificada', capitulo: 'Respiratorio' },
  { codigo: 'J02.9', descripcion: 'Faringitis aguda, no especificada', capitulo: 'Respiratorio' },
  { codigo: 'J03.9', descripcion: 'Amigdalitis aguda, no especificada', capitulo: 'Respiratorio' },
  { codigo: 'J04.0', descripcion: 'Laringitis aguda', capitulo: 'Respiratorio' },
  { codigo: 'J06.9', descripcion: 'Infección aguda de las vías respiratorias superiores, no especificada', capitulo: 'Respiratorio' },
  { codigo: 'J20.9', descripcion: 'Bronquitis aguda, no especificada', capitulo: 'Respiratorio' },
  { codigo: 'J45.9', descripcion: 'Asma, no especificada', capitulo: 'Respiratorio' },
  { codigo: 'J30.4', descripcion: 'Rinitis alérgica, no especificada', capitulo: 'Respiratorio' },

  // ─── SISTEMA DIGESTIVO (K00-K93) ────────────────────────────────────────────
  { codigo: 'K21.0', descripcion: 'Enfermedad por reflujo gastroesofágico con esofagitis', capitulo: 'Digestivo' },
  { codigo: 'K21.9', descripcion: 'Enfermedad por reflujo gastroesofágico sin esofagitis', capitulo: 'Digestivo' },
  { codigo: 'K25.9', descripcion: 'Úlcera gástrica, no especificada como aguda ni crónica', capitulo: 'Digestivo' },
  { codigo: 'K29.1', descripcion: 'Otra gastritis aguda', capitulo: 'Digestivo' },
  { codigo: 'K29.4', descripcion: 'Gastritis crónica atrófica', capitulo: 'Digestivo' },
  { codigo: 'K29.7', descripcion: 'Gastritis, no especificada', capitulo: 'Digestivo' },
  { codigo: 'K30', descripcion: 'Dispepsia funcional', capitulo: 'Digestivo' },
  { codigo: 'K58.0', descripcion: 'Síndrome del intestino irritable con predominio de diarrea', capitulo: 'Digestivo' },
  { codigo: 'K58.9', descripcion: 'Síndrome del intestino irritable sin diarrea', capitulo: 'Digestivo' },
  { codigo: 'K59.0', descripcion: 'Constipación (Estreñimiento)', capitulo: 'Digestivo' },
  { codigo: 'K80.2', descripcion: 'Cálculo de la vesícula biliar sin colecistitis (Colelitiasis)', capitulo: 'Digestivo' },

  // ─── PIEL Y TEJIDO SUBCUTÁNEO (L00-L99) ────────────────────────────────────
  { codigo: 'L20.9', descripcion: 'Dermatitis atópica, no especificada', capitulo: 'Dermatología' },
  { codigo: 'L23.9', descripcion: 'Dermatitis alérgica de contacto, causa no especificada', capitulo: 'Dermatología' },
  { codigo: 'L30.9', descripcion: 'Dermatitis, no especificada (Eccema)', capitulo: 'Dermatología' },
  { codigo: 'L70.0', descripcion: 'Acné vulgar', capitulo: 'Dermatología' },
  { codigo: 'L50.9', descripcion: 'Urticaria, no especificada', capitulo: 'Dermatología' },

  // ─── SISTEMA OSTEOMUSCULAR Y CONECTIVO (M00-M99) ───────────────────────────
  { codigo: 'M54.5', descripcion: 'Lumbago no especificado (Lumbalgia)', capitulo: 'Musculoesquelético' },
  { codigo: 'M54.2', descripcion: 'Cervicalgia (Dolor de cuello)', capitulo: 'Musculoesquelético' },
  { codigo: 'M54.4', descripcion: 'Lumbago con ciática', capitulo: 'Musculoesquelético' },
  { codigo: 'M25.5', descripcion: 'Dolor articular (Artralgia)', capitulo: 'Musculoesquelético' },
  { codigo: 'M79.1', descripcion: 'Mialgia (Dolor muscular)', capitulo: 'Musculoesquelético' },
  { codigo: 'M79.7', descripcion: 'Fibromialgia', capitulo: 'Musculoesquelético' },
  { codigo: 'M19.9', descripcion: 'Osteoartrosis, no especificada', capitulo: 'Musculoesquelético' },

  // ─── SISTEMA GENITOURINARIO (N00-N99) ───────────────────────────────────────
  { codigo: 'N39.0', descripcion: 'Infección de vías urinarias, sitio no especificado (ITU)', capitulo: 'Genitourinario' },
  { codigo: 'N30.0', descripcion: 'Cistitis aguda', capitulo: 'Genitourinario' },
  { codigo: 'N76.0', descripcion: 'Vaginitis aguda', capitulo: 'Ginecología' },
  { codigo: 'N94.6', descripcion: 'Dismenorrea, no especificada', capitulo: 'Ginecología' },
  { codigo: 'N91.2', descripcion: 'Amenorrea, no especificada', capitulo: 'Ginecología' },
  { codigo: 'N92.0', descripcion: 'Menstruación excesiva y frecuente con ciclo regular', capitulo: 'Ginecología' },
  { codigo: 'N40', descripcion: 'Hiperplasia benigna de la próstata', capitulo: 'Urología' },

  // ─── SÍNTOMAS Y SIGNOS GENERALES (R00-R99) ──────────────────────────────────
  { codigo: 'R10.4', descripcion: 'Otros dolores abdominales y los no especificados', capitulo: 'Síntomas Generales' },
  { codigo: 'R50.9', descripcion: 'Fiebre, no especificada', capitulo: 'Síntomas Generales' },
  { codigo: 'R51', descripcion: 'Cefalea', capitulo: 'Síntomas Generales' },
  { codigo: 'R53', descripcion: 'Malestar y fatiga (Astenia)', capitulo: 'Síntomas Generales' },
  { codigo: 'R05', descripcion: 'Tos', capitulo: 'Síntomas Generales' },
  { codigo: 'R11', descripcion: 'Náusea y vómito', capitulo: 'Síntomas Generales' },
  { codigo: 'R42', descripcion: 'Mareo y desvanecimiento (Vértigo)', capitulo: 'Síntomas Generales' },

  // ─── FACTORES QUE INFLUYEN EN EL ESTADO DE SALUD (Z00-Z99) ─────────────────
  { codigo: 'Z00.0', descripcion: 'Examen médico general (Chequeo anual preventivo)', capitulo: 'Control de Salud' },
  { codigo: 'Z00.1', descripcion: 'Control de salud de rutina del niño', capitulo: 'Control de Salud' },
  { codigo: 'Z01.4', descripcion: 'Examen ginecológico general (Papanicolaou / Citología)', capitulo: 'Control de Salud' },
  { codigo: 'Z32.1', descripcion: 'Embarazo confirmado', capitulo: 'Control de Salud' },
  { codigo: 'Z34.9', descripcion: 'Supervisión de embarazo normal, no especificado (Control prenatal)', capitulo: 'Control de Salud' },
  { codigo: 'Z76.0', descripcion: 'Emisión de receta médica de repetición', capitulo: 'Administrativo' },
];

/**
 * Función de búsqueda en el catálogo CIE-10 con normalización de acentos y mayúsculas.
 */
export function buscarEnCie10(termino?: string, limite = 15): CodigoCie10[] {
  if (!termino || termino.trim().length === 0) {
    return CATALOGO_CIE10.slice(0, limite);
  }

  const normalizado = termino
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  return CATALOGO_CIE10.filter((item) => {
    const codNormalizado = item.codigo.toLowerCase();
    const descNormalizada = item.descripcion
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const capNormalizado = item.capitulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return (
      codNormalizado.includes(normalizado) ||
      descNormalizada.includes(normalizado) ||
      capNormalizado.includes(normalizado)
    );
  }).slice(0, limite);
}
