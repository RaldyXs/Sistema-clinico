import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('saas_planes')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ name: 'precio_mensual', type: 'decimal', precision: 10, scale: 2, default: 0 })
  precioMensual: number;

  @Column({ name: 'precio_anual', type: 'decimal', precision: 10, scale: 2, default: 0 })
  precioAnual: number;

  @Column({ name: 'max_medicos', type: 'int', default: 2 })
  maxMedicos: number;

  @Column({ name: 'max_pacientes', type: 'int', default: 500 })
  maxPacientes: number;

  @Column({ name: 'max_almacenamiento_mb', type: 'int', default: 1024 })
  maxAlmacenamientoMb: number;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  caracteristicas: string[];

  @Column({ name: 'modulos_incluidos', type: 'jsonb', default: () => "'{}'" })
  modulosIncluidos: Record<string, boolean>;

  @Column({ type: 'boolean', default: false })
  destacado: boolean;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn: Date;
}
