import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';
import { Rol } from '../../roles/entities/rol.entity.js';

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

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ name: 'logo_url', type: 'varchar', length: 500, nullable: true })
  logoUrl: string | null;

  @Column({ name: 'color_primario', type: 'varchar', length: 20, default: '#0284c7' })
  colorPrimario: string;

  @Column({ name: 'color_secundario', type: 'varchar', length: 20, default: '#0f172a' })
  colorSecundario: string;

  /**
   * Configuración de agenda y horarios de apertura de la clínica.
   * Ejemplo: { dias: ['LUNES', 'MARTES', ...], horaInicio: '08:00', horaFin: '18:00', duracionCitaMinutos: 30 }
   */
  @Column({ name: 'horario_atencion', type: 'jsonb', nullable: true })
  horarioAtencion: Record<string, any> | null;

  /**
   * Módulos funcionales y de especialidad activos para este tenant.
   * Ejemplo: { ginecologia: true, pediatria: false, cardiologia: false, recetas: true }
   */
  @Column({
    name: 'modulos_activos',
    type: 'jsonb',
    default: { ginecologia: true, general: true, recetas: true, documentos: true },
  })
  modulosActivos: Record<string, boolean>;

  /**
   * Configuración estética y de membrete para la impresión de recetas médicas.
   * Ejemplo: { encabezado: '...', piePagina: '...', mostrarSignosVitales: true }
   */
  @Column({ name: 'configuracion_receta', type: 'jsonb', nullable: true })
  configuracionReceta: Record<string, any> | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  /**
   * Relación uno a muchos con usuarios.
   * Permite consultar todos los profesionales o administrativos de un consultorio.
   */
  @OneToMany(() => Usuario, (usuario) => usuario.consultorio)
  usuarios: Usuario[];

  /**
   * Roles personalizados definidos específicamente para este consultorio.
   */
  @OneToMany(() => Rol, (rol) => rol.consultorio)
  roles: Rol[];

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn: Date;
}
