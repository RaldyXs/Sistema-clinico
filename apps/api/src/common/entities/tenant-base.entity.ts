import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Consultorio } from '../../modules/consultorios/entities/consultorio.entity.js';

/**
 * Entidad Base Multi-Tenant (TenantBaseEntity).
 *
 * ¿Por qué es fundamental en la arquitectura de un SaaS?
 * En lugar de tener que escribir manualmente en cada tabla:
 * `consultorio_id`, `creado_en`, `actualizado_en`...
 * cualquier entidad de tu negocio (Pacientes, Citas, Consultas, Recetas, etc.)
 * simplemente hace: `export class Paciente extends TenantBaseEntity`.
 *
 * Beneficios:
 * 1. Garantiza que ninguna tabla futura olvide la columna de aislamiento `consultorio_id`.
 * 2. Estandariza las columnas de auditoría temporal en PostgreSQL.
 * 3. Proporciona claves primarias UUID v4 automáticas para prevenir ataques de enumeración.
 */
export abstract class TenantBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Identificador del consultorio al que pertenece este registro.
   * Clave foránea que separa los datos entre clínicas.
   */
  @Column({ name: 'consultorio_id', type: 'uuid' })
  consultorioId: string;

  /**
   * Relación con la entidad Consultorio (Organización / Tenant).
   * Si se elimina un consultorio, se eliminan en cascada sus registros asociados.
   */
  @ManyToOne(() => Consultorio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultorio_id' })
  consultorio: Consultorio;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn: Date;
}
