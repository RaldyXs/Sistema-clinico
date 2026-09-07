import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Entidad SesionUsuario.
 *
 * Permite la gestión y auditoría de sesiones concurrentes por usuario y clínica:
 * - Detección de dispositivos (IP, Navegador, Sistema Operativo).
 * - Revocación selectiva de sesión remota (cierre forzoso de sesión en otros dispositivos).
 * - Revocación total de sesiones al cambiar contraseñas o ante incidentes de seguridad.
 */
@Entity('sesiones_usuario')
export class SesionUsuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Index()
  @Column({ name: 'consultorio_id', type: 'uuid' })
  consultorioId: string;

  @Column({ name: 'token_hash', type: 'varchar', length: 64, nullable: true })
  tokenHash: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 50, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', length: 100, default: 'Navegador Web' })
  dispositivo: string;

  @Column({ type: 'boolean', default: true })
  activa: boolean;

  @Column({ name: 'ultimo_acceso', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  ultimoAcceso: Date;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn: Date;
}
