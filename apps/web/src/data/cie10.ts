export interface Cie10Item {
  codigo: string;
  nombre: string;
  categoria: string;
}

export const CATALOGO_CIE10: Cie10Item[] = [
  // ─── CARDIOLOGÍA Y SISTEMA CIRCULATORIO ─────────────────────────────────────
  { codigo: 'I10', nombre: 'Hipertensión esencial (primaria)', categoria: 'Cardiología' },
  { codigo: 'I11.9', nombre: 'Enfermedad cardíaca hipertensiva sin insuficiencia cardíaca', categoria: 'Cardiología' },
  { codigo: 'I20.9', nombre: 'Angina de pecho, no especificada', categoria: 'Cardiología' },
  { codigo: 'I25.1', nombre: 'Enfermedad aterosclerótica del corazón', categoria: 'Cardiología' },
  { codigo: 'I50.9', nombre: 'Insuficiencia cardíaca, no especificada', categoria: 'Cardiología' },
  { codigo: 'I48.9', nombre: 'Fibrilación y aleteo auricular, no especificado', categoria: 'Cardiología' },
  { codigo: 'I95.9', nombre: 'Hipotensión, no especificada', categoria: 'Cardiología' },
  { codigo: 'I83.9', nombre: 'Venas varicosas de miembros inferiores sin úlcera ni inflamación', categoria: 'Cardiología' },

  // ─── ENDOCRINOLOGÍA Y METABOLISMO ──────────────────────────────────────────
  { codigo: 'E11.9', nombre: 'Diabetes mellitus tipo 2 sin mención de complicación', categoria: 'Endocrinología' },
  { codigo: 'E10.9', nombre: 'Diabetes mellitus tipo 1 sin mención de complicación', categoria: 'Endocrinología' },
  { codigo: 'E03.9', nombre: 'Hipotiroidismo, no especificado', categoria: 'Endocrinología' },
  { codigo: 'E05.9', nombre: 'Tirotoxicosis [hipertiroidismo], no especificada', categoria: 'Endocrinología' },
  { codigo: 'E66.0', nombre: 'Obesidad debida a exceso de calorías', categoria: 'Endocrinología' },
  { codigo: 'E66.9', nombre: 'Obesidad, no especificada', categoria: 'Endocrinología' },
  { codigo: 'E78.0', nombre: 'Hipercolesterolemia pura', categoria: 'Endocrinología' },
  { codigo: 'E78.1', nombre: 'Hipergliceridemia pura', categoria: 'Endocrinología' },
  { codigo: 'E78.2', nombre: 'Hiperlipidemia mixta', categoria: 'Endocrinología' },
  { codigo: 'E79.0', nombre: 'Hiperuricemia sin signos de artritis inflamatoria o enfermedad tofácea', categoria: 'Endocrinología' },

  // ─── RESPIRATORIO E INFECCIONES DE VÍAS AÉREAS ──────────────────────────────
  { codigo: 'J00', nombre: 'Rinofaringitis aguda [resfriado común]', categoria: 'Respiratorio' },
  { codigo: 'J01.9', nombre: 'Sinusitis aguda, no especificada', categoria: 'Respiratorio' },
  { codigo: 'J02.9', nombre: 'Faringitis aguda, no especificada', categoria: 'Respiratorio' },
  { codigo: 'J03.9', nombre: 'Amigdalitis aguda, no especificada', categoria: 'Respiratorio' },
  { codigo: 'J04.0', nombre: 'Laringitis aguda', categoria: 'Respiratorio' },
  { codigo: 'J06.9', nombre: 'Infección aguda de las vías respiratorias superiores, no especificada', categoria: 'Respiratorio' },
  { codigo: 'J18.9', nombre: 'Neumonía, no especificada', categoria: 'Respiratorio' },
  { codigo: 'J20.9', nombre: 'Bronquitis aguda, no especificada', categoria: 'Respiratorio' },
  { codigo: 'J30.4', nombre: 'Rinitis alérgica, no especificada', categoria: 'Respiratorio' },
  { codigo: 'J44.9', nombre: 'Enfermedad pulmonar obstructiva crónica, no especificada', categoria: 'Respiratorio' },
  { codigo: 'J45.9', nombre: 'Asma, no especificada', categoria: 'Respiratorio' },
  { codigo: 'R05', nombre: 'Tos', categoria: 'Respiratorio' },

  // ─── GASTROINTESTINAL Y DIGESTIVO ──────────────────────────────────────────
  { codigo: 'K21.9', nombre: 'Enfermedad por reflujo gastroesofágico sin esofagitis', categoria: 'Gastroenterología' },
  { codigo: 'K29.7', nombre: 'Gastritis, no especificada', categoria: 'Gastroenterología' },
  { codigo: 'K30', nombre: 'Dispepsia funcional', categoria: 'Gastroenterología' },
  { codigo: 'K58.9', nombre: 'Síndrome del colon irritable sin diarrea', categoria: 'Gastroenterología' },
  { codigo: 'K59.0', nombre: 'Constipación / Estreñimiento', categoria: 'Gastroenterología' },
  { codigo: 'K52.9', nombre: 'Gastroenteritis y colitis no infecciosas, no especificadas', categoria: 'Gastroenterología' },
  { codigo: 'A09', nombre: 'Diarrea y gastroenteritis de presunto origen infeccioso', categoria: 'Gastroenterología' },
  { codigo: 'K80.2', nombre: 'Cálculo de la vesícula biliar sin colecistitis', categoria: 'Gastroenterología' },
  { codigo: 'K76.0', nombre: 'Hígado graso no alcohólico (esteatosis hepática)', categoria: 'Gastroenterología' },
  { codigo: 'K64.9', nombre: 'Hemorroides, no especificadas', categoria: 'Gastroenterología' },

  // ─── GINECOLOGÍA Y OBSTETRICIA ─────────────────────────────────────────────
  { codigo: 'Z34.9', nombre: 'Supervisión de embarazo normal no especificado', categoria: 'Ginecología y Obstetricia' },
  { codigo: 'Z35.9', nombre: 'Supervisión de embarazo de alto riesgo, no especificada', categoria: 'Ginecología y Obstetricia' },
  { codigo: 'O80', nombre: 'Parto único espontáneo', categoria: 'Ginecología y Obstetricia' },
  { codigo: 'O82.9', nombre: 'Parto por cesárea, no especificado', categoria: 'Ginecología y Obstetricia' },
  { codigo: 'N76.0', nombre: 'Vaginitis aguda', categoria: 'Ginecología y Obstetricia' },
  { codigo: 'B37.3', nombre: 'Candidiasis de la vulva y de la vagina', categoria: 'Ginecología y Obstetricia' },
  { codigo: 'N80.9', nombre: 'Endometriosis, no especificada', categoria: 'Ginecología y Obstetricia' },
  { codigo: 'N91.2', nombre: 'Amenorrea, no especificada', categoria: 'Ginecología y Obstetricia' },
  { codigo: 'N92.0', nombre: 'Menstruación excesiva y frecuente con ciclo regular', categoria: 'Ginecología y Obstetricia' },
  { codigo: 'N94.6', nombre: 'Dismenorrea, no especificada', categoria: 'Ginecología y Obstetricia' },
  { codigo: 'N95.1', nombre: 'Estados menopáusicos y climatéricos femeninos', categoria: 'Ginecología y Obstetricia' },
  { codigo: 'N84.1', nombre: 'Pólipo del cuello del útero', categoria: 'Ginecología y Obstetricia' },
  { codigo: 'D25.9', nombre: 'Leiomioma del útero, sin otra especificación (miomatosis)', categoria: 'Ginecología y Obstetricia' },

  // ─── NEFROLOGÍA Y UROLOGÍA ─────────────────────────────────────────────────
  { codigo: 'N39.0', nombre: 'Infección de vías urinarias, sitio no especificado (ITU)', categoria: 'Urología' },
  { codigo: 'N30.0', nombre: 'Cistitis aguda', categoria: 'Urología' },
  { codigo: 'N20.1', nombre: 'Cálculo de uréter', categoria: 'Urología' },
  { codigo: 'N40', nombre: 'Hiperplasia benigna de la próstata', categoria: 'Urología' },
  { codigo: 'N18.9', nombre: 'Enfermedad renal crónica, no especificada', categoria: 'Nefrología' },

  // ─── NEUROLOGÍA Y SALUD MENTAL ─────────────────────────────────────────────
  { codigo: 'G43.9', nombre: 'Migraña, no especificada', categoria: 'Neurología' },
  { codigo: 'G44.2', nombre: 'Cefalea debida a tensión (tensional)', categoria: 'Neurología' },
  { codigo: 'R51', nombre: 'Cefalea / Dolor de cabeza', categoria: 'Neurología' },
  { codigo: 'R42', nombre: 'Mareo y desvanecimiento', categoria: 'Neurología' },
  { codigo: 'G47.0', nombre: 'Trastornos del inicio y del mantenimiento del sueño [insomnio]', categoria: 'Neurología' },
  { codigo: 'F41.1', nombre: 'Trastorno de ansiedad generalizada', categoria: 'Salud Mental' },
  { codigo: 'F41.9', nombre: 'Trastorno de ansiedad, no especificado', categoria: 'Salud Mental' },
  { codigo: 'F32.9', nombre: 'Episodio depresivo, no especificado', categoria: 'Salud Mental' },
  { codigo: 'F43.0', nombre: 'Reacción al estrés agudo', categoria: 'Salud Mental' },

  // ─── MÚSCULO-ESQUELÉTICO Y TRAUMATOLOGÍA ───────────────────────────────────
  { codigo: 'M54.5', nombre: 'Lumbago no especificado / Lumbalgia mecánica', categoria: 'Traumatología' },
  { codigo: 'M54.2', nombre: 'Cervicalgia', categoria: 'Traumatología' },
  { codigo: 'M25.5', nombre: 'Dolor articular [artralgia]', categoria: 'Traumatología' },
  { codigo: 'M19.9', nombre: 'Artrosis, no especificada', categoria: 'Traumatología' },
  { codigo: 'M79.1', nombre: 'Mialgia / Dolor muscular', categoria: 'Traumatología' },
  { codigo: 'M79.7', nombre: 'Fibromialgia', categoria: 'Reumatología' },
  { codigo: 'S93.4', nombre: 'Esguince y torcedura del tobillo', categoria: 'Traumatología' },
  { codigo: 'M77.9', nombre: 'Entesopatía, no especificada (tendinitis)', categoria: 'Traumatología' },

  // ─── DERMATOLOGÍA ──────────────────────────────────────────────────────────
  { codigo: 'L20.9', nombre: 'Dermatitis atópica, no especificada', categoria: 'Dermatología' },
  { codigo: 'L30.9', nombre: 'Dermatitis, no especificada', categoria: 'Dermatología' },
  { codigo: 'L50.9', nombre: 'Urticaria, no especificada', categoria: 'Dermatología' },
  { codigo: 'L70.0', nombre: 'Acné común', categoria: 'Dermatología' },
  { codigo: 'B35.9', nombre: 'Dermatofitosis, no especificada (hongos en piel)', categoria: 'Dermatología' },
  { codigo: 'B07', nombre: 'Verrugas víricas', categoria: 'Dermatología' },
  { codigo: 'L03.9', nombre: 'Celulitis infecciosa de sitio no especificado', categoria: 'Dermatología' },

  // ─── SÍNTOMAS GENERALES Y EXÁMENES PREVENTIVOS ─────────────────────────────
  { codigo: 'Z00.0', nombre: 'Examen médico general / Chequeo de rutina', categoria: 'Medicina General' },
  { codigo: 'Z01.0', nombre: 'Examen de ojos y de la visión', categoria: 'Oftalmología' },
  { codigo: 'Z01.2', nombre: 'Examen odontológico', categoria: 'Odontología' },
  { codigo: 'R50.9', nombre: 'Fiebre, no especificada', categoria: 'Medicina General' },
  { codigo: 'R53', nombre: 'Malestar general y fatiga / Astenia', categoria: 'Medicina General' },
  { codigo: 'D50.9', nombre: 'Anemia por deficiencia de hierro sin especificación', categoria: 'Hematología' },
  { codigo: 'D64.9', nombre: 'Anemia, no especificada', categoria: 'Hematología' },
  { codigo: 'T78.4', nombre: 'Alergia, no especificada', categoria: 'Alergología' },
  { codigo: 'B01.9', nombre: 'Varicela sin complicaciones', categoria: 'Infectología' },
  { codigo: 'A08.4', nombre: 'Infección intestinal viral, sin otra especificación', categoria: 'Pediatría' },
];
