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
 * Estados del flujo de atención clínica para una cita médica.
 * Representa el ciclo de vida completo de un turno en la clínica.
 */
export enum EstadoCita {
  PROGRAMADA = 'PROGRAMADA',
  CONFIRMADA = 'CONFIRMADA',
  EN_ESPERA = 'EN_ESPERA',
  EN_CONSULTA = 'EN_CONSULTA',
  ATENDIDA = 'ATENDIDA',
  CANCELADA = 'CANCELADA',
  NO_ASISTIO = 'NO_ASISTIO',
}

/**
 * Entidad Cita.
 *
 * Rol en la arquitectura SaaS:
 * Representa un turno médico o de servicio programado en la agenda de un profesional
 * dentro de un consultorio determinado.
 *
 * Principios aplicados:
 * - Hereda de `TenantBaseEntity`: incorpora `id` (UUID), `consultorioId` (aislamiento multi-tenant),
 *   y marcas de auditoría temporal (`creadoEn`, `actualizadoEn`).
 * - Regla de integridad `RESTRICT`: no se permite eliminar físicamente ni al paciente ni
 *   al médico si cuentan con citas registradas en la base de datos (preserva trazabilidad legal).
 * - Índices compuestos de alto rendimiento para búsquedas instantáneas de agenda, detección
 *   de solapamiento y sala de espera.
 */
@Entity('citas')
@Index('idx_citas_consultorio_inicio', ['consultorioId', 'fechaHoraInicio'])
@Index('idx_citas_profesional_agenda', [
  'consultorioId',
  'profesionalId',
  'fechaHoraInicio',
  'fechaHoraFin',
])
@Index('idx_citas_paciente_historial', ['consultorioId', 'pacienteId', 'fechaHoraInicio'])
@Index('idx_citas_consultorio_estado', ['consultorioId', 'estado'])
export class Cita extends TenantBaseEntity {
  /**
   * Identificador foráneo del paciente citado.
   */
  @Column({ name: 'paciente_id', type: 'uuid' })
  pacienteId: string;

  /**
   * Relación con el paciente citado.
   * `onDelete: 'RESTRICT'` impide que se elimine accidentalmente un paciente con historial de citas.
   */
  @ManyToOne(() => Paciente, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  /**
   * Identificador foráneo del médico o profesional de salud que atenderá el turno.
   */
  @Column({ name: 'profesional_id', type: 'uuid' })
  profesionalId: string;

  /**
   * Relación con el profesional de la salud.
   * `onDelete: 'RESTRICT'` salvaguarda el historial de atenciones del facultativo.
   */
  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'profesional_id' })
  profesional: Usuario;

  /**
   * Fecha y hora exacta de inicio de la cita con zona horaria (timestamptz).
   */
  @Column({ name: 'fecha_hora_inicio', type: 'timestamp with time zone' })
  fechaHoraInicio: Date;

  /**
   * Fecha y hora estimada de finalización del turno (timestamptz).
   * Permite consultas de solapamiento mediante comparación de intervalos temporales directos.
   */
  @Column({ name: 'fecha_hora_fin', type: 'timestamp with time zone' })
  fechaHoraFin: Date;

  /**
   * Duración programada en minutos para el turno médico.
   * Por defecto: 30 minutos.
   */
  @Column({ name: 'duracion_minutos', type: 'integer', default: 30 })
  duracionMinutos: number;

  /**
   * Estado actual en el ciclo de vida de la cita.
   * Sigue la máquina de estados clínicos: PROGRAMADA -> ATENDIDA.
   */
  @Column({
    type: 'varchar',
    length: 30,
    default: EstadoCita.PROGRAMADA,
  })
  estado: EstadoCita;

  /**
   * Motivo principal de la consulta médica manifestado por el paciente o recepcionista.
   * Ejemplo: "Control pediátrico", "Dolor lumbar persistente", "Chequeo anual".
   */
  @Column({ type: 'varchar', length: 255 })
  motivo: string;

  /**
   * Observaciones adicionales, requerimientos previos o notas administrativas de recepción.
   */
  @Column({ type: 'text', nullable: true })
  notas: string | null;

  /**
   * Justificación obligatoria en caso de que la cita sea cancelada.
   */
  @Column({ name: 'motivo_cancelacion', type: 'text', nullable: true })
  motivoCancelacion: string | null;
}
