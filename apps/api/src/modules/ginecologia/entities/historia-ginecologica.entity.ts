import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity.js';
import { Paciente } from '../../pacientes/entities/paciente.entity.js';

/**
 * Entidad HistoriaGinecologica.
 *
 * Rol en la arquitectura satelital:
 * Registra los antecedentes ginecológicos basales y la fórmula obstétrica
 * longitudinal de la paciente sin modificar la tabla central de pacientes.
 */
@Entity('historias_ginecologicas')
@Index('idx_historia_gin_consultorio_paciente', ['consultorioId', 'pacienteId'], {
  unique: true,
})
export class HistoriaGinecologica extends TenantBaseEntity {
  /**
   * Identificador foráneo de la paciente evaluada.
   */
  @Column({ name: 'paciente_id', type: 'uuid' })
  pacienteId: string;

  /**
   * Relación con la paciente.
   * `onDelete: 'RESTRICT'` para salvaguardar el historial médico-legal.
   */
  @ManyToOne(() => Paciente, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  // ─── ANTECEDENTES MENSTRUALES ──────────────────────────────────────────────

  /**
   * Edad en años cumplidos de la primera menstruación (menarquía).
   */
  @Column({ name: 'menarquia_edad', type: 'smallint', nullable: true })
  menarquiaEdad: number | null;

  /**
   * Duración promedio habitual del ciclo menstrual en días (ej. 28, 30).
   */
  @Column({ name: 'ciclo_dias', type: 'smallint', default: 28 })
  cicloDias: number;

  /**
   * Regularidad menstrual (true = regular, false = irregular/oligomenorrea).
   */
  @Column({ name: 'ciclo_regular', type: 'boolean', default: true })
  cicloRegular: boolean;

  /**
   * Fecha de la última menstruación conocida (FUM / FUR).
   */
  @Column({ type: 'date', nullable: true })
  fum: string | null;

  /**
   * Presencia de dismenorrea (dolor menstrual clínicamente significativo).
   */
  @Column({ type: 'boolean', default: false })
  dismenorrea: boolean;

  // ─── PLANIFICACIÓN FAMILIAR Y ANTICONCEPCIÓN ───────────────────────────────

  /**
   * Método anticonceptivo en uso actual (ej. ACO, DIU Cobre, DIU Mirena, Implante, Ninguno).
   */
  @Column({
    name: 'anticonceptivo_actual',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  anticonceptivoActual: string | null;

  /**
   * Métodos anticonceptivos empleados previamente.
   */
  @Column({
    name: 'metodos_previos',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  metodosPrevios: string | null;

  // ─── FÓRMULA OBSTÉTRICA HISTÓRICA (G-P-C-A-E) ──────────────────────────────

  /**
   * G (Gestas): Total histórico de embarazos (incluye abortos y ectópicos).
   */
  @Column({ type: 'smallint', default: 0 })
  gestas: number;

  /**
   * P (Partos): Total de nacimientos por parto vaginal.
   */
  @Column({ type: 'smallint', default: 0 })
  partos: number;

  /**
   * C (Cesáreas): Total de nacimientos por cesárea abdominal.
   */
  @Column({ type: 'smallint', default: 0 })
  cesareas: number;

  /**
   * A (Abortos): Pérdidas espontáneas o provocadas antes de la viabilidad fetal.
   */
  @Column({ type: 'smallint', default: 0 })
  abortos: number;

  /**
   * E (Ectópicos): Embarazos extrauterinos documentados.
   */
  @Column({ type: 'smallint', default: 0 })
  ectopicos: number;

  /**
   * Representación resumida de la paridad obstétrica (ej. "G2 P1 C0 A1").
   */
  @Column({
    name: 'formula_obstetrica',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  formulaObstetrica: string | null;

  // ─── ANTECEDENTES SEXUALES ─────────────────────────────────────────────────

  /**
   * Edad de inicio de vida sexual activa (coitarquía).
   */
  @Column({
    name: 'inicio_vida_sexual_edad',
    type: 'smallint',
    nullable: true,
  })
  inicioVidaSexualEdad: number | null;

  /**
   * Número estimado de parejas sexuales a lo largo de la vida.
   */
  @Column({ name: 'parejas_sexuales', type: 'smallint', nullable: true })
  parejasSexuales: number | null;

  // ─── TAMIZAJES PREVENTIVOS ─────────────────────────────────────────────────

  /**
   * Fecha de realización de la última citología cervical / Papanicolaou.
   */
  @Column({ name: 'pap_ultimo_fecha', type: 'date', nullable: true })
  papUltimoFecha: string | null;

  /**
   * Resultado del último PAP (ej. Negativo LIE, ASC-US, LIEBG, LIEAG).
   */
  @Column({
    name: 'pap_ultimo_resultado',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  papUltimoResultado: string | null;

  /**
   * Fecha de la última mamografía diagnóstica o de tamizaje.
   */
  @Column({ name: 'mamografia_ultima_fecha', type: 'date', nullable: true })
  mamografiaUltimaFecha: string | null;

  /**
   * Resultado categorizado según clasificación BI-RADS (0 al 6).
   */
  @Column({
    name: 'mamografia_ultima_resultado',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  mamografiaUltimaResultado: string | null;

  // ─── PATOLOGÍAS Y OBSERVACIONES ────────────────────────────────────────────

  /**
   * Antecedentes ginecológicos patológicos (SOP, endometriosis, miomatosis, ITU recurrente).
   */
  @Column({ name: 'patologias_ginecologicas', type: 'text', nullable: true })
  patologiasGinecologicas: string | null;

  /**
   * Observaciones y comentarios clínicos adicionales.
   */
  @Column({ type: 'text', nullable: true })
  observaciones: string | null;
}
