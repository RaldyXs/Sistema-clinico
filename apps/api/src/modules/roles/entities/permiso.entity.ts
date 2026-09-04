import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Rol } from './rol.entity.js';

/**
 * Entidad Permiso.
 *
 * ¿Qué representa en la arquitectura RBAC?
 * Un Permiso es la acción más pequeña y atómica que un usuario puede realizar.
 * Sigue la convención estándar de la industria: `recurso:accion` (ej. `pacientes:crear`).
 *
 * Ventajas para tu SaaS:
 * - Es 100% granular y desacoplado del nombre de los puestos de trabajo.
 * - Los módulos funcionales (clínica, colegio, etc.) solo definen sus propios permisos;
 *   el motor de seguridad no necesita saber quién los ejecutará.
 */
@Entity('permisos')
export class Permiso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Código único del permiso en formato kebab/snake o recurso:accion.
   * Ejemplos:
   * - 'usuarios:crear' (Core SaaS)
   * - 'pacientes:ver' (Módulo Clínico)
   * - 'alumnos:ver' (Futuro Módulo Escolar)
   */
  @Column({ type: 'varchar', length: 100, unique: true })
  codigo: string;

  /**
   * Nombre legible para mostrar en la interfaz de configuración de roles.
   * Ejemplo: 'Crear nuevos pacientes'.
   */
  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  /**
   * Módulo funcional al que pertenece el permiso (para agrupar en pantallas).
   * Ejemplos: 'CORE_USUARIOS', 'CLINICA_PACIENTES', 'CLINICA_CITAS'.
   */
  @Column({ type: 'varchar', length: 100 })
  modulo: string;

  /**
   * Explicación detallada de lo que habilita este permiso.
   */
  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  /**
   * Relación Muchos a Muchos: un permiso puede estar incluido en muchos roles.
   */
  @ManyToMany(() => Rol, (rol) => rol.permisos)
  roles: Rol[];

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;
}
