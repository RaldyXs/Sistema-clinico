import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Entidad AuditoriaLog.
 *
 * Registra eventos clínicos, administrativos y de seguridad en el sistema
 * con trazabilidad inmutable conforme a directrices HIPAA y GDPR para salud.
 * 
 * Principios de seguridad aplicados:
 * - Aislamiento multi-tenant estricto mediante `@Index() consultorioId`.
 * - Trazabilidad de quién (usuario, email), qué (módulo, acción, entidad),
 *   cuándo (timestamp inmutable) y desde dónde (IP y User-Agent).
 */
@Entity('auditoria_logs')
export class AuditoriaLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'consultorio_id', type: 'uuid' })
  consultorioId: string;

  @Column({ name: 'usuario_id', type: 'uuid', nullable: true })
  usuarioId: string | null;

  @Column({ name: 'usuario_email', type: 'varchar', length: 150, default: 'sistema' })
  usuarioEmail: string;

  @Column({ name: 'usuario_nombre', type: 'varchar', length: 150, default: 'Sistema' })
  usuarioNombre: string;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  modulo: string;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  accion: string;

  @Column({ name: 'entidad_tipo', type: 'varchar', length: 50, nullable: true })
  entidadTipo: string | null;

  @Index()
  @Column({ name: 'entidad_id', type: 'varchar', length: 100, nullable: true })
  entidadId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  detalles: Record<string, any> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 50, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;
}
