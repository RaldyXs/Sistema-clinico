import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity.js';
import { Paciente } from '../../pacientes/entities/paciente.entity.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

/**
 * Estados del ciclo de vida de una gestación.
 */
export enum EstadoEmbarazo {
  ACTIVO = 'ACTIVO',
  FINALIZADO_PARTO = 'FINALIZADO_PARTO',
  FINALIZADO_CESAREA = 'FINALIZADO_CESAREA',
  FINALIZADO_ABORTO = 'FINALIZADO_ABORTO',
}

/**
 * Clasificación de la gestación según número de fetos y corionicidad.
 */
export enum TipoEmbarazo {
  UNICO = 'UNICO',
  GEMELAR_MONOCORIAL = 'GEMELAR_MONOCORIAL',
  GEMELAR_BICORIAL = 'GEMELAR_BICORIAL',
  MULTIPLE = 'MULTIPLE',
}

/**
 * Factor Rhesus sanguíneo materno.
 */
export enum FactorRh {
  POSITIVO = 'POSITIVO',
  NEGATIVO = 'NEGATIVO',
}

/**
 * Entidad Embarazo (Expediente Obstétrico Individual).
 *
 * Rol en la arquitectura:
 * Gestiona cada episodio gestacional de una paciente con cálculo cronológico de FUR,
 * FPP (Regla de Naegele), edad gestacional y curva de ganancia ponderal.
 */
@Entity('embarazos')
@Index('idx_embarazos_consultorio_paciente', ['consultorioId', 'pacienteId', 'estado'])
@Index('idx_embarazos_consultorio_estado', ['consultorioId', 'estado'])
export class Embarazo extends TenantBaseEntity {
  /**
   * Identificador foráneo de la gestante.
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
   * Identificador foráneo del profesional o médico obstetra tratante.
   */
  @Column({ name: 'profesional_id', type: 'uuid' })
  profesionalId: string;

  /**
   * Relación con el profesional de salud.
   */
  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'profesional_id' })
  profesional: Usuario;

  /**
   * Número ordinal de gravidez para la paciente (#1, #2, #3...).
   */
  @Column({ name: 'gravidez_numero', type: 'smallint', default: 1 })
  gravidezNumero: number;

  /**
   * Estado actual del embarazo (ACTIVO o FINALIZADO con desenlace).
   */
  @Column({
    type: 'varchar',
    length: 30,
    default: EstadoEmbarazo.ACTIVO,
  })
  estado: EstadoEmbarazo;

  /**
   * Clasificación por multiplicidad fetal.
   */
  @Column({
    name: 'tipo_embarazo',
    type: 'varchar',
    length: 30,
    default: TipoEmbarazo.UNICO,
  })
  tipoEmbarazo: TipoEmbarazo;

  // ─── CRONOLOGÍA Y CÁLCULO OBSTÉTRICO ───────────────────────────────────────

  /**
   * Fecha de la Última Regla (FUR / LMP).
   */
  @Column({ type: 'date' })
  fur: string;

  /**
   * Confiabilidad clínica de la FUR informada por la paciente.
   */
  @Column({ name: 'fur_confiable', type: 'boolean', default: true })
  furConfiable: boolean;

  /**
   * Fecha Probable de Parto según Regla de Naegele (FUR + 7 días - 3 meses + 1 año).
   */
  @Column({ type: 'date' })
  fpp: string;

  /**
   * FPP corregida o confirmada por ecografía precoz del primer trimestre (si aplica).
   */
  @Column({ name: 'fpp_eco_precoz', type: 'date', nullable: true })
  fppEcoPrecoz: string | null;

  // ─── PERFIL SEROLÓGICO Y BIOMETRÍA PREGESTACIONAL ──────────────────────────

  /**
   * Grupo sanguíneo materno (A, B, AB, O).
   */
  @Column({ name: 'grupo_sanguineo', type: 'varchar', length: 10, nullable: true })
  grupoSanguineo: string | null;

  /**
   * Factor Rh materno (POSITIVO / NEGATIVO).
   */
  @Column({
    name: 'factor_rh',
    type: 'varchar',
    length: 15,
    nullable: true,
  })
  factorRh: FactorRh | null;

  /**
   * Marcador de sensibilización Rh previa (Coombs indirecto positivo).
   */
  @Column({ name: 'sensibilizada_rh', type: 'boolean', default: false })
  sensibilizadaRh: boolean;

  /**
   * Peso corporal pregestacional habitual en kilogramos (ej. 58.5).
   */
  @Column({
    name: 'peso_pregestacional_kg',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  pesoPregestacionalKg: number | null;

  /**
   * Talla materna en centímetros (ej. 165).
   */
  @Column({ name: 'talla_cm', type: 'smallint', nullable: true })
  tallaCm: number | null;

  /**
   * Índice de Masa Corporal pregestacional clasificado automáticamente.
   */
  @Column({
    name: 'imc_pregestacional',
    type: 'decimal',
    precision: 4,
    scale: 2,
    nullable: true,
  })
  imcPregestacional: number | null;

  // ─── FINALIZACIÓN Y DESENLACE OBSTÉTRICO ───────────────────────────────────

  /**
   * Fecha de término o desenlace de la gestación (parto, cesárea o aborto).
   */
  @Column({ name: 'fecha_termino', type: 'date', nullable: true })
  fechaTermino: string | null;

  /**
   * Resumen del desenlace (edad gestacional al nacer, peso RN, sexo, Apgar, complicaciones).
   */
  @Column({ name: 'desenlace_detalles', type: 'text', nullable: true })
  desenlaceDetalles: string | null;

  /**
   * Observaciones y factores de riesgo del embarazo (ej. edad materna avanzada, cesárea anterior).
   */
  @Column({ type: 'text', nullable: true })
  observaciones: string | null;
}
