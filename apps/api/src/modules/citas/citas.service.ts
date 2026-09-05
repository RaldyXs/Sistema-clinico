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
import { CancelarCitaDto } from './dto/cancelar-cita.dto.js';
import { FiltrosAgendaDto } from './dto/filtros-agenda.dto.js';

/**
 * Matriz de transiciones válidas del flujo clínico.
 *
 * Define explícitamente qué estados puede tener una cita ANTES de hacer
 * una transición determinada. Esto actúa como un guardián que impide saltos
 * inválidos en el flujo (ej. pasar de PROGRAMADA directamente a ATENDIDA).
 *
 * Analogía: es como los semáforos de un quirófano — no puedes entrar
 * a operar sin haber pasado primero por admisión, preparación y anestesia.
 */
const TRANSICIONES_VALIDAS: Record<EstadoCita, EstadoCita[]> = {
  // CONFIRMAR solo es válido si la cita está PROGRAMADA
  [EstadoCita.CONFIRMADA]: [EstadoCita.PROGRAMADA],
  // Registrar llegada es válido desde PROGRAMADA o CONFIRMADA
  [EstadoCita.EN_ESPERA]: [EstadoCita.PROGRAMADA, EstadoCita.CONFIRMADA],
  // Iniciar consulta solo si el paciente ya está en sala de espera
  [EstadoCita.EN_CONSULTA]: [EstadoCita.EN_ESPERA],
  // Finalizar solo si la consulta está en curso
  [EstadoCita.ATENDIDA]: [EstadoCita.EN_CONSULTA],
  // Cancelar es válido desde cualquier estado activo
  [EstadoCita.CANCELADA]: [
    EstadoCita.PROGRAMADA,
    EstadoCita.CONFIRMADA,
    EstadoCita.EN_ESPERA,
    EstadoCita.EN_CONSULTA,
  ],
  // No asistió solo aplica a citas que estaban programadas o confirmadas
  [EstadoCita.NO_ASISTIO]: [EstadoCita.PROGRAMADA, EstadoCita.CONFIRMADA],
  // Estos son estados de origen, no de destino en transiciones
  [EstadoCita.PROGRAMADA]: [],
};

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

  /**
   * Motor de Transición de Estados (State Machine Engine).
   *
   * Método privado que centraliza TODA la lógica de cambio de estado.
   * Cada endpoint público de transición (confirmar, registrarLlegada, etc.)
   * delega aquí para evitar duplicación de código.
   *
   * Proceso:
   * 1. Busca la cita validando el aislamiento multi-tenant.
   * 2. Consulta la matriz TRANSICIONES_VALIDAS para verificar si el salto es permitido.
   * 3. Si no es válido, lanza un error descriptivo indicando desde qué estado viene
   *    y a qué estado se intenta llegar.
   * 4. Aplica el nuevo estado y registra en el log para trazabilidad.
   */
  private async transicionarEstado(
    consultorioId: string,
    id: string,
    nuevoEstado: EstadoCita,
    camposExtra?: Partial<Cita>,
  ): Promise<Cita> {
    // 1. Obtener la cita con aislamiento multi-tenant
    const cita = await this.citaRepo.findOne({ where: { id, consultorioId } });

    if (!cita) {
      throw new NotFoundException('La cita no existe o no pertenece a su consultorio');
    }

    // 2. Validar que la transición esté permitida por la máquina de estados
    const estadosPermitidos = TRANSICIONES_VALIDAS[nuevoEstado];
    if (!estadosPermitidos.includes(cita.estado)) {
      throw new BadRequestException(
        `No se puede cambiar el estado de "${cita.estado}" a "${nuevoEstado}". ` +
        `Transición no permitida en el flujo clínico.`,
      );
    }

    // 3. Aplicar el nuevo estado y cualquier campo adicional (ej. motivoCancelacion)
    cita.estado = nuevoEstado;
    if (camposExtra) {
      Object.assign(cita, camposExtra);
    }

    const citaActualizada = await this.citaRepo.save(cita);

    this.logger.log(
      `Cita ID ${id} | Transición de estado: ${cita.estado} → ${nuevoEstado}`,
    );

    return citaActualizada;
  }

  /**
   * CONFIRMAR — El paciente confirma su asistencia al turno.
   *
   * Quién lo ejecuta: Recepcionista (por teléfono, WhatsApp o portal web).
   * Estado origen permitido: PROGRAMADA
   * Estado destino: CONFIRMADA
   */
  async confirmar(consultorioId: string, id: string): Promise<Cita> {
    return this.transicionarEstado(consultorioId, id, EstadoCita.CONFIRMADA);
  }

  /**
   * REGISTRAR LLEGADA — El paciente se presenta físicamente en la clínica.
   *
   * Quién lo ejecuta: Recepcionista al ver al paciente llegar.
   * Estado origen permitido: PROGRAMADA o CONFIRMADA
   * Estado destino: EN_ESPERA
   *
   * Nota: También es válido desde PROGRAMADA porque un paciente puede llegar
   * sin haber confirmado previamente por teléfono.
   */
  async registrarLlegada(consultorioId: string, id: string): Promise<Cita> {
    return this.transicionarEstado(consultorioId, id, EstadoCita.EN_ESPERA);
  }

  /**
   * INICIAR CONSULTA — El médico llama al paciente a su consultorio.
   *
   * Quién lo ejecuta: Médico o recepcionista cuando el médico está disponible.
   * Estado origen permitido: EN_ESPERA (el paciente debe haber llegado primero)
   * Estado destino: EN_CONSULTA
   */
  async iniciarConsulta(consultorioId: string, id: string): Promise<Cita> {
    return this.transicionarEstado(consultorioId, id, EstadoCita.EN_CONSULTA);
  }

  /**
   * FINALIZAR — El médico concluye el acto médico satisfactoriamente.
   *
   * Quién lo ejecuta: Médico al terminar la atención.
   * Estado origen permitido: EN_CONSULTA
   * Estado destino: ATENDIDA
   *
   * Este es el estado terminal exitoso. En Fase 4, este evento disparará
   * la creación automática del registro de Historia Clínica.
   */
  async finalizar(consultorioId: string, id: string): Promise<Cita> {
    return this.transicionarEstado(consultorioId, id, EstadoCita.ATENDIDA);
  }

  /**
   * CANCELAR — La cita es cancelada antes o durante el proceso de atención.
   *
   * Quién lo ejecuta: Recepcionista o médico.
   * Estado origen permitido: PROGRAMADA, CONFIRMADA, EN_ESPERA o EN_CONSULTA
   * Estado destino: CANCELADA
   *
   * El motivo de cancelación es OBLIGATORIO por regulaciones médico-legales.
   * Al cancelar, el horario queda liberado en la agenda del profesional.
   */
  async cancelar(
    consultorioId: string,
    id: string,
    dto: CancelarCitaDto,
  ): Promise<Cita> {
    return this.transicionarEstado(consultorioId, id, EstadoCita.CANCELADA, {
      motivoCancelacion: dto.motivoCancelacion.trim(),
    });
  }

  /**
   * NO ASISTIÓ — El paciente no se presentó a su turno.
   *
   * Quién lo ejecuta: Recepcionista cuando el horario pasa sin que el paciente llegue.
   * Estado origen permitido: PROGRAMADA o CONFIRMADA
   * Estado destino: NO_ASISTIO
   *
   * Las inasistencias quedan registradas para estadísticas de ausentismo
   * y para eventualmente aplicar políticas de la clínica (ej. cobro por inasistencia).
   */
  async registrarNoAsistio(consultorioId: string, id: string): Promise<Cita> {
    return this.transicionarEstado(consultorioId, id, EstadoCita.NO_ASISTIO);
  }

  /**
   * Consulta de Agenda — Vista Diaria y Semanal.
   *
   * Responde preguntas clave de la operación diaria de la clínica:
   * - "¿Qué citas hay hoy?" → filtro por `fecha`
   * - "¿Qué citas hay esta semana?" → filtro por `fechaDesde` y `fechaHasta`
   * - "¿Quién está en sala de espera ahora?" → filtro por `estado=EN_ESPERA`
   * - "¿Cuántas citas tiene el Dr. Mendoza mañana?" → filtro por `profesionalId`
   *
   * El resultado incluye:
   * - Lista paginada de citas con datos del paciente y del médico.
   * - Metadatos de paginación (total, página, limite, totalPaginas).
   * - Resumen de conteo por estado (cuántas PROGRAMADAS, EN_ESPERA, ATENDIDAS, etc.)
   *   para el dashboard de la recepción.
   *
   * Siempre aplica aislamiento multi-tenant estricto: solo retorna
   * las citas del consultorio del usuario autenticado.
   */
  async obtenerAgenda(
    consultorioId: string,
    filtros: FiltrosAgendaDto,
  ): Promise<{
    datos: Cita[];
    meta: {
      total: number;
      pagina: number;
      limite: number;
      totalPaginas: number;
    };
    resumen: Partial<Record<EstadoCita, number>>;
  }> {
    const pagina = filtros.pagina ?? 1;
    const limite = filtros.limite ?? 20;

    // Construimos la consulta base con el índice optimizado de PostgreSQL
    const qb = this.citaRepo
      .createQueryBuilder('cita')
      // Cargamos los datos del paciente y del médico en la misma consulta (JOIN)
      .leftJoinAndSelect('cita.paciente', 'paciente')
      .leftJoinAndSelect('cita.profesional', 'profesional')
      // Aislamiento multi-tenant — este filtro es SIEMPRE obligatorio
      .where('cita.consultorioId = :consultorioId', { consultorioId })
      // Las citas se muestran en orden cronológico (primero las más tempranas del día)
      .orderBy('cita.fechaHoraInicio', 'ASC');

    // ── FILTROS DE FECHA ────────────────────────────────────────────────────
    if (filtros.fecha) {
      // Vista diaria: todas las citas que INICIAN dentro de ese día calendario
      // Usamos los extremos del día (00:00:00 al 23:59:59.999) para capturar
      // todas las citas sin importar la hora
      const inicioDia = new Date(`${filtros.fecha}T00:00:00.000Z`);
      const finDia = new Date(`${filtros.fecha}T23:59:59.999Z`);
      qb.andWhere('cita.fechaHoraInicio BETWEEN :inicioDia AND :finDia', {
        inicioDia,
        finDia,
      });
    } else if (filtros.fechaDesde || filtros.fechaHasta) {
      // Vista por rango: semanal o cualquier rango de fechas personalizado
      if (filtros.fechaDesde) {
        const inicio = new Date(`${filtros.fechaDesde}T00:00:00.000Z`);
        qb.andWhere('cita.fechaHoraInicio >= :inicio', { inicio });
      }
      if (filtros.fechaHasta) {
        const fin = new Date(`${filtros.fechaHasta}T23:59:59.999Z`);
        qb.andWhere('cita.fechaHoraInicio <= :fin', { fin });
      }
    }

    // ── FILTRO POR PROFESIONAL ──────────────────────────────────────────────
    if (filtros.profesionalId) {
      // Validamos que el profesional pertenezca al consultorio antes de filtrar
      await this.verificarProfesionalEnConsultorio(consultorioId, filtros.profesionalId);
      qb.andWhere('cita.profesionalId = :profesionalId', {
        profesionalId: filtros.profesionalId,
      });
    }

    // ── FILTRO POR ESTADO ───────────────────────────────────────────────────
    if (filtros.estado) {
      qb.andWhere('cita.estado = :estado', { estado: filtros.estado });
    }

    // ── PAGINACIÓN ──────────────────────────────────────────────────────────
    const total = await qb.getCount();
    const datos = await qb
      .skip((pagina - 1) * limite)
      .take(limite)
      .getMany();

    // ── RESUMEN POR ESTADO ──────────────────────────────────────────────────
    // Consulta auxiliar para contar cuántas citas hay en cada estado
    // dentro del mismo rango filtrado. Esto alimenta el dashboard de recepción.
    const resumenRaw = await this.citaRepo
      .createQueryBuilder('cita')
      .select('cita.estado', 'estado')
      .addSelect('COUNT(*)', 'cantidad')
      .where('cita.consultorioId = :consultorioId', { consultorioId })
      .groupBy('cita.estado')
      .getRawMany<{ estado: EstadoCita; cantidad: string }>();

    const resumen = resumenRaw.reduce<Partial<Record<EstadoCita, number>>>(
      (acc, row) => {
        acc[row.estado] = parseInt(row.cantidad, 10);
        return acc;
      },
      {},
    );

    return {
      datos,
      meta: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
      resumen,
    };
  }
}
