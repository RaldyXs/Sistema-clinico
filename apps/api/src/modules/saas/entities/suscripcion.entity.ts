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

export enum EstadoSuscripcion {
  PRUEBA = 'PRUEBA',
  ACTIVA = 'ACTIVA',
  VENCIDA = 'VENCIDA',
  CANCELADA = 'CANCELADA',
}

@Entity('saas_suscripciones')
export class Suscripcion {
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

  @Column({
    type: 'varchar',
    length: 30,
    default: EstadoSuscripcion.PRUEBA,
  })
  estado: EstadoSuscripcion;

  @Column({ type: 'varchar', length: 20, default: 'MENSUAL' })
  periodo: string;

  @Column({ name: 'fecha_inicio', type: 'timestamp with time zone' })
  fechaInicio: Date;

  @Column({ name: 'fecha_fin', type: 'timestamp with time zone' })
  fechaFin: Date;

  @Column({ name: 'precio_cobrado', type: 'decimal', precision: 10, scale: 2, default: 0 })
  precioCobrado: number;

  @Column({ name: 'renovacion_automatica', type: 'boolean', default: true })
  renovacionAutomatica: boolean;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn: Date;
}
