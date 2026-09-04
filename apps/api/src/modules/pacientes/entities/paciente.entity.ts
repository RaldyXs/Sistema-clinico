import { Entity, Column, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity.js';

/**
 * Tipos de documento de identidad admitidos.
 */
export enum TipoDocumento {
  CEDULA = 'CEDULA',
  DNI = 'DNI',
  PASAPORTE = 'PASAPORTE',
  OTRO = 'OTRO',
}

/**
 * Género biológico / filiación del paciente.
 */
export enum Genero {
  FEMENINO = 'FEMENINO',
  MASCULINO = 'MASCULINO',
  OTRO = 'OTRO',
}

/**
 * Grupos sanguíneos estándar.
 */
export enum GrupoSanguineo {
  A_POSITIVO = 'A+',
  A_NEGATIVO = 'A-',
  B_POSITIVO = 'B+',
  B_NEGATIVO = 'B-',
  AB_POSITIVO = 'AB+',
  AB_NEGATIVO = 'AB-',
  O_POSITIVO = 'O+',
  O_NEGATIVO = 'O-',
  DESCONOCIDO = 'DESCONOCIDO',
}

/**
 * Entidad Paciente.
 *
 * Hereda de `TenantBaseEntity`:
 * - id: UUID v4 generado automáticamente.
 * - consultorioId: Clave foránea que ata al paciente a su consultorio (multi-tenant).
 * - creadoEn y actualizadoEn: Auditoría temporal en PostgreSQL.
 *
 * Índices:
 * - Índice compuesto único en `[consultorioId, documentoIdentidad]` para asegurar
 *   que no existan duplicados dentro de una misma clínica.
 * - Índice compuesto en `[consultorioId, apellido, nombre]` para búsquedas y filtros rápidos.
 */
@Entity('pacientes')
@Index('idx_paciente_consultorio_documento', ['consultorioId', 'documentoIdentidad'], {
  unique: true,
  where: '"documento_identidad" IS NOT NULL',
})
@Index('idx_paciente_consultorio_busqueda', ['consultorioId', 'apellido', 'nombre'])
export class Paciente extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 100 })
  apellido: string;

  @Column({
    name: 'tipo_documento',
    type: 'varchar',
    length: 20,
    default: TipoDocumento.CEDULA,
  })
  tipoDocumento: TipoDocumento;

  @Column({
    name: 'documento_identidad',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  documentoIdentidad: string | null;

  @Column({ name: 'fecha_nacimiento', type: 'date' })
  fechaNacimiento: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: Genero.FEMENINO,
  })
  genero: Genero;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  direccion: string | null;

  /**
   * Información Médica Transversal
   */
  @Column({
    name: 'grupo_sanguineo',
    type: 'varchar',
    length: 20,
    default: GrupoSanguineo.DESCONOCIDO,
  })
  grupoSanguineo: GrupoSanguineo;

  /**
   * Alergias registradas (medicamentosas, alimentarias, contacto).
   * Información crítica visible en la cabecera de la ficha del paciente.
   */
  @Column({ type: 'text', nullable: true })
  alergias: string | null;

  /**
   * Antecedentes médicos personales (hipertensión, asma, cirugías previas, etc.).
   */
  @Column({ name: 'antecedentes_medicos', type: 'text', nullable: true })
  antecedentesMedicos: string | null;

  /**
   * Antecedentes familiares de relevancia clínica.
   */
  @Column({ name: 'antecedentes_familiares', type: 'text', nullable: true })
  antecedentesFamiliares: string | null;

  /**
   * Datos de contacto en caso de emergencia.
   */
  @Column({ name: 'contacto_emergencia_nombre', type: 'varchar', length: 150, nullable: true })
  contactoEmergenciaNombre: string | null;

  @Column({ name: 'contacto_emergencia_telefono', type: 'varchar', length: 50, nullable: true })
  contactoEmergenciaTelefono: string | null;

  /**
   * Soft Delete: los pacientes no se borran físicamente de la base de datos
   * por razones legales y de trazabilidad médica.
   */
  @Column({ type: 'boolean', default: true })
  activo: boolean;
}
