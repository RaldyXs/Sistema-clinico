import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity.js';
import { Paciente } from '../../pacientes/entities/paciente.entity.js';
import { Embarazo } from './embarazo.entity.js';
import { Consulta } from '../../consultas/entities/consulta.entity.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';
import { DocumentoClinico } from '../../documentos/entities/documento-clinico.entity.js';

/**
 * Modalidad o tipo de estudio ecográfico.
 */
export enum TipoEcografia {
  TRANSVAGINAL_PRECOZ = 'TRANSVAGINAL_PRECOZ',
  SCREENING_11_14 = 'SCREENING_11_14',
  MORFOLOGICA_20_24 = 'MORFOLOGICA_20_24',
  CRECIMIENTO_TERCER_TRIMESTRE = 'CRECIMIENTO_TERCER_TRIMESTRE',
  DOPPLER_FETO_PLACENTARIO = 'DOPPLER_FETO_PLACENTARIO',
  GINECOLOGICA_PELVICA = 'GINECOLOGICA_PELVICA',
}

/**
 * Parámetros biométricos fetales estructurados (Fórmula de Hadlock y curvas OMS).
 */
export interface BiometriaHadlock {
  /** Diámetro Biparietal en milímetros */
  dbpMm?: number;
  /** Circunferencia Cefálica en milímetros */
  ccMm?: number;
  /** Circunferencia Abdominal en milímetros */
  caMm?: number;
  /** Longitud Femoral en milímetros */
  lfMm?: number;
  /** Longitud Céfalo-Nalgas en milímetros (ecografía precoz) */
  lcnMm?: number;
  /** Peso Fetal Estimado en gramos (fórmula Hadlock) */
  pfeGramos?: number;
  /** Percentil de peso para la edad gestacional (1 al 100) */
  percentil?: number;
  /** Frecuencia Cardíaca Fetal ecográfica en latidos por minuto */
  fcfLpm?: number;
  /** Translucencia Nucal en milímetros (screening 11-14) */
  translucenciaNucalMm?: number;
  /** Visualización de Hueso Nasal (Presente / Ausente) */
  huesoNasal?: 'PRESENTE' | 'AUSENTE';
}

/**
 * Entidad Ecografia (Informes Ecográficos Gineco-Obstétricos).
 *
 * Rol en la arquitectura:
 * Estandariza los informes de ultrasonido fetal y pélvico con biometría Hadlock,
 * evaluación de placenta, líquido amniótico y anexos ováricos.
 */
@Entity('ecografias')
@Index('idx_eco_consultorio_paciente', ['consultorioId', 'pacienteId', 'fechaEstudio'])
@Index('idx_eco_consultorio_embarazo', ['consultorioId', 'embarazoId'])
export class Ecografia extends TenantBaseEntity {
  /**
   * Identificador foráneo de la paciente evaluada.
   */
  @Column({ name: 'paciente_id', type: 'uuid' })
  pacienteId: string;

  /**
   * Relación con la paciente.
   */
  @ManyToOne(() => Paciente, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  /**
   * Identificador foráneo opcional del embarazo en curso (null si es ginecológica).
   */
  @Column({ name: 'embarazo_id', type: 'uuid', nullable: true })
  embarazoId: string | null;

  /**
   * Relación con el embarazo.
   */
  @ManyToOne(() => Embarazo, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'embarazo_id' })
  embarazo: Embarazo | null;

  /**
   * Identificador foráneo opcional de la consulta clínica origen.
   */
  @Column({ name: 'consulta_id', type: 'uuid', nullable: true })
  consultaId: string | null;

