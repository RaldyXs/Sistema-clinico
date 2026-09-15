import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { AuditoriaLog } from './entities/auditoria-log.entity.js';

export interface RegistrarAuditoriaDto {
  consultorioId: string;
  usuarioId?: string | null;
  usuarioEmail?: string;
  usuarioNombre?: string;
  modulo: string;
  accion: string;
  entidadTipo?: string;
  entidadId?: string;
  detalles?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface FiltrosAuditoriaDto {
  modulo?: string;
  accion?: string;
  usuarioId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  limite?: number;
  pagina?: number;
}

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(
    @InjectRepository(AuditoriaLog)
    private readonly logRepo: Repository<AuditoriaLog>,
  ) {}

  /**
   * Registra un evento de auditoría de manera inmutable.
   * Atrapa posibles fallos para no interrumpir el flujo transaccional principal.
   */
  async registrar(dto: RegistrarAuditoriaDto): Promise<AuditoriaLog | null> {
    try {
      const nuevoLog = this.logRepo.create({
        consultorioId: dto.consultorioId,
        usuarioId: dto.usuarioId ?? null,
        usuarioEmail: dto.usuarioEmail ?? 'sistema',
        usuarioNombre: dto.usuarioNombre ?? 'Sistema',
        modulo: dto.modulo.toUpperCase(),
        accion: dto.accion.toUpperCase(),
        entidadTipo: dto.entidadTipo ?? null,
        entidadId: dto.entidadId ? String(dto.entidadId) : null,
        detalles: dto.detalles ?? null,
        ipAddress: dto.ipAddress ?? null,
        userAgent: dto.userAgent ? dto.userAgent.slice(0, 255) : null,
      });

      return await this.logRepo.save(nuevoLog);
    } catch (err: any) {
      this.logger.error(`Error al registrar log de auditoría: ${err.message}`, err.stack);
      return null;
    }
  }

  /**
   * Consulta el registro de auditoría del consultorio con filtros avanzados y paginación.
   * Si es SuperAdmin, permite consultar la auditoría global de toda la plataforma.
   */
  async listar(consultorioId: string, filtros: FiltrosAuditoriaDto = {}, esSuperAdmin: boolean = false) {
    const limite = Math.min(filtros.limite ?? 50, 100);
    const pagina = Math.max(filtros.pagina ?? 1, 1);
    const skip = (pagina - 1) * limite;

    const qb = this.logRepo
      .createQueryBuilder('log')
      .orderBy('log.creadoEn', 'DESC')
      .take(limite)
      .skip(skip);

    if (!esSuperAdmin) {
      qb.where('log.consultorioId = :consultorioId', { consultorioId });
    }

    if (filtros.modulo) {
      qb.andWhere('log.modulo = :modulo', { modulo: filtros.modulo.toUpperCase() });
    }

    if (filtros.accion) {
      qb.andWhere('log.accion = :accion', { accion: filtros.accion.toUpperCase() });
    }

    if (filtros.usuarioId) {
      qb.andWhere('log.usuarioId = :usuarioId', { usuarioId: filtros.usuarioId });
    }

    if (filtros.fechaInicio) {
      qb.andWhere('log.creadoEn >= :fechaInicio', {
        fechaInicio: new Date(`${filtros.fechaInicio}T00:00:00.000Z`),
      });
    }

    if (filtros.fechaFin) {
      qb.andWhere('log.creadoEn <= :fechaFin', {
        fechaFin: new Date(`${filtros.fechaFin}T23:59:59.999Z`),
      });
    }

    const [logs, total] = await qb.getManyAndCount();

    return {
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
      logs,
    };
  }

  /**
   * Obtiene la trazabilidad clínica completa de un paciente en particular (cumplimiento HIPAA).
   * Muestra quién consultó o modificó su expediente clínico o recetas.
   */
  async obtenerHistorialPaciente(consultorioId: string, pacienteId: string) {
    const logs = await this.logRepo
      .createQueryBuilder('log')
      .where('log.consultorioId = :consultorioId', { consultorioId })
      .andWhere(
        '( (log.modulo = :modPac AND log.entidadId = :pacId) OR (log.detalles->>\'pacienteId\' = :pacId) )',
        { modPac: 'PACIENTES', pacId: pacienteId },
      )
      .orderBy('log.creadoEn', 'DESC')
      .take(100)
      .getMany();

    return logs;
  }

  /**
   * Retorna métricas analíticas de auditoría para el panel de seguridad de la clínica (o global para SuperAdmin).
   */
  async obtenerResumen(consultorioId: string, esSuperAdmin: boolean = false) {
    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);

    const semanaInicio = new Date();
    semanaInicio.setDate(semanaInicio.getDate() - 7);
    semanaInicio.setHours(0, 0, 0, 0);

    const whereHoy: any = { creadoEn: MoreThanOrEqual(hoyInicio) };
    const whereSemana: any = { creadoEn: MoreThanOrEqual(semanaInicio) };
    if (!esSuperAdmin) {
      whereHoy.consultorioId = consultorioId;
      whereSemana.consultorioId = consultorioId;
    }

    const totalHoy = await this.logRepo.count({ where: whereHoy });
    const totalSemana = await this.logRepo.count({ where: whereSemana });

    // Desglose por módulo
    const qbModulos = this.logRepo
      .createQueryBuilder('log')
      .select('log.modulo', 'modulo')
      .addSelect('COUNT(log.id)', 'conteo')
      .where('log.creadoEn >= :semanaInicio', { semanaInicio });

    if (!esSuperAdmin) {
      qbModulos.andWhere('log.consultorioId = :consultorioId', { consultorioId });
    }

    const rawModulos = await qbModulos.groupBy('log.modulo').getRawMany();

    const porModulo: Record<string, number> = {};
    for (const r of rawModulos) {
      porModulo[r.modulo] = parseInt(r.conteo, 10);
    }

    // Últimos 10 eventos críticos
    const ultimosEventos = await this.logRepo.find({
      where: esSuperAdmin ? {} : { consultorioId },
      order: { creadoEn: 'DESC' },
      take: 10,
    });

    return {
      totalHoy,
      totalSemana,
      porModulo,
      ultimosEventos,
    };
  }
}
