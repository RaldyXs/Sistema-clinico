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
import { Consulta } from '../../consultas/entities/consulta.entity.js';

/**
 * Estados del ciclo de vida legal y asistencial de una receta médica.
 */
export enum EstadoReceta {
  /**
   * Receta formalmente emitida y firmada por el facultativo.
   * Válida para su dispensación en farmacia o entrega al paciente.
   */
  EMITIDA = 'EMITIDA',

  /**
   * Receta cuyos fármacos ya han sido despachados en farmacia.
   */
  DISPENSADA = 'DISPENSADA',

  /**
   * Receta invalidada por el médico (ej. detección de alergia tardía o corrección de posología).
   * Conserva el registro en el historial asistencial con justificación médica obligatoria.
   */
  ANULADA = 'ANULADA',
}

/**
 * Representación atómica y tipada de un medicamento dentro de la prescripción.
 * Se almacena en la columna JSONB de PostgreSQL 18 para garantizar transaccionalidad,
 * rendimiento y desacoplamiento sin requerir tablas maestras intermedias forzosas.
 */
export interface MedicamentoReceta {
  /** Nombre genérico (principio activo) o comercial del fármaco prescrito */
  medicamento: string;
  /** Concentración y presentación farmacéutica (ej. 'Comprimidos 500 mg', 'Jarabe 250mg/5ml') */
  presentacion: string;
  /** Dosis o cantidad por toma (ej. '1 comprimido', '5 ml', '2 gotas') */
  dosis: string;
  /** Vía de administración (ej. 'Oral', 'Tópica', 'Oftálmica', 'Inhalatoria', 'Intravenosa') */
  via: string;
  /** Intervalo horario entre tomas (ej. 'cada 8 horas', 'cada 12 horas', 'cada 24 horas') */
  frecuencia: string;
  /** Plazo total del tratamiento farmacológico (ej. 'por 7 días', 'por 1 mes', 'uso crónico') */
  duracion: string;
  /** Indicaciones específicas adicionales para el paciente (ej. 'Tomar con abundante agua antes de las comidas') */
  indicaciones?: string;
  /** Cantidad de cajas, frascos o unidades a dispensar en farmacia */
  cantidad?: number;
}

/**
 * Entidad Receta Médica (Prescripción Farmacológica Digital).
 *
 * Rol en la arquitectura del Sistema Clínico Multi-Tenant:
 * Permite registrar las recetas médicas vinculadas al acto asistencial (Consulta)
 * o de forma autónoma (recetas de repetición o tratamientos crónicos).
 *
 * Características clave:
 * - Hereda de `TenantBaseEntity`: incorpora `id` (UUID), `consultorioId` (aislamiento estricto)
 *   y auditoría temporal (`creadoEn`, `actualizadoEn`).
 * - Folio único compuesto: `(consultorio_id, numero_receta)` previene duplicidades de folios
 *   dentro del mismo consultorio sin colisionar con otros centros médicos.
 * - Integridad referencial médica: `onDelete: 'RESTRICT'` tanto para `paciente` como para `profesional`.
 * - Almacenamiento JSONB de fármacos: serialización eficiente y optimizada para el generador de PDF.
 */
@Entity('recetas')
@Index('idx_recetas_consultorio_paciente', [
  'consultorioId',
  'pacienteId',
  'fechaEmision',
])
@Index('idx_recetas_consultorio_profesional', [
  'consultorioId',
  'profesionalId',
  'fechaEmision',
])
@Index('idx_recetas_consultorio_numero', ['consultorioId', 'numeroReceta'], {
  unique: true,
})
@Index('idx_recetas_consultorio_consulta', ['consultorioId', 'consultaId'])
@Index('idx_recetas_consultorio_fecha', ['consultorioId', 'fechaEmision'])
export class Receta extends TenantBaseEntity {
  /**
   * Identificador foráneo del paciente que recibe la prescripción.
   */
  @Column({ name: 'paciente_id', type: 'uuid' })
  pacienteId: string;

  /**
   * Relación con el paciente evaluado.
   * `onDelete: 'RESTRICT'` salvaguarda el historial terapéutico del paciente.
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
   * Relación con el médico responsable de la prescripción.
   * `onDelete: 'RESTRICT'` garantiza la autoría profesional inalterable.
   */
  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'profesional_id' })
  profesional: Usuario;

  /**
   * Identificador foráneo opcional de la consulta clínica origen.
   * Nullable para permitir recetas extendidas fuera de una consulta formal.
   */
  @Column({ name: 'consulta_id', type: 'uuid', nullable: true })
  consultaId: string | null;

  /**
   * Relación opcional con la consulta médica.
   * `onDelete: 'SET NULL'` para preservar la validez de la receta aún si la consulta se anula.
   */
  @ManyToOne(() => Consulta, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'consulta_id' })
  consulta: Consulta | null;

  /**
   * Número de folio o código correlativo de la receta en el consultorio.
   * Formato estándar recomendado: `REC-YYYY-000001`.
   */
  @Column({ name: 'numero_receta', type: 'varchar', length: 50 })
  numeroReceta: string;

  /**
   * Fecha y hora exacta de emisión de la receta médica.
   */
  @Column({ name: 'fecha_emision', type: 'timestamp with time zone' })
  fechaEmision: Date;

  /**
   * Fecha de caducidad para el despacho en farmacia (formato 'YYYY-MM-DD').
   */
  @Column({ name: 'fecha_vencimiento', type: 'date', nullable: true })
  fechaVencimiento: string | null;

  /**
   * Estado del documento: EMITIDA, DISPENSADA o ANULADA.
   */
  @Column({
    type: 'varchar',
    length: 30,
    default: EstadoReceta.EMITIDA,
  })
  estado: EstadoReceta;

  /**
   * Diagnóstico clínico de referencia o código CIE-10 justificado para el tratamiento.
   */
  @Column({
    name: 'diagnostico_referencia',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  diagnosticoReferencia: string | null;

  /**
   * Lista atómica y estructurada de medicamentos prescritos (almacenamiento JSONB en PostgreSQL 18).
   */
  @Column({ type: 'jsonb' })
  medicamentos: MedicamentoReceta[];

  /**
   * Instrucciones generales de cuidado, indicaciones higiénico-dietéticas o signos de alarma.
   */
  @Column({ name: 'indicaciones_generales', type: 'text', nullable: true })
  indicacionesGenerales: string | null;

  /**
   * Motivo justificado si la receta médica es anulada.
   */
  @Column({ name: 'motivo_anulacion', type: 'text', nullable: true })
  motivoAnulacion: string | null;
}