  /**
   * Relación con la consulta médica.
   */
  @ManyToOne(() => Consulta, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'consulta_id' })
  consulta: Consulta | null;

  /**
   * Identificador foráneo del profesional o médico ecografista que realizó el estudio.
   */
  @Column({ name: 'profesional_id', type: 'uuid' })
  profesionalId: string;

  /**
   * Relación con el médico responsable.
   */
  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'profesional_id' })
  profesional: Usuario;

  /**
   * Identificador foráneo opcional del archivo adjunto (imagen o PDF ecográfico).
   */
  @Column({ name: 'documento_id', type: 'uuid', nullable: true })
  documentoId: string | null;

  /**
   * Relación con el archivo clínico almacenado.
   */
  @ManyToOne(() => DocumentoClinico, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'documento_id' })
  documento: DocumentoClinico | null;

  // ─── TIPO Y FECHA DEL ESTUDIO ──────────────────────────────────────────────

  /**
   * Modalidad ecográfica efectuada.
   */
  @Column({
    name: 'tipo_ecografia',
    type: 'varchar',
    length: 50,
  })
  tipoEcografia: TipoEcografia;

  /**
   * Fecha y hora en que se ejecutó el procedimiento ecográfico.
   */
  @Column({ name: 'fecha_estudio', type: 'timestamp with time zone' })
  fechaEstudio: Date;

  /**
   * Edad gestacional ecográfica estimada (semanas).
   */
  @Column({ name: 'edad_gestacional_semanas', type: 'smallint', nullable: true })
  edadGestacionalSemanas: number | null;

  /**
   * Edad gestacional ecográfica estimada (días adicionales).
   */
  @Column({ name: 'edad_gestacional_dias', type: 'smallint', nullable: true })
  edadGestacionalDias: number | null;

  // ─── BIOMETRÍA FETAL Y HADLOCK (JSONB) ──────────────────────────────────────

  /**
   * Parámetros biométricos fetales detallados (almacenamiento estructurado en JSONB).
   */
  @Column({ name: 'biometria_fetal', type: 'jsonb', nullable: true })
  biometriaFetal: BiometriaHadlock | null;

  // ─── ANEXOS OBSTÉTRICOS: PLACENTA Y LÍQUIDO ────────────────────────────────

  /**
   * Localización anatómica de la placenta (Anterior, Posterior, Fúndica, Previa).
   */
  @Column({
    name: 'placenta_localizacion',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  placentaLocalizacion: string | null;

  /**
   * Grado de madurez placentaria según Grannum (0, 1, 2, 3).
   */
  @Column({ name: 'placenta_grado', type: 'smallint', nullable: true })
  placentaGrado: number | null;

  /**
   * Evaluación del volumen de líquido amniótico (Normal, Oligohidramnios, Polihidramnios).
   */
  @Column({
    name: 'liquido_amniotico',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  liquidoAmniotico: string | null;

  /**
   * Índice de Líquido Amniótico (ILA) en centímetros o pozo mayor en mm.
   */
  @Column({
    name: 'ila_cm',
    type: 'decimal',
    precision: 4,
    scale: 1,
    nullable: true,
  })
  ilaCm: number | null;

  // ─── VARIABLES GINECOLÓGICAS PÉLVICAS (No obstétricas) ─────────────────────

  /**
   * Medidas del útero (longitud x anteroposterior x transversal en mm).
   */
  @Column({ name: 'utero_medidas', type: 'varchar', length: 100, nullable: true })
  uteroMedidas: string | null;

  /**
   * Grosor de la línea endometrial en milímetros (ej. 8.5 mm).
   */
  @Column({
    name: 'endometrio_grosor_mm',
    type: 'decimal',
    precision: 4,
    scale: 1,
    nullable: true,
  })
  endometrioGrosorMm: number | null;

  /**
   * Evaluación ecográfica de ovarios y fondos de saco de Douglas.
   */
  @Column({ name: 'ovarios_detalles', type: 'text', nullable: true })
  ovariosDetalles: string | null;

  // ─── CONCLUSIÓN DIAGNÓSTICA ────────────────────────────────────────────────

  /**
   * Diagnóstico ecográfico concluyente e informe final del médico.
   */
  @Column({ name: 'conclusion_diagnostica', type: 'text' })
  conclusionDiagnostica: string;

  /**
   * Observaciones y recomendaciones de seguimiento ecográfico.
   */
  @Column({ type: 'text', nullable: true })
  observaciones: string | null;
}
