import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Permiso } from './permiso.entity.js';
import { Consultorio } from '../../consultorios/entities/consultorio.entity.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

/**
 * Entidad Rol.
 *
 * ¿Qué representa en la arquitectura RBAC?
 * Un Rol es un conjunto agrupado de Permisos asignable a los usuarios.
 *
 * Principio Multi-Tenant y Agnosticismo:
 * - `consultorioId === null`: Es un rol global o plantilla predefinida (ej. ADMIN general).
 * - `consultorioId !== null`: Es un rol personalizado creado específicamente por una clínica
 *   o empresa según su propia estructura operativa.
 * - `esSistema`: Impide que roles esenciales del sistema sean borrados por error.
 */
@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Nombre para mostrar.
   * Ejemplos: 'Administrador', 'Profesional de la Salud', 'Recepción'.
   */
  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  /**
   * Código en mayúsculas para comprobaciones rápidas en guards o decorators.
   * Ejemplos: 'ADMIN', 'PROFESIONAL_SALUD', 'RECEPCION', 'MIEMBRO'.
   */
  @Column({ type: 'varchar', length: 50 })
  codigo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  /**
   * Si es true, es un rol protegido del sistema y no puede eliminarse.
   */
  @Column({ name: 'es_sistema', type: 'boolean', default: false })
  esSistema: boolean;

  /**
   * Tenant al que pertenece el rol. Si es null, es un rol global/plantilla.
   */
  @Column({ name: 'consultorio_id', type: 'uuid', nullable: true })
  consultorioId: string | null;

  @ManyToOne(() => Consultorio, (consultorio) => consultorio.roles, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'consultorio_id' })
  consultorio: Consultorio | null;

  /**
   * Relación Muchos a Muchos: un rol contiene múltiples permisos.
   * TypeORM creará automáticamente la tabla intermedia `roles_permisos`.
   */
  @ManyToMany(() => Permiso, (permiso) => permiso.roles, { eager: true })
  @JoinTable({
    name: 'roles_permisos',
    joinColumn: { name: 'rol_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permiso_id', referencedColumnName: 'id' },
  })
  permisos: Permiso[];

  /**
   * Usuarios que tienen asignado este rol.
   */
  @OneToMany(() => Usuario, (usuario) => usuario.rol)
  usuarios: Usuario[];

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn: Date;
}
