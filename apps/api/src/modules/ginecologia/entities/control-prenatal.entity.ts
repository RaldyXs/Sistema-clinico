import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity.js';
import { Embarazo } from './embarazo.entity.js';
import { Paciente } from '../../pacientes/entities/paciente.entity.js';
import { Consulta } from '../../consultas/entities/consulta.entity.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

/**
 * Presentación y orientación del polo fetal en cavidad uterina.
 */
export enum PresentacionFetal {
  CEFALICA = 'CEFALICA',
  PODALICA = 'PODALICA',
  TRANSVERSA = 'TRANSVERSA',
  NO_EVALUABLE = 'NO_EVALUABLE',
}

/**
 * Grados clínicos de edema en extremidades.
 */
export enum EdemaGrado {
  AUSENTE = 'AUSENTE',
  GRADO_I = 'GRADO_I',
  GRADO_II = 'GRADO_II',
  GRADO_III = 'GRADO_III',
}

/**
 * Entidad ControlPrenatal.
 *
 * Registra cada consulta periódica de vigilancia materno-fetal con biometría clínica:
 * altura uterina, frecuencia cardíaca fetal, signos de alarma obstétrica y presión arterial.
 */
@Entity('controles_prenatales')
@Index('idx_controles_consultorio_embarazo', ['consultorioId', 'embarazoId', 'numeroControl'])
@Index('idx_controles_consultorio_paciente', ['consultorioId', 'pacienteId', 'fechaControl'])
export class ControlPrenatal extends TenantBaseEntity {
  /**
   * Identificador foráneo del embarazo al que pertenece este control.
   */
  @Column({ name: 'embarazo_id', type: 'uuid' })
  embarazoId: string;

  /**
   * Relación con el embarazo.
   */
  @ManyToOne(() => Embarazo, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'embarazo_id' })
  embarazo: Embarazo;

  /**
   * Identificador foráneo de la paciente gestante.
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
   * Identificador foráneo del profesional o médico evaluador.
   */
  @Column({ name: 'profesional_id', type: 'uuid' })
  profesionalId: string;

  /**
   * Relación con el médico responsable del control.
   */
  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'profesional_id' })
  profesional: Usuario;

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

  // ─── DATOS DEL CONTROL ─────────────────────────────────────────────────────

  /**
   * Número ordinal del control dentro del embarazo (#1, #2, #3...).
   */
  @Column({ name: 'numero_control', type: 'smallint' })
  numeroControl: number;

  /**
   * Fecha y hora en que se llevó a cabo el control prenatal.
   */
  @Column({ name: 'fecha_control', type: 'timestamp with time zone' })
  fechaControl: Date;

  /**
   * Semanas de edad gestacional cumplidas al momento del control (0 a 43).
   */
  @Column({ name: 'edad_gestacional_semanas', type: 'smallint' })
  edadGestacionalSemanas: number;

  /**
   * Días adicionales de edad gestacional (0 a 6).
   */
  @Column({ name: 'edad_gestacional_dias', type: 'smallint', default: 0 })
  edadGestacionalDias: number;

  // ─── BIOMETRÍA Y SIGNOS VITALES MATERNOS ───────────────────────────────────

  /**
   * Peso materno actual registrado en el control en kg (ej. 63.40).
   */
  @Column({
    name: 'peso_materno_kg',
    type: 'decimal',
    precision: 5,
    scale: 2,
  })
  pesoMaternoKg: number;

  /**
   * Ganancia acumulada de peso respecto al peso pregestacional en kg.
   */
  @Column({
    name: 'ganancia_peso_kg',
    type: 'decimal',
    precision: 4,
    scale: 2,
    nullable: true,
  })
  gananciaPesoKg: number | null;

  /**
   * Presión arterial sistólica en mmHg (ej. 110).
   */
  @Column({ name: 'presion_sistolica', type: 'smallint' })
  presionSistolica: number;

  /**
   * Presión arterial diastólica en mmHg (ej. 70).
   */
  @Column({ name: 'presion_diastolica', type: 'smallint' })
  presionDiastolica: number;

  // ─── EVALUACIÓN FETAL Y OBSTÉTRICA ─────────────────────────────────────────

  /**
   * Altura Uterina (AU) en centímetros (sínfisis púbica a fondo uterino).
   */
  @Column({ name: 'altura_uterina_cm', type: 'smallint', nullable: true })
  alturaUterinaCm: number | null;

  /**
   * Frecuencia Cardíaca Fetal (FCF) en latidos por minuto (ej. 142 lpm).
   */
  @Column({
    name: 'frecuencia_cardiaca_fetal_lpm',
    type: 'smallint',
    nullable: true,
  })
  frecuenciaCardiacaFetalLpm: number | null;

  /**
   * Percepción de movimientos fetales por parte de la madre.
   */
  @Column({
    name: 'movimientos_fetales',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  movimientosFetales: string | null;

  /**
   * Presentación y estática fetal diagnosticada.
   */
  @Column({
    name: 'presentacion_fetal',
    type: 'varchar',
    length: 30,
    default: PresentacionFetal.NO_EVALUABLE,
  })
  presentacionFetal: PresentacionFetal;

  /**
   * Grado de edema en miembros inferiores o generalizado.
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: EdemaGrado.AUSENTE,
  })
  edema: EdemaGrado;

  /**
   * Proteinuria cualitativa en tirilla de orina rápida (Negativa, Trazas, 1+, 2+, 3+).
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  proteinuria: string | null;

  /**
   * Lista de síntomas de alarma preeclámptica o de parto prematuro detectados.
   */
  @Column({ name: 'sintomas_alarma', type: 'jsonb', nullable: true })
  sintomasAlarma: string[] | null;

  // ─── PLAN Y SEGUIMIENTO ────────────────────────────────────────────────────

  /**
   * Indicaciones terapéuticas, suplementación vitamínica y plan de manejo.
   */
  @Column({ type: 'text', nullable: true })
  indicaciones: string | null;

  /**
   * Fecha sugerida para el próximo control prenatal de seguimiento.
   */
  @Column({ name: 'proximo_control_fecha', type: 'date', nullable: true })
  proximoControlFecha: string | null;
}
