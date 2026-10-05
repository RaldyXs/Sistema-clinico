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
import { Plan } from './plan.entity.js';
import { Consultorio } from '../../consultorios/entities/consultorio.entity.js';

export enum EstadoSolicitudPlan {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
}

@Entity('saas_solicitudes_plan')
export class SolicitudPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'consultorio_id', type: 'uuid' })
  consultorioId: string;

  @ManyToOne(() => Consultorio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultorio_id' })
  consultorio: Consultorio;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId: string;

  @ManyToOne(() => Plan, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({ type: 'varchar', length: 20, default: 'MENSUAL' })
  periodo: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monto: number;

  @Column({ name: 'referencia_transferencia', type: 'varchar', length: 150 })
  referenciaTransferencia: string;

  @Column({ name: 'banco_origen', type: 'varchar', length: 150, nullable: true })
  bancoOrigen: string | null;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @Column({
    type: 'varchar',
    length: 30,
    default: EstadoSolicitudPlan.PENDIENTE,
  })
  estado: EstadoSolicitudPlan;

  @Column({ name: 'motivo_rechazo', type: 'text', nullable: true })
  motivoRechazo: string | null;

  @Column({ name: 'revisado_por_id', type: 'uuid', nullable: true })
  revisadoPorId: string | null;

  @Column({ name: 'revisado_en', type: 'timestamp with time zone', nullable: true })
  revisadoEn: Date | null;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn: Date;
}
