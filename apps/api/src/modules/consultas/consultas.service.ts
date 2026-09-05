import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Consulta, EstadoConsulta } from './entities/consulta.entity.js';
import { CrearConsultaDto } from './dto/crear-consulta.dto.js';
import { FiltrosSignosVitalesDto } from './dto/filtros-signos-vitales.dto.js';

/**
 * Servicio de Consultas Clínicas (ConsultasService).
 *
 * Encapsula la lógica asistencial y médico-legal:
 * - Aislamiento multi-tenant forzoso por `consultorioId`.
 * - Trazabilidad y validación de paciente, profesional y cita origen.
 * - Cálculo automático y estandarizado del Índice de Masa Corporal (IMC).
 * - Control de unicidad de consultas por cita (evita registros duplicados para un mismo turno).
 */
@Injectable()
export class ConsultasService {
  private readonly logger = new Logger(ConsultasService.name);

  constructor(
    @InjectRepository(Consulta)
    private readonly consultaRepo: Repository<Consulta>,
  ) {}

  /**
   * Calcula el Índice de Masa Corporal (IMC) a partir del peso y la talla.
   *
   * Fórmula OMS: IMC = peso (kg) / (talla (m))^2
   * Retorna el valor redondeado a 2 decimales, o null si falta algún parámetro.
   */
  calcularImc(pesoKg?: number | null, tallaCm?: number | null): number | null {
    if (!pesoKg || !tallaCm || tallaCm <= 0) {
      return null;
    }
    const tallaMetros = tallaCm / 100;
    const imc = pesoKg / (tallaMetros * tallaMetros);
    return Math.round(imc * 100) / 100;
  }

  /**
   * Clasifica el IMC según los rangos clínicos internacionales de la OMS:
   * - < 18.5: Bajo peso
   * - 18.5 - 24.9: Peso normal / Eutrófico
   * - 25.0 - 29.9: Sobrepeso / Preobesidad
   * - 30.0 - 34.9: Obesidad Grado I (Moderada)
   * - 35.0 - 39.9: Obesidad Grado II (Severa)
   * - >= 40.0: Obesidad Grado III (Mórbida)
   */
  clasificarImc(imc?: number | null): string | null {
    if (!imc || imc <= 0) return null;
    if (imc < 18.5) return 'Bajo peso';
    if (imc < 25.0) return 'Peso normal / Eutrófico';
    if (imc < 30.0) return 'Sobrepeso / Preobesidad';
    if (imc < 35.0) return 'Obesidad Grado I (Moderada)';
    if (imc < 40.0) return 'Obesidad Grado II (Severa)';
    return 'Obesidad Grado III (Mórbida)';
  }

  /**
   * Valida la existencia y pertenencia del paciente al consultorio.
   */
  private async verificarPacienteEnConsultorio(
    consultorioId: string,
    pacienteId: string,
  ): Promise<void> {
    const res = await this.consultaRepo.manager.query(
      `SELECT 1 FROM pacientes WHERE id = $1 AND consultorio_id = $2 AND activo = true LIMIT 1`,
      [pacienteId, consultorioId],
    );

    if (res.length === 0) {
      throw new NotFoundException('Paciente no encontrado');
    }
  }

  /**
   * Valida la existencia y pertenencia del profesional de salud al consultorio.
   */
  private async verificarProfesionalEnConsultorio(
    consultorioId: string,
    profesionalId: string,
  ): Promise<void> {
    const res = await this.consultaRepo.manager.query(
      `SELECT 1 FROM usuarios WHERE id = $1 AND consultorio_id = $2 AND activo = true LIMIT 1`,
      [profesionalId, consultorioId],
    );

    if (res.length === 0) {
      throw new NotFoundException('Profesional de salud no encontrado');
    }
  }

