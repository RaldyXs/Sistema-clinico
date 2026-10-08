/**
 * Catálogo de Servicios Clínicos y Tarifario de Referencia en República Dominicana (RD$).
 * Utilizado para la grilla de facturación, cálculo automático de cobertura ARS y copagos.
 */

export interface ServicioClinico {
  id: string;
  codigo: string;
  categoria: 'CONSULTA' | 'PROCEDIMIENTO' | 'IMAGENES' | 'LABORATORIO';
  nombre: string;
  descripcion?: string;
  precioBaseDop: number;
  coberturaSugeridaArs: number; // Porcentaje estándar de cobertura (ej. 80%)
}

export const SERVICIOS_CLINICOS: ServicioClinico[] = [
  // ─── CONSULTAS ───────────────────────────────────────────────
  {
    id: 'srv-con-gin',
    codigo: 'CON-001',
    categoria: 'CONSULTA',
    nombre: 'Consulta Ginecológica Especializada',
    descripcion: 'Evaluación integral clínica ginecológica y examen físico',
    precioBaseDop: 2500,
    coberturaSugeridaArs: 80,
  },
  {
    id: 'srv-con-obs',
    codigo: 'CON-002',
    categoria: 'CONSULTA',
    nombre: 'Consulta y Control Prenatal / Obstétrico',
    descripcion: 'Control mensual de embarazo y monitoreo materno-fetal',
    precioBaseDop: 2500,
    coberturaSugeridaArs: 85,
  },
  {
    id: 'srv-con-gen',
    codigo: 'CON-003',
    categoria: 'CONSULTA',
    nombre: 'Consulta de Medicina General',
    descripcion: 'Atención primaria y tamizaje ambulatorio',
    precioBaseDop: 1800,
    coberturaSugeridaArs: 80,
  },
  {
    id: 'srv-con-seg',
    codigo: 'CON-004',
    categoria: 'CONSULTA',
    nombre: 'Consulta de Seguimiento / Revaluación',
    descripcion: 'Revisión de estudios complementarios y ajuste de tratamiento',
    precioBaseDop: 1200,
    coberturaSugeridaArs: 80,
  },

  // ─── PROCEDIMIENTOS GINECOLÓGICOS ───────────────────────────
  {
    id: 'srv-prc-pap-c',
    codigo: 'PRC-101',
    categoria: 'PROCEDIMIENTO',
    nombre: 'Papanicolaou Convencional (PAP)',
    descripcion: 'Toma citológica cervicouterina y fijación estándar',
    precioBaseDop: 1200,
    coberturaSugeridaArs: 80,
  },
  {
    id: 'srv-prc-pap-l',
    codigo: 'PRC-102',
    categoria: 'PROCEDIMIENTO',
    nombre: 'Papanicolaou en Base Líquida (ThinPrep)',
    descripcion: 'Citología en medio líquido de alta resolución',
    precioBaseDop: 2200,
    coberturaSugeridaArs: 75,
  },
  {
    id: 'srv-prc-colp',
    codigo: 'PRC-103',
    categoria: 'PROCEDIMIENTO',
    nombre: 'Colposcopía Diagnóstica con Ácido Acético y Lugol',
    descripcion: 'Inspección microscópica del cérvix con reactivos',
    precioBaseDop: 3500,
    coberturaSugeridaArs: 80,
  },
  {
    id: 'srv-prc-bx',
    codigo: 'PRC-104',
    categoria: 'PROCEDIMIENTO',
    nombre: 'Biopsia Cervical Dirigida por Colposcopía',
    descripcion: 'Toma de muestra tisular para estudio histopatológico',
    precioBaseDop: 4500,
    coberturaSugeridaArs: 75,
  },
  {
    id: 'srv-prc-caut',
    codigo: 'PRC-105',
    categoria: 'PROCEDIMIENTO',
    nombre: 'Criocauterización / Cauterización de Cuello Uterino',
    descripcion: 'Tratamiento ablativo para ectropión o lesiones benignas',
    precioBaseDop: 5000,
    coberturaSugeridaArs: 70,
  },

  // ─── DIAGNÓSTICO POR IMÁGENES ──────────────────────────────
  {
    id: 'srv-img-eco-pelv',
    codigo: 'IMG-201',
    categoria: 'IMAGENES',
    nombre: 'Sonografía Pélvica Ginecológica',
    descripcion: 'Ultrasonido supra-púbico de útero y anexos',
    precioBaseDop: 2000,
    coberturaSugeridaArs: 80,
  },
  {
    id: 'srv-img-eco-tv',
    codigo: 'IMG-202',
    categoria: 'IMAGENES',
    nombre: 'Sonografía Transvaginal de Alta Resolución',
    descripcion: 'Evaluación ecográfica intracavitaria del aparato reproductor',
    precioBaseDop: 2800,
    coberturaSugeridaArs: 80,
  },
  {
    id: 'srv-img-eco-obs',
    codigo: 'IMG-203',
    categoria: 'IMAGENES',
    nombre: 'Sonografía Obstétrica de Control Fetal',
    descripcion: 'Biometría fetal, líquido amniótico y placenta',
    precioBaseDop: 2200,
    coberturaSugeridaArs: 80,
  },
  {
    id: 'srv-img-eco-dop',
    codigo: 'IMG-204',
    categoria: 'IMAGENES',
    nombre: 'Sonografía Doppler Fetal / Perfil Biofísico',
    descripcion: 'Flujometría Doppler de arterias uterinas y umbilical',
    precioBaseDop: 3800,
    coberturaSugeridaArs: 75,
  },
  {
    id: 'srv-img-mam-bil',
    codigo: 'IMG-205',
    categoria: 'IMAGENES',
    nombre: 'Mamografía Digital Bilateral',
    descripcion: 'Estudio radiológico mamario con proyecciones estándar',
    precioBaseDop: 3200,
    coberturaSugeridaArs: 80,
  },

  // ─── LABORATORIO CLÍNICO DE RUTINA ────────────────────────
  {
    id: 'srv-lab-hemo',
    codigo: 'LAB-301',
    categoria: 'LABORATORIO',
    nombre: 'Hemograma Completo Automatizado',
    descripcion: 'Recuento globular, plaquetas, hemoglobina y fórmula leucocitaria',
    precioBaseDop: 650,
    coberturaSugeridaArs: 80,
  },
  {
    id: 'srv-lab-orina',
    codigo: 'LAB-302',
    categoria: 'LABORATORIO',
    nombre: 'Uroanálisis Completo y Sedimento',
    descripcion: 'Examen físico, químico y microscópico de orina',
    precioBaseDop: 450,
    coberturaSugeridaArs: 80,
  },
  {
    id: 'srv-lab-gluc',
    codigo: 'LAB-303',
    categoria: 'LABORATORIO',
    nombre: 'Glicemia en Ayunas',
    descripcion: 'Determinación cuantitativa de glucosa en suero',
    precioBaseDop: 350,
    coberturaSugeridaArs: 80,
  },
  {
    id: 'srv-lab-lipid',
    codigo: 'LAB-304',
    categoria: 'LABORATORIO',
    nombre: 'Perfil Lipídico Completo',
    descripcion: 'Colesterol total, HDL, LDL, VLDL y triglicéridos',
    precioBaseDop: 1200,
    coberturaSugeridaArs: 80,
  },
  {
    id: 'srv-lab-hcg',
    codigo: 'LAB-305',
    categoria: 'LABORATORIO',
    nombre: 'Prueba de Embarazo en Sangre (Beta-hCG Cuantitativa)',
    descripcion: 'Detección cuantitativa de gonadotropina coriónica',
    precioBaseDop: 950,
    coberturaSugeridaArs: 80,
  },
  {
    id: 'srv-lab-serol',
    codigo: 'LAB-306',
    categoria: 'LABORATORIO',
    nombre: 'Panel Serológico Prenatal (VIH, VDRL, HBsAg)',
    descripcion: 'Tamizaje serológico para control de salud materno-infantil',
    precioBaseDop: 1800,
    coberturaSugeridaArs: 85,
  },
];
