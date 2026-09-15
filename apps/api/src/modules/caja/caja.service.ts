import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SesionCaja, EstadoSesionCaja } from './entities/sesion-caja.entity.js';
import { Pago, EstadoPago, MetodoPago } from './entities/pago.entity.js';
import { Paciente } from '../pacientes/entities/paciente.entity.js';
import { Cita } from '../citas/entities/cita.entity.js';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { AbrirCajaDto } from './dto/abrir-caja.dto.js';
import { CerrarCajaDto } from './dto/cerrar-caja.dto.js';
import { RegistrarPagoDto } from './dto/registrar-pago.dto.js';
import { AnularPagoDto } from './dto/anular-pago.dto.js';
import { FiltrosCajaDto } from './dto/filtros-caja.dto.js';

@Injectable()
export class CajaService {
  private readonly logger = new Logger(CajaService.name);

  constructor(
    @InjectRepository(SesionCaja)
    private readonly sesionRepo: Repository<SesionCaja>,

    @InjectRepository(Pago)
    private readonly pagoRepo: Repository<Pago>,

    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,

    @InjectRepository(Cita)
    private readonly citaRepo: Repository<Cita>,

    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,

    private readonly auditoriaService: AuditoriaService,
  ) {}

  /**
   * Obtiene la sesión de caja activa de la clínica para el turno actual,
   * calculando los totales de arqueo en tiempo real.
   */
  async obtenerSesionActiva(consultorioId: string, usuarioId?: string) {
    const sesion = await this.sesionRepo.findOne({
      where: {
        consultorioId,
        estado: EstadoSesionCaja.ABIERTA,
      },
      relations: {
        usuario: true,
      },
      order: { fechaApertura: 'DESC' },
    });

    if (!sesion) {
      return { sesion: null, totales: null };
    }

    // Calcular totales de la sesión activa
    const pagos = await this.pagoRepo.find({
      where: {
        consultorioId,
        sesionCajaId: sesion.id,
        estado: EstadoPago.COBRADO,
      },
    });

    let totalRecaudado = 0;
    let totalEfectivo = 0;
    let totalTarjetaDebito = 0;
    let totalTarjetaCredito = 0;
    let totalTransferencia = 0;
    let totalSeguro = 0;
    let totalCopagos = 0;

    for (const p of pagos) {
      const monto = Number(p.montoTotal) || 0;
      totalRecaudado += monto;

      switch (p.metodoPago) {
        case MetodoPago.EFECTIVO:
          totalEfectivo += monto;
          break;
        case MetodoPago.TARJETA_DEBITO:
          totalTarjetaDebito += monto;
          break;
        case MetodoPago.TARJETA_CREDITO:
          totalTarjetaCredito += monto;
          break;
        case MetodoPago.TRANSFERENCIA:
          totalTransferencia += monto;
          break;
        case MetodoPago.SEGURO_MEDICO:
          totalSeguro += Number(p.coberturaSeguro) || (monto - (Number(p.montoCopago) || 0));
          if (p.montoCopago) {
            totalCopagos += Number(p.montoCopago);
            totalEfectivo += Number(p.montoCopago); // Copago recibido en caja
          }
          break;
      }
    }

    const montoInicial = Number(sesion.montoInicial) || 0;
    const saldoEfectivoEsperado = montoInicial + totalEfectivo;

    return {
      sesion,
      totales: {
        montoInicial,
        totalRecaudado,
        totalEfectivo,
        totalTarjetaDebito,
        totalTarjetaCredito,
        totalTarjetas: totalTarjetaDebito + totalTarjetaCredito,
        totalTransferencia,
        totalSeguro,
        totalCopagos,
        saldoEfectivoEsperado,
        cantidadPagos: pagos.length,
      },
    };
  }