  /**
   * Valida la cita médica origen (si se proporcionó):
   * 1. Que pertenezca a la misma clínica.
   * 2. Que corresponda exactamente al mismo paciente evaluado.
   * 3. Que no tenga ya una consulta activa registrada (evita duplicados).
   */
  private async verificarCitaVinculada(
    consultorioId: string,
    citaId: string,
    pacienteId: string,
  ): Promise<void> {
    const citas = await this.consultaRepo.manager.query(
      `SELECT id, paciente_id FROM citas WHERE id = $1 AND consultorio_id = $2 LIMIT 1`,
      [citaId, consultorioId],
    );

    if (citas.length === 0) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (citas[0].paciente_id !== pacienteId) {
      throw new BadRequestException(
        'La cita seleccionada no corresponde al paciente indicado',
      );
    }

    // Verificar si ya existe una consulta no anulada para esta cita
    const consultaExistente = await this.consultaRepo.findOne({
      where: {
        consultorioId,
        citaId,
        estado: Not(EstadoConsulta.ANULADA),
      },
    });

    if (consultaExistente) {
      throw new ConflictException(
        'Ya existe una consulta clínica registrada para esta cita médica',
      );
    }
  }

  /**
   * Registra una nueva Consulta Clínica en el sistema.
   *
   * Flujo de ejecución:
   * 1. Valida aislamiento multi-tenant para el paciente.
   * 2. Determina el profesional responsable (el indicado en DTO o el usuario autenticado).
   * 3. Valida la cita vinculada (en caso de existir).
   * 4. Calcula automáticamente el IMC si se aportan peso y talla.
   * 5. Almacena el registro con estado inicial `BORRADOR`.
   */
  async crear(
    consultorioId: string,
    usuarioId: string,
    dto: CrearConsultaDto,
  ): Promise<Consulta> {
    // 1. Validar que el paciente pertenece al consultorio
    await this.verificarPacienteEnConsultorio(consultorioId, dto.pacienteId);

    // 2. Determinar profesional (el provisto en DTO o el médico logueado)
    const profesionalId = dto.profesionalId || usuarioId;
    await this.verificarProfesionalEnConsultorio(consultorioId, profesionalId);

    // 3. Validar cita si fue enviada
    if (dto.citaId) {
      await this.verificarCitaVinculada(consultorioId, dto.citaId, dto.pacienteId);
    }

    // 4. Calcular IMC biométrico automático
    const imcCalculado = this.calcularImc(dto.pesoKg, dto.tallaCm);

    // 5. Determinar fecha de atención
    const fechaAtencion = dto.fechaAtencion
      ? new Date(dto.fechaAtencion)
      : new Date();

    // 6. Instanciar y persistir la consulta
    const nuevaConsulta = this.consultaRepo.create({
      consultorioId,
      pacienteId: dto.pacienteId,
      profesionalId,
      citaId: dto.citaId || null,
      fechaAtencion,
      estado: EstadoConsulta.BORRADOR,
      motivoConsulta: dto.motivoConsulta.trim(),
      enfermedadActual: dto.enfermedadActual ? dto.enfermedadActual.trim() : null,
      pesoKg: dto.pesoKg ?? null,
      tallaCm: dto.tallaCm ?? null,
      imc: imcCalculado,
      presionSistolica: dto.presionSistolica ?? null,
      presionDiastolica: dto.presionDiastolica ?? null,
      frecuenciaCardiaca: dto.frecuenciaCardiaca ?? null,
      frecuenciaRespiratoria: dto.frecuenciaRespiratoria ?? null,
      temperatura: dto.temperatura ?? null,
      saturacionOxigeno: dto.saturacionOxigeno ?? null,
      examenFisico: dto.examenFisico ? dto.examenFisico.trim() : null,
      notasEvolucion: dto.notasEvolucion ? dto.notasEvolucion.trim() : null,
      diagnosticoPrincipal: dto.diagnosticoPrincipal
        ? dto.diagnosticoPrincipal.trim()
        : null,
      codigoCie10: dto.codigoCie10 ? dto.codigoCie10.trim().toUpperCase() : null,
      diagnosticosSecundarios: dto.diagnosticosSecundarios
        ? dto.diagnosticosSecundarios.trim()
        : null,
      planTratamiento: dto.planTratamiento ? dto.planTratamiento.trim() : null,
      indicacionesGenerales: dto.indicacionesGenerales
        ? dto.indicacionesGenerales.trim()
        : null,
      proximoControl: dto.proximoControl ?? null,
    });

    const guardada = await this.consultaRepo.save(nuevaConsulta);

    this.logger.log(
      `Nueva consulta creada: ID ${guardada.id} | Paciente: ${guardada.pacienteId} | Médico: ${profesionalId}`,
    );

    return guardada;
  }

