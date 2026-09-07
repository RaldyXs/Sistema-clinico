import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity.js';
import { Paciente } from '../../pacientes/entities/paciente.entity.js';
import { Consulta } from '../../consultas/entities/consulta.entity.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

/**
 * Categorías estándar de documentos y estudios clínicos.
 */
export enum CategoriaDocumento {
  /** Análisis de sangre, orina, cultivos, citologías, biopsias */
  LABORATORIO = 'LABORATORIO',

  /** Ecografías, radiografías, mamografías, TAC, resonancias magnéticas */
  IMAGENOLOGIA = 'IMAGENOLOGIA',

  /** Informes, epicrisis o recetas externas emitidas por otros prestadores */
  INFORME_EXTERNO = 'INFORME_EXTERNO',

  /** Consentimientos informados firmados digitalmente o digitalizados */
  CONSENTIMIENTO = 'CONSENTIMIENTO',

  /** Otros documentos asistenciales o administrativos complementarios */
  OTRO = 'OTRO',
}

/**
 * Entidad DocumentoClinico (Almacenamiento y Adjuntos Médicos).
 *
 * Rol en la arquitectura SaaS:
 * Gestiona los metadatos de archivos adjuntos (estudios de laboratorio, ecografías,
 * consentimientos e informes) vinculados al historial del paciente o a un acto médico específico.
 *
 * Características clave:
 * - Hereda de `TenantBaseEntity`: incorpora `id` (UUID), `consultorioId` (aislamiento multi-tenant)
 *   y marcas de auditoría temporal (`creadoEn`, `actualizadoEn`).
 * - Integridad referencial médica: `onDelete: 'RESTRICT'` con `Paciente` y `Usuario`.
 * - Vínculo opcional con `Consulta`: `onDelete: 'SET NULL'` para conservar el documento si la consulta varía.
 * - Integridad de archivo: Hash criptográfico SHA-256 para validación de inalterabilidad.
 */
@Entity('documentos_clinicos')
@Index('idx_docs_consultorio_paciente', ['consultorioId', 'pacienteId', 'creadoEn'])
@Index('idx_docs_consultorio_consulta', ['consultorioId', 'consultaId'])
@Index('idx_docs_consultorio_categoria', ['consultorioId', 'categoria'])
export class DocumentoClinico extends TenantBaseEntity {
  /**
   * Identificador foráneo del paciente propietario del documento.
   */
  @Column({ name: 'paciente_id', type: 'uuid' })
  pacienteId: string;

  /**
   * Relación con el paciente evaluado.
   */
  @ManyToOne(() => Paciente, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  /**
   * Identificador foráneo opcional de la consulta médica asociada.
   */
  @Column({ name: 'consulta_id', type: 'uuid', nullable: true })
  consultaId: string | null;

  /**
   * Relación opcional con la consulta médica.
   */
  @ManyToOne(() => Consulta, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'consulta_id' })
  consulta: Consulta | null;

  /**
   * Identificador foráneo del profesional o usuario que subió el archivo.
   */
  @Column({ name: 'profesional_id', type: 'uuid' })
  profesionalId: string;

  /**
   * Relación con el usuario emisor o responsable de la carga.
   */
  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'profesional_id' })
  profesional: Usuario;

  /**
   * Categoría médica del archivo adjunto.
   */
  @Column({
    type: 'varchar',
    length: 40,
    default: CategoriaDocumento.OTRO,
  })
  categoria: CategoriaDocumento;

  /**
   * Nombre original del archivo proporcionado por el usuario al subirlo.
   */
  @Column({ name: 'nombre_original', type: 'varchar', length: 255 })
  nombreOriginal: string;

  /**
   * Nombre único generado en el disco para almacenamiento seguro (UUID + extensión).
   */
  @Column({ name: 'nombre_almacenado', type: 'varchar', length: 255 })
  nombreAlmacenado: string;

  /**
   * Tipo MIME del archivo (ej. application/pdf, image/jpeg, image/png).
   */
  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType: string;

  /**
   * Tamaño del archivo en bytes.
   */
  @Column({ name: 'peso_bytes', type: 'bigint' })
  pesoBytes: number;

  /**
   * Checksum SHA-256 para verificación de integridad criptográfica.
   */
  @Column({ name: 'hash_sha256', type: 'varchar', length: 64 })
  hashSha256: string;

  /**
   * Ruta relativa segura dentro del repositorio de almacenamiento del tenant.
   */
  @Column({ name: 'ruta_relativa', type: 'varchar', length: 500 })
  rutaRelativa: string;

  /**
   * Descripción clínica u observaciones adicionales del estudio.
   */
  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  /**
   * Fecha de realización o emisión del estudio o examen (formato YYYY-MM-DD).
   */
  @Column({ name: 'fecha_documento', type: 'date', nullable: true })
  fechaDocumento: string | null;
}
