import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

/**
 * Entidad Consultorio (Tenant / Organización).
 *
 * Rol en la arquitectura SaaS:
 * Representa el inquilino (tenant) o cliente empresarial del sistema.
 * En este proyecto clínico, representa un consultorio, clínica o policlínico.
 * En el futuro, este mismo modelo sirve como "Organización" o "Empresa"
 * para cualquier otro SaaS multi-tenant.
 *
 * Decoradores de TypeORM:
 * - @Entity('consultorios'): Indica el nombre exacto de la tabla en PostgreSQL.
 * - @PrimaryGeneratedColumn('uuid'): Genera automáticamente un ID único UUID v4.
 * - @OneToMany: Un consultorio puede tener asociados múltiples usuarios.
 */
@Entity('consultorios')
export class Consultorio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion: string | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  /**
   * Relación uno a muchos con usuarios.
   * Permite consultar todos los profesionales o administrativos de un consultorio.
   */
  @OneToMany(() => Usuario, (usuario) => usuario.consultorio)
  usuarios: Usuario[];

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn: Date;
}
