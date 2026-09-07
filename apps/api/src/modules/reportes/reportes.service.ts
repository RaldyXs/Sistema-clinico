import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cita, EstadoCita } from '../citas/entities/cita.entity.js';
import { Consulta, EstadoConsulta } from '../consultas/entities/consulta.entity.js';
import { Paciente } from '../pacientes/entities/paciente.entity.js';
import { Usuario, RolUsuario } from '../usuarios/entities/usuario.entity.js';
import { Receta } from '../recetas/entities/receta.entity.js';
import { ControlPrenatal } from '../ginecologia/entities/control-prenatal.entity.js';
import { Ecografia } from '../ginecologia/entities/ecografia.entity.js';
import { FiltrosReporteDto } from './dto/filtros-reporte.dto.js';

export interface ReporteOperativoDto {
  periodo: {
    desde: Date;
    hasta: Date;
  };
  citas: {
    total: number;
    atendidas: number;
    canceladas: number;
    noAsistio: number;
    pendientes: number;
    tasaEfectividadPct: number;
    tasaAusentismoPct: number;
  };
  distribucionSemanal: Record<string, number>;
  franjasHorarias: {
    manana: number;   // 08:00 - 11:59
    mediodia: number; // 12:00 - 15:59
    tarde: number;    // 16:00 - 19:59
    noche: number;    // 20:00 en adelante
  };
  crecimientoPacientesUltimos6Meses: Array<{
    mes: string;
    nuevos: number;
  }>;
}

export interface ReporteMedicoDto {
  medicoId: string;
  nombreCompleto: string;
  especialidad: string | null;
  matricula: string | null;
  totalCitas: number;
  citasAtendidas: number;
  citasCanceladas: number;
  tasaCumplimientoPct: number;
  consultasCompletadas: number;
  recetasEmitidas: number;
}

