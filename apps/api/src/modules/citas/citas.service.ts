import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cita, EstadoCita } from './entities/cita.entity.js';
import { CrearCitaDto } from './dto/crear-cita.dto.js';
import { ActualizarCitaDto } from './dto/actualizar-cita.dto.js';

/**
 * Servicio de Citas (CitasService).
 *
 * Encapsula la lógica de negocio para la gestión de citas médicas:
 * - Aislamiento multi-tenant forzoso por `consultorioId`.
 * - Algoritmo anti-solapamiento: ningún profesional puede tener dos citas activas
 *   al mismo tiempo en el mismo consultorio.
 * - Cálculo automático de `fechaHoraFin` a partir de `fechaHoraInicio` y `duracionMinutos`.
 * - Validación de pertenencia del paciente y del médico al consultorio.
 */
@Injectable()
export class CitasService {
  private readonly logger = new Logger(CitasService.name);

  constructor(
    @InjectRepository(Cita)
    private readonly citaRepo: Repository<Cita>,
  ) {}

  /**
   * Calcula la fecha y hora de finalización de una cita.
   *
   * La lógica es simple: `fechaHoraFin = fechaHoraInicio + duracionMinutos`.
   * Se usa `Date` nativo para evitar dependencias externas de manejo de fechas.
   */
  private calcularFechaHoraFin(fechaHoraInicio: Date, duracionMinutos: number): Date {
    // Convertimos los minutos a milisegundos y los sumamos al timestamp de inicio
    return new Date(fechaHoraInicio.getTime() + duracionMinutos * 60 * 1000);
  }

