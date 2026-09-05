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
import { Cita } from '../../citas/entities/cita.entity.js';

/**
 * Estados del ciclo de vida del acto médico y la consulta clínica.
 */
export enum EstadoConsulta {
  /**
   * Consulta en curso / borrador. El médico puede modificar cualquier sección
   * mientras atiende al paciente.
   */
  BORRADOR = 'BORRADOR',

  /**
   * Consulta formalmente firmada y cerrada por el facultativo.
   * Por normativas médico-legales, una consulta completada queda sellada e inmutable.
   */
  COMPLETADA = 'COMPLETADA',

  /**
   * Consulta anulada de forma excepcional por error administrativo justificado.
   * Conserva el registro y auditoría completa.
   */
  ANULADA = 'ANULADA',
}

/**
 * Entidad Consulta Clínica (Historia Clínica Digital).
 *
 * Rol en la arquitectura SaaS:
 * Representa el expediente y registro documental del acto médico efectuado
 * por un profesional de la salud a un paciente dentro de una clínica determinada.
 *
 * Principios aplicados:
 * - Hereda de `TenantBaseEntity`: incorpora `id` (UUID), `consultorioId` (aislamiento multi-tenant),
 *   y marcas de auditoría temporal (`creadoEn`, `actualizadoEn`).
 * - Integridad referencial `RESTRICT`: impide eliminar físicamente al paciente o al médico
 *   si poseen consultas registradas en su historial asistencial.
 * - Desacoplamiento seguro con Citas: la relación con `Cita` es opcional (`onDelete: 'SET NULL'`),
 *   lo que permite atenciones de urgencia sin turno previo o conservar la consulta ante bajas administrativas.
 * - Índices compuestos de alto desempeño para búsquedas instantáneas en el timeline cronológico del paciente.
 */
@Entity('consultas')
@Index('idx_consultas_consultorio_paciente', [
  'consultorioId',
  'pacienteId',
  'fechaAtencion',
])
@Index('idx_consultas_consultorio_profesional', [
  'consultorioId',
  'profesionalId',
  'fechaAtencion',
])
@Index('idx_consultas_consultorio_cita', ['consultorioId', 'citaId'])
@Index('idx_consultas_consultorio_cie10', ['consultorioId', 'codigoCie10'])
@Index('idx_consultas_consultorio_fecha', ['consultorioId', 'fechaAtencion'])
export class Consulta extends TenantBaseEntity {
  /**
   * Identificador foráneo del paciente evaluado.
   */
  @Column({ name: 'paciente_id', type: 'uuid' })
  pacienteId: string;