export interface ReporteEpidemiologicoDto {
  totalConsultas: number;
  topDiagnosticos: Array<{
    codigoCie10: string | null;
    diagnostico: string;
    total: number;
    porcentaje: number;
  }>;
  consultasPorEspecialidad: Array<{
    especialidad: string;
    total: number;
    porcentaje: number;
  }>;
  metricasObstetricas?: {
    controlesPrenatales: number;
    ecografiasRealizadas: number;
  };
}

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Cita)
    private readonly citaRepo: Repository<Cita>,
    @InjectRepository(Consulta)
    private readonly consultaRepo: Repository<Consulta>,
    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Receta)
    private readonly recetaRepo: Repository<Receta>,
    @InjectRepository(ControlPrenatal)
    private readonly controlRepo: Repository<ControlPrenatal>,
    @InjectRepository(Ecografia)
    private readonly ecografiaRepo: Repository<Ecografia>,
  ) {}

  private resolverRangoFechas(filtros?: FiltrosReporteDto): { inicio: Date; fin: Date } {
    const ahora = new Date();
    const fin = filtros?.fechaFin
      ? new Date(`${filtros.fechaFin}T23:59:59.999Z`)
      : new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);

    const inicio = filtros?.fechaInicio
      ? new Date(`${filtros.fechaInicio}T00:00:00.000Z`)
      : new Date(fin.getTime() - 30 * 86400000); // 30 días atrás por defecto

    return { inicio, fin };
  }

  /**
   * Tarea 34: Reporte operativo de turnos, ausentismo, horas pico y crecimiento
   */
  async obtenerReporteOperativo(
    consultorioId: string,
    filtros?: FiltrosReporteDto,
  ): Promise<ReporteOperativoDto> {
    const { inicio, fin } = this.resolverRangoFechas(filtros);

    // 1. Obtener todas las citas del período para este tenant
    const qbCitas = this.citaRepo
      .createQueryBuilder('c')
      .where('c.consultorio_id = :consultorioId', { consultorioId })
      .andWhere('c.fecha_hora_inicio BETWEEN :inicio AND :fin', { inicio, fin });

    if (filtros?.profesionalId) {
      qbCitas.andWhere('c.profesional_id = :profesionalId', { profesionalId: filtros.profesionalId });
    }

    const citas = await qbCitas.getMany();

    const total = citas.length;
    let atendidas = 0;
    let canceladas = 0;
    let noAsistio = 0;
    let pendientes = 0;

    const distribucionSemanal: Record<string, number> = {
      Lunes: 0,
      Martes: 0,
      Miércoles: 0,
      Jueves: 0,
      Viernes: 0,
      Sábado: 0,
      Domingo: 0,
    };

    const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    const franjas = {
      manana: 0,
      mediodia: 0,
      tarde: 0,
      noche: 0,
    };

    for (const c of citas) {
      switch (c.estado) {
        case EstadoCita.ATENDIDA:
          atendidas++;
          break;
        case EstadoCita.CANCELADA:
          canceladas++;
          break;
        case EstadoCita.NO_ASISTIO:
          noAsistio++;
          break;
        default:
          pendientes++;
          break;
      }

      // Distribución por día
      const diaSemana = diasNombres[c.fechaHoraInicio.getDay()];
      if (distribucionSemanal[diaSemana] !== undefined) {
        distribucionSemanal[diaSemana]++;
      }

      // Franja horaria
      const hora = c.fechaHoraInicio.getHours();
      if (hora >= 8 && hora < 12) franjas.manana++;
      else if (hora >= 12 && hora < 16) franjas.mediodia++;
      else if (hora >= 16 && hora < 20) franjas.tarde++;
      else franjas.noche++;
    }

    const tasaEfectividadPct = total > 0 ? parseFloat(((atendidas / total) * 100).toFixed(1)) : 0;
    const tasaAusentismoPct = total > 0 ? parseFloat((((noAsistio + canceladas) / total) * 100).toFixed(1)) : 0;

    // 2. Crecimiento de pacientes en los últimos 6 meses
    const mesesAtras = 6;
    const crecimiento: Array<{ mes: string; nuevos: number }> = [];
    const ahora = new Date();

    for (let i = mesesAtras - 1; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const inicioM = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
      const finM = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const count = await this.pacienteRepo.count({
        where: {
          consultorioId,
          activo: true,
          creadoEn: Between(inicioM, finM),
        },
      });

      const nombreMes = d.toLocaleString('es-ES', { month: 'short' });
      crecimiento.push({
        mes: `${nombreMes} ${d.getFullYear()}`,
        nuevos: count,
      });
    }

    return {
      periodo: { desde: inicio, hasta: fin },
      citas: {
        total,
        atendidas,
        canceladas,
        noAsistio,
        pendientes,
        tasaEfectividadPct,
        tasaAusentismoPct,
      },
      distribucionSemanal,
      franjasHorarias: franjas,
      crecimientoPacientesUltimos6Meses: crecimiento,
    };
  }

  /**
   * Tarea 35: Reporte de productividad individual por médico y especialidad
   */
  async obtenerReporteMedicos(
    consultorioId: string,
    filtros?: FiltrosReporteDto,
  ): Promise<ReporteMedicoDto[]> {
    const { inicio, fin } = this.resolverRangoFechas(filtros);

    const medicos = await this.usuarioRepo.find({
      where: {
        consultorioId,
        rolCodigo: RolUsuario.MEDICO,
      },
      order: { nombre: 'ASC' },
    });

    const reportes: ReporteMedicoDto[] = [];

    for (const m of medicos) {
      // Citas de este médico en el período
      const citasMedico = await this.citaRepo.find({
        where: {
          consultorioId,
          profesionalId: m.id,
          fechaHoraInicio: Between(inicio, fin),
        },
      });

      const totalCitas = citasMedico.length;
      const citasAtendidas = citasMedico.filter((c) => c.estado === EstadoCita.ATENDIDA).length;
      const citasCanceladas = citasMedico.filter(
        (c) => c.estado === EstadoCita.CANCELADA || c.estado === EstadoCita.NO_ASISTIO,
      ).length;

      const tasaCumplimientoPct =
        totalCitas > 0 ? parseFloat(((citasAtendidas / totalCitas) * 100).toFixed(1)) : 0;

      // Consultas cerradas por este médico
      const consultasCompletadas = await this.consultaRepo.count({
        where: {
          consultorioId,
          profesionalId: m.id,
          fechaAtencion: Between(inicio, fin),
          estado: EstadoConsulta.COMPLETADA,
        },
      });

      // Recetas emitidas por este médico
      const recetasEmitidas = await this.recetaRepo.count({
        where: {
          consultorioId,
          profesionalId: m.id,
          fechaEmision: Between(inicio, fin),
        },
      });

      reportes.push({
        medicoId: m.id,
        nombreCompleto: `${m.nombre} ${m.apellido || ''}`.trim(),
        especialidad: m.especialidad || 'Medicina General',
        matricula: m.matriculaProfesional || null,
        totalCitas,
        citasAtendidas,
        citasCanceladas,
        tasaCumplimientoPct,
        consultasCompletadas,
        recetasEmitidas,
      });
    }

    return reportes;
  }

  /**
   * Tarea 35: Reporte epidemiológico de diagnósticos CIE-10 y atenciones
   */
  async obtenerReporteEpidemiologico(
    consultorioId: string,
    filtros?: FiltrosReporteDto,
  ): Promise<ReporteEpidemiologicoDto> {
    const { inicio, fin } = this.resolverRangoFechas(filtros);

    // 1. Total consultas en el período
    const totalConsultas = await this.consultaRepo.count({
      where: {
        consultorioId,
        fechaAtencion: Between(inicio, fin),
      },
    });

    // 2. Ranking de diagnósticos CIE-10
    const rawDiagnosticos = await this.consultaRepo
      .createQueryBuilder('c')
      .select('c.codigo_cie10', 'codigoCie10')
      .addSelect('c.diagnostico_principal', 'diagnostico')
      .addSelect('COUNT(*)', 'total')
      .where('c.consultorio_id = :consultorioId', { consultorioId })
      .andWhere('c.fecha_atencion BETWEEN :inicio AND :fin', { inicio, fin })
      .andWhere('c.diagnostico_principal IS NOT NULL')
      .groupBy('c.codigo_cie10')
      .addGroupBy('c.diagnostico_principal')
      .orderBy('COUNT(*)', 'DESC')
      .limit(10)
      .getRawMany();

    const topDiagnosticos = rawDiagnosticos.map((r) => {
      const tot = parseInt(r.total, 10) || 0;
      const pct = totalConsultas > 0 ? parseFloat(((tot / totalConsultas) * 100).toFixed(1)) : 0;
      return {
        codigoCie10: r.codigoCie10 || null,
        diagnostico: r.diagnostico,
        total: tot,
        porcentaje: pct,
      };
    });

    // 3. Distribución por especialidad médica
    const rawEspecialidades = await this.consultaRepo
      .createQueryBuilder('c')
      .leftJoin('c.profesional', 'p')
      .select('COALESCE(p.especialidad, \'Medicina General\')', 'especialidad')
      .addSelect('COUNT(*)', 'total')
      .where('c.consultorio_id = :consultorioId', { consultorioId })
      .andWhere('c.fecha_atencion BETWEEN :inicio AND :fin', { inicio, fin })
      .groupBy('p.especialidad')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany();

    const consultasPorEspecialidad = rawEspecialidades.map((r) => {
      const tot = parseInt(r.total, 10) || 0;
      const pct = totalConsultas > 0 ? parseFloat(((tot / totalConsultas) * 100).toFixed(1)) : 0;
      return {
        especialidad: r.especialidad,
        total: tot,
        porcentaje: pct,
      };
    });

    // 4. Métricas obstétricas
    const [controlesPrenatales, ecografiasRealizadas] = await Promise.all([
      this.controlRepo.count({
        where: {
          consultorioId,
          fechaControl: Between(inicio, fin),
        },
      }),
      this.ecografiaRepo.count({
        where: {
          consultorioId,
          fechaEstudio: Between(inicio, fin),
        },
      }),
    ]);

    return {
      totalConsultas,
      topDiagnosticos,
      consultasPorEspecialidad,
      metricasObstetricas: {
        controlesPrenatales,
        ecografiasRealizadas,
      },
    };
  }

  /**
   * Exportación de citas a formato CSV estructurado
   */
  async exportarCitasCsv(consultorioId: string, filtros?: FiltrosReporteDto): Promise<string> {
    const { inicio, fin } = this.resolverRangoFechas(filtros);

    const citas = await this.citaRepo.find({
      where: {
        consultorioId,
        fechaHoraInicio: Between(inicio, fin),
      },
      relations: {
        paciente: true,
        profesional: true,
      },
      order: {
        fechaHoraInicio: 'ASC',
      },
    });

    const encabezados = [
      'ID Cita',
      'Fecha',
      'Hora Inicio',
      'Hora Fin',
      'Paciente',
      'DNI Paciente',
      'Profesional',
      'Especialidad',
      'Motivo',
      'Estado',
    ];

    const filas = citas.map((c) => {
      const d = c.fechaHoraInicio;
      const fecha = d.toISOString().slice(0, 10);
      const horaInicio = d.toTimeString().slice(0, 5);
      const horaFin = c.fechaHoraFin ? c.fechaHoraFin.toTimeString().slice(0, 5) : '';
      const paciente = `"${c.paciente?.nombre || ''} ${c.paciente?.apellido || ''}"`.trim();
      const dni = c.paciente?.documentoIdentidad || '';
      const profesional = `"${c.profesional?.nombre || ''} ${c.profesional?.apellido || ''}"`.trim();
      const esp = c.profesional?.especialidad || 'General';
      const motivo = `"${(c.motivo || '').replace(/"/g, '""')}"`;
      const estado = c.estado;

      return [c.id, fecha, horaInicio, horaFin, paciente, dni, profesional, esp, motivo, estado].join(';');
    });

    return [encabezados.join(';'), ...filas].join('\r\n');
  }
}
