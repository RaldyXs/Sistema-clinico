import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { Paciente } from '../pacientes/entities/paciente.entity.js';
import { Cita, EstadoCita } from '../citas/entities/cita.entity.js';
import { Consulta, EstadoConsulta } from '../consultas/entities/consulta.entity.js';
import { Receta, EstadoReceta } from '../recetas/entities/receta.entity.js';
import { Embarazo, EstadoEmbarazo } from '../ginecologia/entities/embarazo.entity.js';

export interface DashboardResumenDto {
  pacientes: {
    totalActivos: number;
    nuevosMes: number;
  };
  citasHoy: {
    total: number;
    porEstado: Record<EstadoCita, number>;
  };
  consultasMes: {
    total: number;
    completadas: number;
  };
  recetasMes: {
    totalEmitidas: number;
  };
  embarazosActivos: number;
  proximasCitas: Array<{
    id: string;
    fechaHoraInicio: Date;
    fechaHoraFin: Date;
    motivo: string;
    estado: EstadoCita;
    paciente: {
      id: string;
      nombre: string;
      apellido: string | null;
      telefono: string | null;
    };
    profesional: {
      id: string;
      nombre: string;
      apellido: string | null;
      especialidad: string | null;
    } | null;
  }>;
}

export interface ActividadItemDto {
  id: string;
  tipo: 'CITA' | 'CONSULTA' | 'RECETA';
  fecha: Date;
  descripcion: string;
  paciente: {
    id: string;
    nombre: string;
    apellido: string | null;
  };
  profesional?: string;
}