  /**
   * Relación con el paciente evaluado.
   * `onDelete: 'RESTRICT'` salvaguarda la integridad médico-legal del historial.
   */
  @ManyToOne(() => Paciente, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  /**
   * Identificador foráneo del médico o profesional de salud firmante.
   */
  @Column({ name: 'profesional_id', type: 'uuid' })
  profesionalId: string;

  /**
   * Relación con el médico responsable de la atención.
   * `onDelete: 'RESTRICT'` garantiza trazabilidad y autoría profesional inalterable.
   */
  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'profesional_id' })
  profesional: Usuario;

  /**
   * Identificador foráneo opcional de la cita programada que originó esta atención.
   */
  @Column({ name: 'cita_id', type: 'uuid', nullable: true })
  citaId: string | null;

  /**
   * Relación opcional con el turno de agenda (`Cita`).
   * `onDelete: 'SET NULL'` para no perder la consulta si la cita sufriera cambios administrativos.
   */
  @ManyToOne(() => Cita, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cita_id' })
  cita: Cita | null;

  /**
   * Fecha y hora exacta de realización de la consulta médica (timestamptz).
   */
  @Column({ name: 'fecha_atencion', type: 'timestamp with time zone' })
  fechaAtencion: Date;

  /**
   * Estado formal del acto médico: BORRADOR, COMPLETADA o ANULADA.
   */
  @Column({
    type: 'varchar',
    length: 30,
    default: EstadoConsulta.BORRADOR,
  })
  estado: EstadoConsulta;

  // ─── ANAMNESIS ─────────────────────────────────────────────────────────────

  /**
   * Motivo principal de la consulta manifestado por el paciente.
   * Ejemplo: "Cefalea intensa de 3 días de evolución", "Control prenatal".
   */
  @Column({ name: 'motivo_consulta', type: 'varchar', length: 255 })
  motivoConsulta: string;

  /**
   * Descripción cronológica y detallada del cuadro clínico actual.
   */
  @Column({ name: 'enfermedad_actual', type: 'text', nullable: true })
  enfermedadActual: string | null;

  // ─── SIGNOS VITALES Y BIOMETRÍA ────────────────────────────────────────────

  /**
   * Peso corporal del paciente en kilogramos.
   */
  @Column({ name: 'peso_kg', type: 'numeric', precision: 5, scale: 2, nullable: true })
  pesoKg: number | null;

  /**
   * Estatura o talla del paciente en centímetros.
   */
  @Column({ name: 'talla_cm', type: 'numeric', precision: 5, scale: 2, nullable: true })
  tallaCm: number | null;

  /**
   * Índice de Masa Corporal (IMC) calculado: peso / (talla/100)^2.
   */
  @Column({ name: 'imc', type: 'numeric', precision: 4, scale: 2, nullable: true })
  imc: number | null;

  /**
   * Presión arterial sistólica en mmHg (ej. 120).
   */
  @Column({ name: 'presion_sistolica', type: 'integer', nullable: true })
  presionSistolica: number | null;

  /**
   * Presión arterial diastólica en mmHg (ej. 80).
   */
  @Column({ name: 'presion_diastolica', type: 'integer', nullable: true })
  presionDiastolica: number | null;

  /**
   * Frecuencia cardíaca en latidos por minuto (lpm).
   */
  @Column({ name: 'frecuencia_cardiaca', type: 'integer', nullable: true })
  frecuenciaCardiaca: number | null;

  /**
   * Frecuencia respiratoria en respiraciones por minuto (rpm).
   */
  @Column({ name: 'frecuencia_respiratoria', type: 'integer', nullable: true })
  frecuenciaRespiratoria: number | null;

  /**
   * Temperatura corporal en grados Celsius (ej. 36.80).
   */
  @Column({ name: 'temperatura', type: 'numeric', precision: 4, scale: 2, nullable: true })
  temperatura: number | null;

  /**
   * Saturación de oxígeno periférico en porcentaje (SpO2 %, ej. 98.5).
   */
  @Column({ name: 'saturacion_oxigeno', type: 'numeric', precision: 4, scale: 1, nullable: true })
  saturacionOxigeno: number | null;

  // ─── EXPLORACIÓN Y EVOLUCIÓN ───────────────────────────────────────────────

  /**
   * Hallazgos obtenidos durante el examen físico del facultativo.
   */
  @Column({ name: 'examen_fisico', type: 'text', nullable: true })
  examenFisico: string | null;

  /**
   * Notas de evolución clínica o reflexiones médicas internas del caso.
   */
  @Column({ name: 'notas_evolucion', type: 'text', nullable: true })
  notasEvolucion: string | null;

  // ─── DIAGNÓSTICO Y TERAPÉUTICA ────────────────────────────────────────────

  /**
   * Diagnóstico principal emitido por el médico.
   */
  @Column({ name: 'diagnostico_principal', type: 'varchar', length: 255, nullable: true })
  diagnosticoPrincipal: string | null;

  /**
   * Código diagnóstico internacional estandarizado (CIE-10).
   * Ejemplo: "J00", "I10", "E11.9".
   */
  @Column({ name: 'codigo_cie10', type: 'varchar', length: 20, nullable: true })
  codigoCie10: string | null;

  /**
   * Diagnósticos adicionales, comorbilidades o patologías secundarias detectadas.
   */
  @Column({ name: 'diagnosticos_secundarios', type: 'text', nullable: true })
  diagnosticosSecundarios: string | null;

  /**
   * Plan terapéutico detallado, farmacoterapia prescrita y medidas higiénico-dietéticas.
   */
  @Column({ name: 'plan_tratamiento', type: 'text', nullable: true })
  planTratamiento: string | null;

  /**
   * Indicaciones, advertencias de alarma y recomendaciones entregadas al paciente.
   */
  @Column({ name: 'indicaciones_generales', type: 'text', nullable: true })
  indicacionesGenerales: string | null;

  // ─── CIERRE Y SEGUIMIENTO ──────────────────────────────────────────────────

  /**
   * Fecha sugerida para el próximo control o cita de seguimiento (YYYY-MM-DD).
   */
  @Column({ name: 'proximo_control', type: 'date', nullable: true })
  proximoControl: string | null;

  /**
   * Fecha y hora en la que el facultativo cerró y selló la consulta médica (timestamptz).
   */
  @Column({ name: 'cerrada_en', type: 'timestamp with time zone', nullable: true })
  cerradaEn: Date | null;
}
