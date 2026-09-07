import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('backups_registro')
export class BackupRegistro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'consultorio_id', type: 'uuid' })
  consultorioId: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({ name: 'nombre_archivo', type: 'varchar', length: 255 })
  nombreArchivo: string;

  @Column({ name: 'ruta_archivo', type: 'varchar', length: 500 })
  rutaArchivo: string;

  @Column({ name: 'tamano_bytes', type: 'int', default: 0 })
  tamanoBytes: number;

  @Column({ name: 'checksum_sha256', type: 'varchar', length: 64 })
  checksumSha256: string;

  @Column({ type: 'jsonb', nullable: true })
  conteos: Record<string, number> | null;

  @Column({ type: 'varchar', length: 30, default: 'GENERADO' })
  estado: string;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;
}
