import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';
import { Paciente } from '../../pacientes/entities/paciente.entity.js';
import { Cita } from '../../citas/entities/cita.entity.js';

export enum EstadoSesionCaja {
  ABIERTA = 'ABIERTA',
  CERRADA = 'CERRADA',
}

export enum MetodoPago {
  EFECTIVO = 'EFECTIVO',
  TARJETA_DEBITO = 'TARJETA_DEBITO',
  TARJETA_CREDITO = 'TARJETA_CREDITO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  SEGURO_MEDICO = 'SEGURO_MEDICO',
}

export enum EstadoPago {
  COBRADO = 'COBRADO',
  ANULADO = 'ANULADO',
}

@Entity('sesiones_caja')
@Index('idx_sesiones_caja_consultorio_estado', ['consultorioId', 'estado'])
@Index('idx_sesiones_caja_usuario', ['consultorioId', 'usuarioId', 'estado'])
export class SesionCaja extends TenantBaseEntity {
  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({
    type: 'varchar',
    length: 20,
    default: EstadoSesionCaja.ABIERTA,
  })
  estado: EstadoSesionCaja;

  @Column({ name: 'monto_inicial', type: 'numeric', precision: 12, scale: 2, default: 0 })
  montoInicial: number;

  @Column({ name: 'fecha_apertura', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  fechaApertura: Date;

  @Column({ name: 'fecha_cierre', type: 'timestamp with time zone', nullable: true })
  fechaCierre: Date | null;

  @Column({ name: 'monto_esperado_efectivo', type: 'numeric', precision: 12, scale: 2, nullable: true })
  montoEsperadoEfectivo: number | null;

  @Column({ name: 'monto_real_efectivo', type: 'numeric', precision: 12, scale: 2, nullable: true })
  montoRealEfectivo: number | null;

  @Column({ name: 'diferencia', type: 'numeric', precision: 12, scale: 2, nullable: true })
  diferencia: number | null;

  @Column({ name: 'observaciones_apertura', type: 'text', nullable: true })
  observacionesApertura: string | null;

  @Column({ name: 'observaciones_cierre', type: 'text', nullable: true })
  observacionesCierre: string | null;

  @OneToMany(() => Pago, (pago) => pago.sesionCaja)
  pagos: Pago[];
}

@Entity('pagos')
@Index('idx_pagos_consultorio_sesion', ['consultorioId', 'sesionCajaId'])
@Index('idx_pagos_consultorio_paciente', ['consultorioId', 'pacienteId'])
@Index('idx_pagos_consultorio_cita', ['consultorioId', 'citaId'])
@Index('idx_pagos_consultorio_fecha', ['consultorioId', 'creadoEn'])
export class Pago extends TenantBaseEntity {
  @Column({ name: 'sesion_caja_id', type: 'uuid' })
  sesionCajaId: string;

  @ManyToOne(() => SesionCaja, (sesion) => sesion.pagos, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sesion_caja_id' })
  sesionCaja: SesionCaja;

  @Column({ name: 'paciente_id', type: 'uuid' })
  pacienteId: string;

  @ManyToOne(() => Paciente, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  @Column({ name: 'cita_id', type: 'uuid', nullable: true })
  citaId: string | null;

  @ManyToOne(() => Cita, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cita_id' })
  cita: Cita | null;

  @Column({ name: 'registrado_por_id', type: 'uuid' })
  registradoPorId: string;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'registrado_por_id' })
  registradoPor: Usuario;

  @Column({ name: 'numero_recibo', type: 'varchar', length: 50 })
  numeroRecibo: string;

  @Column({ type: 'varchar', length: 255 })
  concepto: string;

  @Column({ name: 'monto_total', type: 'numeric', precision: 12, scale: 2 })
  montoTotal: number;

  @Column({
    name: 'metodo_pago',
    type: 'varchar',
    length: 30,
    default: MetodoPago.EFECTIVO,
  })
  metodoPago: MetodoPago;

  @Column({ name: 'monto_recibido', type: 'numeric', precision: 12, scale: 2, nullable: true })
  montoRecibido: number | null;

  @Column({ name: 'cambio_devuelto', type: 'numeric', precision: 12, scale: 2, nullable: true })
  cambioDevuelto: number | null;

  @Column({ name: 'monto_copago', type: 'numeric', precision: 12, scale: 2, nullable: true })
  montoCopago: number | null;

  @Column({ name: 'cobertura_seguro', type: 'numeric', precision: 12, scale: 2, nullable: true })
  coberturaSeguro: number | null;

  @Column({ name: 'nombre_aseguradora', type: 'varchar', length: 150, nullable: true })
  nombreAseguradora: string | null;

  @Column({ name: 'numero_poliza', type: 'varchar', length: 100, nullable: true })
  numeroPoliza: string | null;

  @Column({ name: 'numero_autorizacion', type: 'varchar', length: 100, nullable: true })
  numeroAutorizacion: string | null;

  @Column({ name: 'referencia_transaccion', type: 'varchar', length: 100, nullable: true })
  referenciaTransaccion: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: EstadoPago.COBRADO,
  })
  estado: EstadoPago;

  @Column({ name: 'motivo_anulacion', type: 'text', nullable: true })
  motivoAnulacion: string | null;

  @Column({ type: 'text', nullable: true })
  notas: string | null;
}