  /**
   * Obtiene una consulta clínica por su ID con todas sus relaciones asociadas
   * (paciente, profesional y cita).
   *
   * Aplica aislamiento multi-tenant estricto: retorna 404 si la consulta pertenece a otra clínica.
   */
  async obtenerPorId(consultorioId: string, id: string): Promise<Consulta> {
    const consulta = await this.consultaRepo.findOne({
      where: { id, consultorioId },
      relations: {
        paciente: true,
        profesional: true,
        cita: true,
      },
    });

    if (!consulta) {
      throw new NotFoundException('Consulta clínica no encontrada');
    }

    return consulta;
  }

  /**
   * Obtiene la evolución histórica de signos vitales de un paciente.
   *
   * Diseñado para alimentar gráficas clínicas y paneles de seguimiento:
   * - Curva de peso y variación de IMC con clasificación OMS.
   * - Curva de presión arterial (sistólica/diastólica).
   * - Frecuencia cardíaca, respiratoria, temperatura y oximetría.
   *
   * Garantías:
   * - Aislamiento multi-tenant estricto: solo accede a pacientes de la clínica del usuario.
   * - Descarta consultas anuladas para preservar la validez clínica.
   * - Filtra únicamente atenciones que cuenten con datos biométricos.
   * - Proporciona el resumen del último control para acceso rápido en la cabecera.
   */
  async obtenerSignosVitalesHistoricos(
    consultorioId: string,
    pacienteId: string,
    filtros: FiltrosSignosVitalesDto,
  ) {
    // 1. Validar existencia del paciente en el consultorio
    await this.verificarPacienteEnConsultorio(consultorioId, pacienteId);

    const limite = filtros.limite ?? 20;

    // 2. Consulta optimizada aprovechando el índice compuesto (consultorio_id, paciente_id, fecha_atencion)
    const qb = this.consultaRepo
      .createQueryBuilder('consulta')
      .leftJoinAndSelect('consulta.profesional', 'profesional')
      .where('consulta.consultorioId = :consultorioId', { consultorioId })
      .andWhere('consulta.pacienteId = :pacienteId', { pacienteId })
      .andWhere('consulta.estado != :estadoAnulada', {
        estadoAnulada: EstadoConsulta.ANULADA,
      })
      .andWhere(
        '(consulta.pesoKg IS NOT NULL OR consulta.presionSistolica IS NOT NULL OR consulta.frecuenciaCardiaca IS NOT NULL OR consulta.temperatura IS NOT NULL OR consulta.saturacionOxigeno IS NOT NULL)',
      )
      .orderBy('consulta.fechaAtencion', 'DESC');

    if (filtros.fechaDesde) {
      qb.andWhere('consulta.fechaAtencion >= :desde', {
        desde: new Date(`${filtros.fechaDesde}T00:00:00.000Z`),
      });
    }

    if (filtros.fechaHasta) {
      qb.andWhere('consulta.fechaAtencion <= :hasta', {
        hasta: new Date(`${filtros.fechaHasta}T23:59:59.999Z`),
      });
    }

    const registros = await qb.take(limite).getMany();

    // 3. Mapear y enriquecer cada registro con clasificación OMS
    const historico = registros.map((c) => ({
      consultaId: c.id,
      fechaAtencion: c.fechaAtencion,
      profesional: c.profesional
        ? `${c.profesional.nombre} ${c.profesional.apellido}`
        : null,
      pesoKg: c.pesoKg ? Number(c.pesoKg) : null,
      tallaCm: c.tallaCm ? Number(c.tallaCm) : null,
      imc: c.imc ? Number(c.imc) : null,
      clasificacionImc: this.clasificarImc(c.imc ? Number(c.imc) : null),
      presionSistolica: c.presionSistolica,
      presionDiastolica: c.presionDiastolica,
      presionArterial:
        c.presionSistolica && c.presionDiastolica
          ? `${c.presionSistolica}/${c.presionDiastolica} mmHg`
          : null,
      frecuenciaCardiaca: c.frecuenciaCardiaca,
      frecuenciaRespiratoria: c.frecuenciaRespiratoria,
      temperatura: c.temperatura ? Number(c.temperatura) : null,
      saturacionOxigeno: c.saturacionOxigeno ? Number(c.saturacionOxigeno) : null,
    }));

    return {
      pacienteId,
      totalRegistros: historico.length,
      resumenUltimoControl: historico.length > 0 ? historico[0] : null,
      historico,
    };
  }
}

