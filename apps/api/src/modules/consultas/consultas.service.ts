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
      throw new NotFoundException(
        'El paciente no existe o no pertenece a su consultorio',
      );
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
      throw new NotFoundException(
        'El profesional de salud no existe o no pertenece a su consultorio',
      );
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
      throw new NotFoundException(
        'La cita no existe o no pertenece a su consultorio',
      );
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
      throw new NotFoundException(
        'La consulta clínica no existe o no pertenece a su consultorio',
      );
    }

    return consulta;
  }
}
