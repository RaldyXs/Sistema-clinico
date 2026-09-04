import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Consultorio } from '../../consultorios/entities/consultorio.entity.js';

/**
 * Roles disponibles en el sistema.
 * Un enum tipado en TypeScript y PostgreSQL garantiza que nadie pueda
 * asignar un rol inexistente o arbitrario.
 */
export enum RolUsuario {
  ADMIN = 'ADMIN',
  MEDICO = 'MEDICO',
  RECEPCION = 'RECEPCION',
}

/**
 * Entidad Usuario.
 *
 * Rol en la arquitectura SaaS:
 * Representa a cualquier usuario capaz de autenticarse en la plataforma
 * (médicos, asistentes, administradores de consultorio).
 *
 * Principios de seguridad y buenas prácticas aplicadas:
 * - @Index: Indexamos el email para que las búsquedas en el Login sean instantáneas (O(log n)).
 * - `passwordHash`: NUNCA almacenamos la contraseña original; solo el hash de bcrypt.
 * - `consultorioId`: Clave foránea que ata al usuario a su organización (aislamiento multi-tenant).
 */
@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  apellido: string | null;

  @Column({
    type: 'enum',
    enum: RolUsuario,
    default: RolUsuario.MEDICO,
  })
  rol: RolUsuario;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  /**
   * Identificador del consultorio al que pertenece este usuario.
   */
  @Column({ name: 'consultorio_id', type: 'uuid' })
  consultorioId: string;

  /**
   * Relación muchos a uno: muchos usuarios pertenecen a un único consultorio.
   * `onDelete: 'RESTRICT'` impide que se borre accidentalmente un consultorio
   * si todavía tiene usuarios asociados en la base de datos.
   */
  @ManyToOne(() => Consultorio, (consultorio) => consultorio.usuarios, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'consultorio_id' })
  consultorio: Consultorio;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn: Date;
}
