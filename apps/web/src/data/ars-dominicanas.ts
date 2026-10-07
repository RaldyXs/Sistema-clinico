/**
 * Catálogo estándar de Aseguradoras de Riesgos de Salud (ARS) de República Dominicana.
 * Utilizado para selección rápida, cálculo de copagos y autorizaciones clínicas.
 */
export interface ArsoInfo {
  id: string;
  nombre: string;
  tipo: 'PUBLICA' | 'PRIVADA' | 'AUTOGESTION';
  coberturaDefault: number; // Porcentaje estándar de cobertura en consulta ambulatoria (ej. 80%)
  planes: string[];
}

export const ARS_DOMINICANAS: ArsoInfo[] = [
  {
    id: 'senasa-contributivo',
    nombre: 'SeNaSa (Contributivo)',
    tipo: 'PUBLICA',
    coberturaDefault: 80,
    planes: ['Básico', 'Complementario Especial', 'Avanzado', 'Máximo'],
  },
  {
    id: 'senasa-subsidiado',
    nombre: 'SeNaSa (Subsidiado)',
    tipo: 'PUBLICA',
    coberturaDefault: 100,
    planes: ['Subsidiado Nacional'],
  },
  {
    id: 'primera-ars-humano',
    nombre: 'Primera ARS de Humano',
    tipo: 'PRIVADA',
    coberturaDefault: 80,
    planes: ['Básico (PDSS)', 'Platinium', 'Global', 'Royal', 'Max'],
  },
  {
    id: 'mapfre-salud',
    nombre: 'Mapfre Salud ARS',
    tipo: 'PRIVADA',
    coberturaDefault: 80,
    planes: ['Básico', 'Élite', 'Tranquilidad', 'Fidelidad', 'Plus'],
  },
  {
    id: 'ars-universal',
    nombre: 'ARS Universal',
    tipo: 'PRIVADA',
    coberturaDefault: 80,
    planes: ['Básico', 'Superior', 'Exclusivo', 'Premier'],
  },
  {
    id: 'ars-monumental',
    nombre: 'ARS Monumental',
    tipo: 'PRIVADA',
    coberturaDefault: 80,
    planes: ['Básico', 'Especial', 'VIP'],
  },
  {
    id: 'ars-renacer',
    nombre: 'ARS Renacer',
    tipo: 'PRIVADA',
    coberturaDefault: 75,
    planes: ['Básico', 'Complementario'],
  },
  {
    id: 'ars-futuro',
    nombre: 'ARS Futuro',
    tipo: 'PRIVADA',
    coberturaDefault: 75,
    planes: ['Básico', 'Familiar', 'Preferencial'],
  },
  {
    id: 'ars-simag',
    nombre: 'ARS Simag (Grumed)',
    tipo: 'PRIVADA',
    coberturaDefault: 80,
    planes: ['Básico', 'Corporativo'],
  },
  {
    id: 'ars-aps',
    nombre: 'ARS APS',
    tipo: 'PRIVADA',
    coberturaDefault: 75,
    planes: ['Básico', 'Plus'],
  },
  {
    id: 'ars-meta-salud',
    nombre: 'ARS Meta Salud',
    tipo: 'PRIVADA',
    coberturaDefault: 75,
    planes: ['Básico', 'Integral'],
  },
  {
    id: 'particular',
    nombre: 'Privado / Sin Seguro (Particular)',
    tipo: 'PRIVADA',
    coberturaDefault: 0,
    planes: ['Tarifa Privada'],
  },
];