  /**
   * Algoritmo de Detección de Solapamiento de Agenda.
   *
   * Una cita nueva entra en conflicto con una existente si los intervalos temporales
   * se superponen. Matemáticamente:
   *
   *   Solapamiento = (NuevaInicio < ExistenteFin) AND (NuevaFin > ExistenteInicio)
   *
   * Se consulta directamente en PostgreSQL usando el índice especializado
   * `idx_citas_profesional_agenda` para máximo rendimiento.
   *
   * Se excluyen citas en estado CANCELADA y NO_ASISTIO porque esos estados
   * liberan el horario del profesional.
   *
   * @param consultorioId - ID del consultorio (multi-tenant)
   * @param profesionalId - ID del médico cuya agenda se verifica
   * @param inicio - Fecha/hora de inicio de la nueva cita
   * @param fin - Fecha/hora de fin de la nueva cita
   * @param excluirCitaId - ID de cita a ignorar (útil al reprogramar la misma cita)
   */
  private async verificarSolapamiento(
    consultorioId: string,
    profesionalId: string,
    inicio: Date,
    fin: Date,
    excluirCitaId?: string,
  ): Promise<void> {
    // Estados que bloquean la agenda (las canceladas y no asistidas NO bloquean)
    const estadosQueBloquean = [
      EstadoCita.PROGRAMADA,
      EstadoCita.CONFIRMADA,
      EstadoCita.EN_ESPERA,
      EstadoCita.EN_CONSULTA,
    ];

    // Construimos la consulta con TypeORM QueryBuilder para aprovechar los índices de PostgreSQL
    const consulta = this.citaRepo
      .createQueryBuilder('cita')
      .where('cita.consultorioId = :consultorioId', { consultorioId })
      .andWhere('cita.profesionalId = :profesionalId', { profesionalId })
      .andWhere('cita.estado IN (:...estados)', { estados: estadosQueBloquean })
      // La condición matemática de solapamiento de intervalos temporales:
      // inicio_nueva < fin_existente AND fin_nueva > inicio_existente
      .andWhere('cita.fechaHoraInicio < :fin', { fin })
      .andWhere('cita.fechaHoraFin > :inicio', { inicio });

    // Si estamos reprogramando, excluimos la propia cita del análisis
    if (excluirCitaId) {
      consulta.andWhere('cita.id != :excluirId', { excluirId: excluirCitaId });
    }

    const citaEnConflicto = await consulta.getOne();

    if (citaEnConflicto) {
      const inicioConflicto = new Date(citaEnConflicto.fechaHoraInicio).toLocaleString('es', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
      const finConflicto = new Date(citaEnConflicto.fechaHoraFin).toLocaleString('es', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
      throw new ConflictException(
        `El profesional ya tiene una cita agendada de ${inicioConflicto} a ${finConflicto}. Por favor seleccione otro horario.`,
      );
    }
  }

  /**
   * Verifica que un paciente pertenezca al consultorio del usuario autenticado.
   *
   * Esto previene que se agende una cita cruzando límites de tenant
   * (ej. un médico de Clínica A agendando para un paciente de Clínica B).
   */
  private async verificarPacienteEnConsultorio(
    consultorioId: string,
    pacienteId: string,
  ): Promise<void> {
    const count = await this.citaRepo.manager.query(
      `SELECT 1 FROM pacientes WHERE id = $1 AND consultorio_id = $2 AND activo = true LIMIT 1`,
      [pacienteId, consultorioId],
    );

    if (count.length === 0) {
      throw new NotFoundException(
        'El paciente no existe o no pertenece a su consultorio',
      );
    }
  }

  /**
   * Verifica que un profesional (usuario) pertenezca al consultorio del usuario autenticado.
   *
   * Previene que se asigne un médico de otra clínica a la agenda propia.
   */
  private async verificarProfesionalEnConsultorio(
    consultorioId: string,
    profesionalId: string,
  ): Promise<void> {
    const count = await this.citaRepo.manager.query(
      `SELECT 1 FROM usuarios WHERE id = $1 AND consultorio_id = $2 AND activo = true LIMIT 1`,
      [profesionalId, consultorioId],
    );

    if (count.length === 0) {
      throw new NotFoundException(
        'El profesional de salud no existe o no pertenece a su consultorio',
      );
    }
  }

  /**
   * Agenda una nueva cita médica en el sistema.
   *
   * Flujo de validaciones (en orden secuencial):
   * 1. Verifica que el paciente pertenezca al consultorio (multi-tenant).
   * 2. Verifica que el profesional pertenezca al consultorio (multi-tenant).
   * 3. Calcula automáticamente `fechaHoraFin` a partir de `duracionMinutos` (default: 30).
   * 4. Ejecuta el algoritmo anti-solapamiento en la agenda del profesional.
   * 5. Persiste la nueva cita con estado inicial `PROGRAMADA`.
   */
  async crear(consultorioId: string, dto: CrearCitaDto): Promise<Cita> {
    // 1. Validar que el paciente pertenece a este consultorio
    await this.verificarPacienteEnConsultorio(consultorioId, dto.pacienteId);

    // 2. Validar que el profesional pertenece a este consultorio
    await this.verificarProfesionalEnConsultorio(consultorioId, dto.profesionalId);

    // 3. Calcular fechas
    const fechaHoraInicio = new Date(dto.fechaHoraInicio);
    const duracion = dto.duracionMinutos ?? 30;
    const fechaHoraFin = this.calcularFechaHoraFin(fechaHoraInicio, duracion);

    // Validación extra: la cita no puede estar en el pasado (tolerancia de 5 minutos)
    const ahora = new Date();
    const toleranciaMs = 5 * 60 * 1000;
    if (fechaHoraInicio.getTime() < ahora.getTime() - toleranciaMs) {
      throw new BadRequestException(
        'No se puede agendar una cita en una fecha y hora pasada',
      );
    }

    // 4. Verificar que el profesional no tenga otra cita en ese horario
    await this.verificarSolapamiento(
      consultorioId,
      dto.profesionalId,
      fechaHoraInicio,
      fechaHoraFin,
    );

    // 5. Crear y persistir la cita
    const nuevaCita = this.citaRepo.create({
      consultorioId,
      pacienteId: dto.pacienteId,
      profesionalId: dto.profesionalId,
      fechaHoraInicio,
      fechaHoraFin,
      duracionMinutos: duracion,
      motivo: dto.motivo.trim(),
      notas: dto.notas ? dto.notas.trim() : null,
      estado: EstadoCita.PROGRAMADA,
    });

    const citaGuardada = await this.citaRepo.save(nuevaCita);

    this.logger.log(
      `Nueva cita agendada: ID ${citaGuardada.id} | Profesional: ${dto.profesionalId} | Inicio: ${fechaHoraInicio.toISOString()}`,
    );

    return citaGuardada;
  }

  /**
   * Obtiene los datos completos de una cita, incluyendo el nombre del paciente
   * y del profesional relacionados.
   *
   * Aplica aislamiento multi-tenant estricto: si la cita no pertenece al consultorio,
   * retorna 404 (evita enumeración de IDs).
   */
  async obtenerPorId(consultorioId: string, id: string): Promise<Cita> {
    const cita = await this.citaRepo.findOne({
      where: { id, consultorioId },
      relations: {
        paciente: true,
        profesional: true,
      },
    });

    if (!cita) {
      throw new NotFoundException('La cita no existe o no pertenece a su consultorio');
    }

    return cita;
  }

  /**
   * Actualiza o reprograman una cita existente.
   *
   * Casos de uso soportados:
   * - Cambiar el horario (nueva `fechaHoraInicio` y/o nueva `duracionMinutos`).
   * - Actualizar el motivo o notas de la cita.
   *
   * Si se modifica el horario, se vuelve a ejecutar el algoritmo anti-solapamiento,
   * excluyendo la propia cita del análisis para evitar un falso conflicto consigo misma.
   *
   * Restricción: Solo se pueden reprogramar citas en estados editables
   * (PROGRAMADA o CONFIRMADA). No se puede reprogramar una cita EN_ESPERA, EN_CONSULTA
   * o terminada.
   */
  async actualizar(
    consultorioId: string,
    id: string,
    dto: ActualizarCitaDto,
  ): Promise<Cita> {
    // 1. Obtener la cita existente validando pertenencia al consultorio
    const cita = await this.citaRepo.findOne({
      where: { id, consultorioId },
    });

    if (!cita) {
      throw new NotFoundException('La cita no existe o no pertenece a su consultorio');
    }

    // 2. Solo se pueden reprogramar citas en estados editables
    const estadosEditables = [EstadoCita.PROGRAMADA, EstadoCita.CONFIRMADA];
    if (!estadosEditables.includes(cita.estado)) {
      throw new BadRequestException(
        `No se puede modificar una cita en estado "${cita.estado}". Solo se pueden editar citas PROGRAMADA o CONFIRMADA.`,
      );
    }

    // 3. Si se está cambiando el horario, recalcular y verificar solapamiento
    let nuevaFechaInicio = cita.fechaHoraInicio;
    let nuevaDuracion = cita.duracionMinutos;
    let nuevaFechaFin = cita.fechaHoraFin;

    if (dto.fechaHoraInicio !== undefined || dto.duracionMinutos !== undefined) {
      // Usamos los nuevos valores si se proveen, o los existentes como fallback
      nuevaFechaInicio = dto.fechaHoraInicio
        ? new Date(dto.fechaHoraInicio)
        : cita.fechaHoraInicio;
      nuevaDuracion = dto.duracionMinutos ?? cita.duracionMinutos;
      nuevaFechaFin = this.calcularFechaHoraFin(nuevaFechaInicio, nuevaDuracion);

      // Verificar anti-solapamiento excluyendo esta misma cita
      await this.verificarSolapamiento(
        consultorioId,
        cita.profesionalId,
        nuevaFechaInicio,
        nuevaFechaFin,
        id, // ← excluimos la cita actual para no conflictuar consigo misma
      );
    }

    // 4. Aplicar los cambios
    if (dto.fechaHoraInicio !== undefined) cita.fechaHoraInicio = nuevaFechaInicio;
    if (dto.duracionMinutos !== undefined) cita.duracionMinutos = nuevaDuracion;
    cita.fechaHoraFin = nuevaFechaFin;
    if (dto.motivo !== undefined) cita.motivo = dto.motivo.trim();
    if (dto.notas !== undefined) cita.notas = dto.notas.trim() || null;

    const citaActualizada = await this.citaRepo.save(cita);

    this.logger.log(
      `Cita actualizada: ID ${id} | Nuevo inicio: ${citaActualizada.fechaHoraInicio.toISOString()}`,
    );

    return citaActualizada;
  }
}