export interface TopDiagnosticoDto {
  codigoCie10: string | null;
  diagnostico: string;
  total: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,
    @InjectRepository(Cita)
    private readonly citaRepo: Repository<Cita>,
    @InjectRepository(Consulta)
    private readonly consultaRepo: Repository<Consulta>,
    @InjectRepository(Receta)
    private readonly recetaRepo: Repository<Receta>,
    @InjectRepository(Embarazo)
    private readonly embarazoRepo: Repository<Embarazo>,
  ) {}

  /**
   * Obtiene las métricas clave (KPIs) del día y del mes en curso para el tenant autenticado.
   */
  async obtenerResumen(consultorioId: string): Promise<DashboardResumenDto> {
    const ahora = new Date();
    
    // Rango del día de hoy (desde 00:00:00 hasta 23:59:59.999 en hora local)
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
    const finHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);

    // Rango del mes actual
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);

    // 1. Pacientes activos y nuevos del mes
    const [totalActivos, nuevosMes] = await Promise.all([
      this.pacienteRepo.count({
        where: { consultorioId, activo: true },
      }),
      this.pacienteRepo.count({
        where: {
          consultorioId,
          activo: true,
          creadoEn: MoreThanOrEqual(inicioMes),
        },
      }),
    ]);

    // 2. Citas del día de hoy
    const citasHoyList = await this.citaRepo.find({
      where: {
        consultorioId,
        fechaHoraInicio: Between(inicioHoy, finHoy),
      },
      relations: {
        paciente: true,
        profesional: true,
      },
      order: {
        fechaHoraInicio: 'ASC',
      },
    });

    const citasPorEstado: Record<EstadoCita, number> = {
      [EstadoCita.PROGRAMADA]: 0,
      [EstadoCita.CONFIRMADA]: 0,
      [EstadoCita.EN_ESPERA]: 0,
      [EstadoCita.EN_CONSULTA]: 0,
      [EstadoCita.ATENDIDA]: 0,
      [EstadoCita.CANCELADA]: 0,
      [EstadoCita.NO_ASISTIO]: 0,
    };

    for (const c of citasHoyList) {
      if (citasPorEstado[c.estado] !== undefined) {
        citasPorEstado[c.estado]++;
      }
    }

    // Próximas 5 citas de hoy pendientes o activas
    const proximasCitas = citasHoyList
      .filter((c) =>
        [
          EstadoCita.PROGRAMADA,
          EstadoCita.CONFIRMADA,
          EstadoCita.EN_ESPERA,
          EstadoCita.EN_CONSULTA,
        ].includes(c.estado),
      )
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        fechaHoraInicio: c.fechaHoraInicio,
        fechaHoraFin: c.fechaHoraFin,
        motivo: c.motivo,
        estado: c.estado,
        paciente: {
          id: c.paciente?.id ?? c.pacienteId,
          nombre: c.paciente?.nombre ?? 'Desconocido',
          apellido: c.paciente?.apellido ?? null,
          telefono: c.paciente?.telefono ?? null,
        },
        profesional: c.profesional
          ? {
              id: c.profesional.id,
              nombre: c.profesional.nombre,
              apellido: c.profesional.apellido ?? null,
              especialidad: c.profesional.especialidad ?? null,
            }
          : null,
      }));

    // 3. Consultas del mes
    const [consultasMesTotal, consultasMesCompletadas] = await Promise.all([
      this.consultaRepo.count({
        where: {
          consultorioId,
          fechaAtencion: MoreThanOrEqual(inicioMes),
        },
      }),
      this.consultaRepo.count({
        where: {
          consultorioId,
          fechaAtencion: MoreThanOrEqual(inicioMes),
          estado: EstadoConsulta.COMPLETADA,
        },
      }),
    ]);

    // 4. Recetas emitidas en el mes
    const recetasMesTotal = await this.recetaRepo.count({
      where: {
        consultorioId,
        fechaEmision: MoreThanOrEqual(inicioMes),
        estado: EstadoReceta.EMITIDA,
      },
    });

    // 5. Embarazos activos
    const embarazosActivos = await this.embarazoRepo.count({
      where: {
        consultorioId,
        estado: EstadoEmbarazo.ACTIVO,
      },
    });

    return {
      pacientes: {
        totalActivos,
        nuevosMes,
      },
      citasHoy: {
        total: citasHoyList.length,
        porEstado: citasPorEstado,
      },
      consultasMes: {
        total: consultasMesTotal,
        completadas: consultasMesCompletadas,
      },
      recetasMes: {
        totalEmitidas: recetasMesTotal,
      },
      embarazosActivos,
      proximasCitas,
    };
  }

  /**
   * Obtiene un muro cronológico unificado con los eventos más recientes del consultorio.
   */
  async obtenerActividadReciente(consultorioId: string): Promise<ActividadItemDto[]> {
    const [citas, consultas, recetas] = await Promise.all([
      this.citaRepo.find({
        where: { consultorioId },
        relations: { paciente: true, profesional: true },
        order: { creadoEn: 'DESC' },
        take: 10,
      }),
      this.consultaRepo.find({
        where: { consultorioId },
        relations: { paciente: true, profesional: true },
        order: { creadoEn: 'DESC' },
        take: 10,
      }),
      this.recetaRepo.find({
        where: { consultorioId },
        relations: { paciente: true, profesional: true },
        order: { creadoEn: 'DESC' },
        take: 10,
      }),
    ]);

    const items: ActividadItemDto[] = [];

    for (const c of citas) {
      items.push({
        id: c.id,
        tipo: 'CITA',
        fecha: c.creadoEn,
        descripcion: `Cita programada (${c.estado}): ${c.motivo}`,
        paciente: {
          id: c.paciente?.id ?? c.pacienteId,
          nombre: c.paciente?.nombre ?? 'Desconocido',
          apellido: c.paciente?.apellido ?? null,
        },
        profesional: c.profesional ? `${c.profesional.nombre} ${c.profesional.apellido ?? ''}`.trim() : undefined,
      });
    }

    for (const con of consultas) {
      items.push({
        id: con.id,
        tipo: 'CONSULTA',
        fecha: con.creadoEn,
        descripcion: `Consulta clínica (${con.estado}): ${con.motivoConsulta}`,
        paciente: {
          id: con.paciente?.id ?? con.pacienteId,
          nombre: con.paciente?.nombre ?? 'Desconocido',
          apellido: con.paciente?.apellido ?? null,
        },
        profesional: con.profesional ? `${con.profesional.nombre} ${con.profesional.apellido ?? ''}`.trim() : undefined,
      });
    }

    for (const r of recetas) {
      items.push({
        id: r.id,
        tipo: 'RECETA',
        fecha: r.creadoEn,
        descripcion: `Receta emitida #${r.numeroReceta} (${r.medicamentos?.length || 0} medicamentos)`,
        paciente: {
          id: r.paciente?.id ?? r.pacienteId,
          nombre: r.paciente?.nombre ?? 'Desconocido',
          apellido: r.paciente?.apellido ?? null,
        },
        profesional: r.profesional ? `${r.profesional.nombre} ${r.profesional.apellido ?? ''}`.trim() : undefined,
      });
    }

    // Ordenamos cronológicamente descendente y devolvemos los 15 más recientes
    items.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
    return items.slice(0, 15);
  }

  /**
   * Obtiene el top 5 de diagnósticos CIE-10 más frecuentes del mes actual.
   */
  async obtenerTopDiagnosticos(consultorioId: string): Promise<TopDiagnosticoDto[]> {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);

    const resultados = await this.consultaRepo
      .createQueryBuilder('c')
      .select('c.codigo_cie10', 'codigoCie10')
      .addSelect('c.diagnostico_principal', 'diagnostico')
      .addSelect('COUNT(*)', 'total')
      .where('c.consultorio_id = :consultorioId', { consultorioId })
      .andWhere('c.fecha_atencion >= :inicioMes', { inicioMes })
      .andWhere('c.diagnostico_principal IS NOT NULL')
      .groupBy('c.codigo_cie10')
      .addGroupBy('c.diagnostico_principal')
      .orderBy('COUNT(*)', 'DESC')
      .limit(5)
      .getRawMany();

    return resultados.map((r) => ({
      codigoCie10: r.codigoCie10 ?? null,
      diagnostico: r.diagnostico,
      total: parseInt(r.total, 10) || 0,
    }));
  }
}