  /**
   * Abre un nuevo turno de caja registrando el fondo inicial en efectivo.
   */
  async abrirCaja(
    consultorioId: string,
    usuarioId: string,
    dto: AbrirCajaDto,
    usuarioSolicitante?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<SesionCaja> {
    const sesionExistente = await this.sesionRepo.findOne({
      where: {
        consultorioId,
        estado: EstadoSesionCaja.ABIERTA,
      },
    });

    if (sesionExistente) {
      throw new BadRequestException(
        'Ya existe un turno de caja abierto en este consultorio. Debes cerrar el turno actual antes de abrir uno nuevo.',
      );
    }

    const nuevaSesion = this.sesionRepo.create({
      consultorioId,
      usuarioId,
      montoInicial: dto.montoInicial,
      observacionesApertura: dto.observacionesApertura?.trim() || null,
      estado: EstadoSesionCaja.ABIERTA,
      fechaApertura: new Date(),
    });

    const guardada = await this.sesionRepo.save(nuevaSesion);
    this.logger.log(`Caja abierta: [${guardada.id}] con fondo $${guardada.montoInicial}`);

    const nombreUsuario = usuarioSolicitante
      ? `${usuarioSolicitante.nombre ?? ''} ${usuarioSolicitante.apellido ?? ''}`.trim() || usuarioSolicitante.email
      : 'Personal de Recepción';

    await this.auditoriaService.registrar({
      consultorioId,
      usuarioId,
      usuarioEmail: usuarioSolicitante?.email ?? 'recepcion',
      usuarioNombre: nombreUsuario,
      modulo: 'CAJA',
      accion: 'CAJA_APERTURA',
      entidadTipo: 'SesionCaja',
      entidadId: guardada.id,
      detalles: {
        sesionCajaId: guardada.id,
        montoInicial: guardada.montoInicial,
        observaciones: guardada.observacionesApertura,
        fechaApertura: guardada.fechaApertura,
      },
      ipAddress,
      userAgent,
    });

    return guardada;
  }

  /**
   * Registra un pago o cobro de consulta, vinculado a la sesión de caja activa.
   */
  async registrarPago(
    consultorioId: string,
    usuarioId: string,
    dto: RegistrarPagoDto,
    usuarioSolicitante?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Pago> {
    // 1. Validar que la caja esté abierta
    const sesionActiva = await this.sesionRepo.findOne({
      where: { consultorioId, estado: EstadoSesionCaja.ABIERTA },
    });

    if (!sesionActiva) {
      throw new BadRequestException(
        'No hay un turno de caja abierto. Por favor, abre la caja con el fondo inicial antes de registrar cobros.',
      );
    }

    // 2. Validar paciente
    const paciente = await this.pacienteRepo.findOne({
      where: { id: dto.pacienteId, consultorioId },
    });
    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado en este consultorio');
    }

    // 3. Validar cita si se proporcionó
    let cita: Cita | null = null;
    if (dto.citaId) {
      cita = await this.citaRepo.findOne({
        where: { id: dto.citaId, consultorioId },
      });
      if (!cita) {
        throw new NotFoundException('Cita médica no encontrada en este consultorio');
      }
    }

    // 4. Calcular vuelto/cambio en efectivo
    let cambioDevuelto: number | null = null;
    if (dto.metodoPago === MetodoPago.EFECTIVO && dto.montoRecibido !== undefined) {
      if (dto.montoRecibido >= dto.montoTotal) {
        cambioDevuelto = Number((dto.montoRecibido - dto.montoTotal).toFixed(2));
      } else {
        throw new BadRequestException('El monto recibido en efectivo no puede ser menor al total a pagar');
      }
    }

    // 5. Generar correlativo de recibo REC-YYYY-000001
    const numeroRecibo = await this.generarSiguienteNumeroRecibo(consultorioId);

    // 6. Crear registro de pago
    const nuevoPago = this.pagoRepo.create({
      consultorioId,
      sesionCajaId: sesionActiva.id,
      pacienteId: dto.pacienteId,
      citaId: dto.citaId || null,
      registradoPorId: usuarioId,
      numeroRecibo,
      concepto: dto.concepto.trim(),
      montoTotal: dto.montoTotal,
      metodoPago: dto.metodoPago,
      montoRecibido: dto.montoRecibido ?? null,
      cambioDevuelto,
      montoCopago: dto.montoCopago ?? null,
      coberturaSeguro: dto.coberturaSeguro ?? null,
      nombreAseguradora: dto.nombreAseguradora?.trim() || null,
      numeroPoliza: dto.numeroPoliza?.trim() || null,
      numeroAutorizacion: dto.numeroAutorizacion?.trim() || null,
      referenciaTransaccion: dto.referenciaTransaccion?.trim() || null,
      notas: dto.notas?.trim() || null,
      estado: EstadoPago.COBRADO,
    });

    const guardado = await this.pagoRepo.save(nuevoPago);
    this.logger.log(`Cobro registrado [${guardado.numeroRecibo}] por $${guardado.montoTotal}`);

    // 7. Registrar en auditoría
    const nombreUsuario = usuarioSolicitante
      ? `${usuarioSolicitante.nombre ?? ''} ${usuarioSolicitante.apellido ?? ''}`.trim() || usuarioSolicitante.email
      : 'Personal de Recepción';

    await this.auditoriaService.registrar({
      consultorioId,
      usuarioId,
      usuarioEmail: usuarioSolicitante?.email ?? 'recepcion',
      usuarioNombre: nombreUsuario,
      modulo: 'CAJA',
      accion: 'PAGO_REGISTRAR',
      entidadTipo: 'Pago',
      entidadId: guardado.id,
      detalles: {
        pagoId: guardado.id,
        numeroRecibo: guardado.numeroRecibo,
        pacienteNombre: `${paciente.nombre} ${paciente.apellido}`.trim(),
        concepto: guardado.concepto,
        montoTotal: guardado.montoTotal,
        metodoPago: guardado.metodoPago,
        citaId: guardado.citaId,
      },
      ipAddress,
      userAgent,
    });

    return this.obtenerPagoPorId(consultorioId, guardado.id);
  }

  /**
   * Cierra el turno de caja y registra el arqueo final y discrepancias.
   */
  async cerrarCaja(
    consultorioId: string,
    usuarioId: string,
    dto: CerrarCajaDto,
    usuarioSolicitante?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<SesionCaja> {
    const sesion = await this.sesionRepo.findOne({
      where: { consultorioId, estado: EstadoSesionCaja.ABIERTA },
    });

    if (!sesion) {
      throw new BadRequestException('No existe una sesión de caja abierta para cerrar.');
    }

    // Sumar todos los pagos cobrados en efectivo
    const pagosEfectivo = await this.pagoRepo.find({
      where: {
        consultorioId,
        sesionCajaId: sesion.id,
        estado: EstadoPago.COBRADO,
      },
    });

    let ingresosEfectivo = 0;
    for (const p of pagosEfectivo) {
      if (p.metodoPago === MetodoPago.EFECTIVO) {
        ingresosEfectivo += Number(p.montoTotal) || 0;
      } else if (p.metodoPago === MetodoPago.SEGURO_MEDICO && p.montoCopago) {
        ingresosEfectivo += Number(p.montoCopago) || 0;
      }
    }

    const montoEsperado = Number(sesion.montoInicial) + ingresosEfectivo;
    const montoReal = Number(dto.montoRealEfectivo);
    const diferencia = Number((montoReal - montoEsperado).toFixed(2));

    sesion.estado = EstadoSesionCaja.CERRADA;
    sesion.fechaCierre = new Date();
    sesion.montoEsperadoEfectivo = montoEsperado;
    sesion.montoRealEfectivo = montoReal;
    sesion.diferencia = diferencia;
    sesion.observacionesCierre = dto.observacionesCierre?.trim() || null;

    const guardada = await this.sesionRepo.save(sesion);
    this.logger.log(`Caja cerrada [${guardada.id}]. Esperado: $${montoEsperado}, Real: $${montoReal}, Dif: $${diferencia}`);

    const nombreUsuario = usuarioSolicitante
      ? `${usuarioSolicitante.nombre ?? ''} ${usuarioSolicitante.apellido ?? ''}`.trim() || usuarioSolicitante.email
      : 'Personal de Recepción';

    await this.auditoriaService.registrar({
      consultorioId,
      usuarioId,
      usuarioEmail: usuarioSolicitante?.email ?? 'recepcion',
      usuarioNombre: nombreUsuario,
      modulo: 'CAJA',
      accion: 'CAJA_CIERRE',
      entidadTipo: 'SesionCaja',
      entidadId: guardada.id,
      detalles: {
        sesionCajaId: guardada.id,
        montoInicial: guardada.montoInicial,
        montoEsperadoEfectivo: guardada.montoEsperadoEfectivo,
        montoRealEfectivo: guardada.montoRealEfectivo,
        diferencia: guardada.diferencia,
        observaciones: guardada.observacionesCierre,
      },
      ipAddress,
      userAgent,
    });

    return guardada;
  }

  /**
   * Anula un cobro registrado con justificación obligatoria.
   */
  async anularPago(
    consultorioId: string,
    pagoId: string,
    usuarioId: string,
    dto: AnularPagoDto,
    usuarioSolicitante?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Pago> {
    const pago = await this.obtenerPagoPorId(consultorioId, pagoId);

    if (pago.estado === EstadoPago.ANULADO) {
      throw new BadRequestException('El pago ya se encuentra anulado');
    }

    pago.estado = EstadoPago.ANULADO;
    pago.motivoAnulacion = dto.motivoAnulacion.trim();

    const guardado = await this.pagoRepo.save(pago);
    this.logger.log(`Pago [${pago.numeroRecibo}] anulado. Motivo: ${dto.motivoAnulacion}`);

    const nombreUsuario = usuarioSolicitante
      ? `${usuarioSolicitante.nombre ?? ''} ${usuarioSolicitante.apellido ?? ''}`.trim() || usuarioSolicitante.email
      : 'Personal de Recepción';

    await this.auditoriaService.registrar({
      consultorioId,
      usuarioId,
      usuarioEmail: usuarioSolicitante?.email ?? 'recepcion',
      usuarioNombre: nombreUsuario,
      modulo: 'CAJA',
      accion: 'PAGO_ANULAR',
      entidadTipo: 'Pago',
      entidadId: guardado.id,
      detalles: {
        pagoId: guardado.id,
        numeroRecibo: guardado.numeroRecibo,
        montoTotal: guardado.montoTotal,
        motivoAnulacion: guardado.motivoAnulacion,
      },
      ipAddress,
      userAgent,
    });

    return guardado;
  }

  /**
   * Lista pagos con filtros, orden y paginación.
   */
  async listarPagos(consultorioId: string, filtros: FiltrosCajaDto) {
    const {
      sesionCajaId,
      pacienteId,
      metodoPago,
      estado,
      desde,
      hasta,
      pagina = 1,
      limite = 20,
    } = filtros;

    const qb = this.pagoRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.paciente', 'paciente')
      .leftJoinAndSelect('p.registradoPor', 'registradoPor')
      .leftJoinAndSelect('p.cita', 'cita')
      .where('p.consultorioId = :consultorioId', { consultorioId });

    if (sesionCajaId) {
      qb.andWhere('p.sesionCajaId = :sesionCajaId', { sesionCajaId });
    }

    if (pacienteId) {
      qb.andWhere('p.pacienteId = :pacienteId', { pacienteId });
    }

    if (metodoPago) {
      qb.andWhere('p.metodoPago = :metodoPago', { metodoPago });
    }

    if (estado) {
      qb.andWhere('p.estado = :estado', { estado });
    }

    if (desde) {
      qb.andWhere('p.creadoEn >= :desde', { desde: new Date(`${desde}T00:00:00.000Z`) });
    }

    if (hasta) {
      qb.andWhere('p.creadoEn <= :hasta', { hasta: new Date(`${hasta}T23:59:59.999Z`) });
    }

    qb.orderBy('p.creadoEn', 'DESC')
      .skip((pagina - 1) * limite)
      .take(limite);

    const [datos, total] = await qb.getManyAndCount();

    return {
      datos,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    };
  }

  /**
   * Obtiene un pago por su ID con todas sus relaciones y datos de consultorio para imprimir recibo.
   */
  async obtenerPagoPorId(consultorioId: string, id: string): Promise<Pago> {
    const pago = await this.pagoRepo.findOne({
      where: { id, consultorioId },
      relations: {
        paciente: true,
        registradoPor: true,
        cita: { profesional: true },
        consultorio: true,
        sesionCaja: true,
      },
    });

    if (!pago) {
      throw new NotFoundException('Pago o comprobante no encontrado');
    }

    return pago;
  }

  /**
   * Lista sesiones históricas de caja con su cajero responsable.
   */
  async listarSesiones(consultorioId: string, pagina: number = 1, limite: number = 10) {
    const qb = this.sesionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.usuario', 'usuario')
      .where('s.consultorioId = :consultorioId', { consultorioId })
      .orderBy('s.fechaApertura', 'DESC')
      .skip((pagina - 1) * limite)
      .take(limite);

    const [datos, total] = await qb.getManyAndCount();

    return {
      datos,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    };
  }

  /**
   * Genera el correlativo de recibo por consultorio: REC-YYYY-000001
   */
  private async generarSiguienteNumeroRecibo(consultorioId: string): Promise<string> {
    const añoActual = new Date().getFullYear();
    const patron = `REC-${añoActual}-%`;

    const ultimoPago = await this.pagoRepo
      .createQueryBuilder('p')
      .where('p.consultorioId = :consultorioId', { consultorioId })
      .andWhere('p.numeroRecibo LIKE :patron', { patron })
      .orderBy('p.numeroRecibo', 'DESC')
      .getOne();

    let siguiente = 1;
    if (ultimoPago) {
      const partes = ultimoPago.numeroRecibo.split('-');
      if (partes.length === 3) {
        const num = parseInt(partes[2], 10);
        if (!isNaN(num)) siguiente = num + 1;
      }
    }

    const correlativo = String(siguiente).padStart(6, '0');
    return `REC-${añoActual}-${correlativo}`;
  }
}
