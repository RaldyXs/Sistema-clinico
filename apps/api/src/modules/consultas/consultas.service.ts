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
import { FiltrosHistorialClinicoDto } from './dto/filtros-historial-clinico.dto.js';
import { ActualizarDiagnosticoTratamientoDto } from './dto/actualizar-diagnostico-tratamiento.dto.js';
import { AnularConsultaDto } from './dto/anular-consulta.dto.js';
import { buscarEnCie10, CodigoCie10 } from './data/cie10-catalogo.js';

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

  /**
   * Búsqueda en el catálogo internacional CIE-10 para autocompletado médico.
   */
  buscarCie10(termino?: string, limite = 15): CodigoCie10[] {
    return buscarEnCie10(termino, limite);
  }

  /**
   * Actualiza el diagnóstico, plan de tratamiento o notas de una consulta clínica en curso.
   *
   * Regla médico-legal estricta:
   * Solo se permite editar consultas en estado `BORRADOR`.
   * Si la consulta ya fue `COMPLETADA` o `ANULADA`, la petición es rechazada
   * para salvaguardar la integridad inmutable del acto médico.
   */
  async actualizar(
    consultorioId: string,
    id: string,
    dto: ActualizarDiagnosticoTratamientoDto,
  ): Promise<Consulta> {
    // 1. Obtener la consulta verificando aislamiento multi-tenant
    const consulta = await this.consultaRepo.findOne({
      where: { id, consultorioId },
    });

    if (!consulta) {
      throw new NotFoundException('Consulta clínica no encontrada');
    }

    // 2. Regla médico-legal: solo BORRADOR es editable
    if (consulta.estado !== EstadoConsulta.BORRADOR) {
      throw new BadRequestException(
        `No se puede modificar una consulta médica en estado "${consulta.estado}". ` +
        `Las consultas completadas o anuladas quedan selladas para proteger la historia clínica.`,
      );
    }

    // 3. Recalcular IMC si se actualizaron peso o talla
    const nuevoPeso = dto.pesoKg !== undefined ? dto.pesoKg : consulta.pesoKg;
    const nuevaTalla = dto.tallaCm !== undefined ? dto.tallaCm : consulta.tallaCm;
    if (dto.pesoKg !== undefined || dto.tallaCm !== undefined) {
      consulta.pesoKg = nuevoPeso;
      consulta.tallaCm = nuevaTalla;
      consulta.imc = this.calcularImc(nuevoPeso, nuevaTalla);
    }

    // 4. Actualizar signos vitales opcionales
    if (dto.presionSistolica !== undefined) consulta.presionSistolica = dto.presionSistolica;
    if (dto.presionDiastolica !== undefined) consulta.presionDiastolica = dto.presionDiastolica;
    if (dto.frecuenciaCardiaca !== undefined) consulta.frecuenciaCardiaca = dto.frecuenciaCardiaca;
    if (dto.frecuenciaRespiratoria !== undefined) consulta.frecuenciaRespiratoria = dto.frecuenciaRespiratoria;
    if (dto.temperatura !== undefined) consulta.temperatura = dto.temperatura;
    if (dto.saturacionOxigeno !== undefined) consulta.saturacionOxigeno = dto.saturacionOxigeno;

    // 5. Actualizar notas clínicas y evolución
    if (dto.motivoConsulta !== undefined) consulta.motivoConsulta = dto.motivoConsulta.trim();
    if (dto.enfermedadActual !== undefined) consulta.enfermedadActual = dto.enfermedadActual.trim() || null;
    if (dto.examenFisico !== undefined) consulta.examenFisico = dto.examenFisico.trim() || null;
    if (dto.notasEvolucion !== undefined) consulta.notasEvolucion = dto.notasEvolucion.trim() || null;

    // 6. Actualizar diagnósticos y plan de tratamiento
    if (dto.diagnosticoPrincipal !== undefined) consulta.diagnosticoPrincipal = dto.diagnosticoPrincipal.trim() || null;
    if (dto.codigoCie10 !== undefined) consulta.codigoCie10 = dto.codigoCie10.trim().toUpperCase() || null;
    if (dto.diagnosticosSecundarios !== undefined) consulta.diagnosticosSecundarios = dto.diagnosticosSecundarios.trim() || null;
    if (dto.planTratamiento !== undefined) consulta.planTratamiento = dto.planTratamiento.trim() || null;
    if (dto.indicacionesGenerales !== undefined) consulta.indicacionesGenerales = dto.indicacionesGenerales.trim() || null;
    if (dto.proximoControl !== undefined) consulta.proximoControl = dto.proximoControl || null;

    const guardada = await this.consultaRepo.save(consulta);

    this.logger.log(
      `Consulta ID ${id} actualizada con nuevo diagnóstico / tratamiento | CIE-10: ${guardada.codigoCie10}`,
    );

    return guardada;
  }

  /**
   * Completa y sella formalmente una consulta clínica (Acto Médico).
   *
   * Reglas de negocio y médico-legales:
   * 1. Solo se pueden completar consultas en estado `BORRADOR`.
   * 2. Exige obligatoriamente que exista un `diagnosticoPrincipal` formulado.
   * 3. Sella la consulta asignando `estado = COMPLETADA` y `cerradaEn = NOW()`.
   * 4. Si la consulta tiene una `citaId` asociada, actualiza automáticamente el estado
   *    de la cita en agenda a `ATENDIDA` (cerrando el ciclo del paciente en recepción).
   */
  async completar(consultorioId: string, id: string): Promise<Consulta> {
    const consulta = await this.consultaRepo.findOne({
      where: { id, consultorioId },
    });

    if (!consulta) {
      throw new NotFoundException('Consulta clínica no encontrada');
    }

    if (consulta.estado === EstadoConsulta.COMPLETADA) {
      throw new BadRequestException('La consulta clínica ya se encuentra completada');
    }

    if (consulta.estado === EstadoConsulta.ANULADA) {
      throw new BadRequestException(
        'No se puede completar una consulta clínica que ha sido anulada',
      );
    }

    // Exigencia médico-legal: Diagnóstico principal obligatorio para firmar el expediente
    if (!consulta.diagnosticoPrincipal || consulta.diagnosticoPrincipal.trim().length === 0) {
      throw new BadRequestException(
        'Para completar y sellar la consulta es obligatorio registrar el diagnóstico principal del paciente',
      );
    }

    consulta.estado = EstadoConsulta.COMPLETADA;
    consulta.cerradaEn = new Date();

    const completada = await this.consultaRepo.save(consulta);

    // Si provenía de una cita en agenda, actualizamos la cita a ATENDIDA
    if (consulta.citaId) {
      await this.consultaRepo.manager.query(
        `UPDATE citas 
         SET estado = 'ATENDIDA', actualizado_en = NOW() 
         WHERE id = $1 AND consultorio_id = $2 AND estado NOT IN ('CANCELADA', 'NO_ASISTIO')`,
        [consulta.citaId, consultorioId],
      );
      this.logger.log(
        `Cita vinculada ID ${consulta.citaId} marcada como ATENDIDA automáticamente tras completar consulta ID ${id}`,
      );
    }

    this.logger.log(
      `Consulta clínica ID ${id} COMPLETADA y sellada formalmente a las ${consulta.cerradaEn.toISOString()}`,
    );

    return completada;
  }

  /**
   * Anula formalmente una consulta médica con justificación obligatoria.
   *
   * Reglas de negocio:
   * 1. Se puede anular desde `BORRADOR` o excepcionalmente desde `COMPLETADA`.
   * 2. Si ya está `ANULADA`, se rechaza la operación.
   * 3. Requiere justificación médico-legal (`motivoAnulacion`).
   */
  async anular(
    consultorioId: string,
    id: string,
    dto: AnularConsultaDto,
  ): Promise<Consulta> {
    const consulta = await this.consultaRepo.findOne({
      where: { id, consultorioId },
    });

    if (!consulta) {
      throw new NotFoundException('Consulta clínica no encontrada');
    }

    if (consulta.estado === EstadoConsulta.ANULADA) {
      throw new BadRequestException('La consulta clínica ya se encuentra anulada');
    }

    consulta.estado = EstadoConsulta.ANULADA;
    consulta.motivoAnulacion = dto.motivoAnulacion.trim();

    const anulada = await this.consultaRepo.save(consulta);

    this.logger.log(
      `Consulta clínica ID ${id} ANULADA. Motivo: "${anulada.motivoAnulacion}"`,
    );

    return anulada;
  }

  /**
   * Obtiene la Historia Clínica integral y cronológica del paciente (Timeline 360°).
   *
   * Diseñado para la pantalla principal del médico en el consultorio:
   * 1. Cabecera médica del paciente: datos demográficos, edad clínica, alergias destacadas,
   *    grupo sanguíneo y antecedentes patológicos.
   * 2. Estadísticas asistenciales: total de consultas, primera y última atención,
   *    y diagnósticos CIE-10 más frecuentes.
   * 3. Línea de tiempo cronológica paginada: cada consulta con su médico tratante,
   *    anamnesis, signos vitales con IMC clasificado por la OMS, examen físico,
   *    diagnósticos principal y secundarios, plan terapéutico, pautas de alarma
   *    y cita de origen (si aplica).
   * 4. Filtros potentes: por rango de fechas, profesional tratante, código CIE-10 o estado.
   *
   * Seguridad:
   * - Aislamiento multi-tenant forzoso: solo consulta pacientes de la clínica activa.
   */
  async obtenerHistorialClinico(
    consultorioId: string,
    pacienteId: string,
    filtros: FiltrosHistorialClinicoDto,
  ) {
    // 1. Obtener datos demográficos y clínicos del paciente
    const pacientes = await this.consultaRepo.manager.query(
      `SELECT id, nombre, apellido, documento_identidad, tipo_documento, fecha_nacimiento,
              genero, telefono, email, grupo_sanguineo, alergias,
              antecedentes_medicos, antecedentes_familiares
       FROM pacientes
       WHERE id = $1 AND consultorio_id = $2 AND activo = true
       LIMIT 1`,
      [pacienteId, consultorioId],
    );

    if (pacientes.length === 0) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const paciente = pacientes[0];

    // Cálculo de edad clínica
    const fechaNac = new Date(paciente.fecha_nacimiento);
    const hoy = new Date();
    let edadAnios = hoy.getFullYear() - fechaNac.getFullYear();
    const mesDif = hoy.getMonth() - fechaNac.getMonth();
    if (mesDif < 0 || (mesDif === 0 && hoy.getDate() < fechaNac.getDate())) {
      edadAnios--;
    }

    // 2. Construcción de consulta de timeline con filtros y relaciones
    const pagina = filtros.pagina ?? 1;
    const limite = filtros.limite ?? 10;

    const qb = this.consultaRepo
      .createQueryBuilder('consulta')
      .leftJoinAndSelect('consulta.profesional', 'profesional')
      .leftJoinAndSelect('consulta.cita', 'cita')
      .where('consulta.consultorioId = :consultorioId', { consultorioId })
      .andWhere('consulta.pacienteId = :pacienteId', { pacienteId })
      .orderBy('consulta.fechaAtencion', 'DESC');

    // Filtros opcionales
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

    if (filtros.profesionalId) {
      qb.andWhere('consulta.profesionalId = :profesionalId', {
        profesionalId: filtros.profesionalId,
      });
    }

    if (filtros.codigoCie10) {
      qb.andWhere('consulta.codigoCie10 = :codigoCie10', {
        codigoCie10: filtros.codigoCie10.trim().toUpperCase(),
      });
    }

    if (filtros.estado) {
      qb.andWhere('consulta.estado = :estado', { estado: filtros.estado });
    }

    // Paginación
    const total = await qb.getCount();
    const consultas = await qb
      .skip((pagina - 1) * limite)
      .take(limite)
      .getMany();

    // 3. Estadísticas generales del expediente del paciente
    const statsConsultas = await this.consultaRepo.manager.query(
      `SELECT 
         COUNT(*) as total_consultas,
         MIN(fecha_atencion) as primera_atencion,
         MAX(fecha_atencion) as ultima_atencion
       FROM consultas
       WHERE consultorio_id = $1 AND paciente_id = $2 AND estado != 'ANULADA'`,
      [consultorioId, pacienteId],
    );

    const diagnosticosFrecuentes = await this.consultaRepo.manager.query(
      `SELECT codigo_cie10, diagnostico_principal, COUNT(*) as cantidad
       FROM consultas
       WHERE consultorio_id = $1 AND paciente_id = $2 AND codigo_cie10 IS NOT NULL AND estado != 'ANULADA'
       GROUP BY codigo_cie10, diagnostico_principal
       ORDER BY cantidad DESC
       LIMIT 5`,
      [consultorioId, pacienteId],
    );

    // 4. Mapear cada nodo de la línea de tiempo
    const timeline = consultas.map((c) => ({
      id: c.id,
      fechaAtencion: c.fechaAtencion,
      estado: c.estado,
      cerradaEn: c.cerradaEn,
      motivoAnulacion: c.motivoAnulacion,
      profesional: c.profesional
        ? {
            id: c.profesional.id,
            nombreCompleto: `${c.profesional.nombre} ${c.profesional.apellido}`,
            email: c.profesional.email,
          }
        : null,
      anamnesis: {
        motivo: c.motivoConsulta,
        enfermedadActual: c.enfermedadActual,
      },
      signosVitales: {
        pesoKg: c.pesoKg ? Number(c.pesoKg) : null,
        tallaCm: c.tallaCm ? Number(c.tallaCm) : null,
        imc: c.imc ? Number(c.imc) : null,
        clasificacionImc: this.clasificarImc(c.imc ? Number(c.imc) : null),
        presionArterial:
          c.presionSistolica && c.presionDiastolica
            ? `${c.presionSistolica}/${c.presionDiastolica} mmHg`
            : null,
        presionSistolica: c.presionSistolica,
        presionDiastolica: c.presionDiastolica,
        frecuenciaCardiaca: c.frecuenciaCardiaca,
        frecuenciaRespiratoria: c.frecuenciaRespiratoria,
        temperatura: c.temperatura ? Number(c.temperatura) : null,
        saturacionOxigeno: c.saturacionOxigeno ? Number(c.saturacionOxigeno) : null,
      },
      examenFisico: c.examenFisico,
      notasEvolucion: c.notasEvolucion,
      diagnostico: {
        principal: c.diagnosticoPrincipal,
        codigoCie10: c.codigoCie10,
        secundarios: c.diagnosticosSecundarios,
      },
      tratamiento: {
        plan: c.planTratamiento,
        indicaciones: c.indicacionesGenerales,
      },
      proximoControl: c.proximoControl,
      citaOrigen: c.cita
        ? {
            id: c.cita.id,
            fechaHoraInicio: c.cita.fechaHoraInicio,
            estado: c.cita.estado,
            motivo: c.cita.motivo,
          }
        : null,
    }));

    return {
      paciente: {
        id: paciente.id,
        nombreCompleto: `${paciente.nombre} ${paciente.apellido}`,
        documentoIdentidad: paciente.documento_identidad,
        tipoDocumento: paciente.tipo_documento,
        edad: `${edadAnios} años`,
        genero: paciente.genero,
        contacto: {
          telefono: paciente.telefono,
          email: paciente.email,
        },
        alertasMedicas: {
          grupoSanguineo: paciente.grupo_sanguineo,
          tieneAlergias: Boolean(paciente.alergias && paciente.alergias.trim() !== ''),
          alergias: paciente.alergias,
          antecedentesMedicos: paciente.antecedentes_medicos,
          antecedentesFamiliares: paciente.antecedentes_familiares,
        },
      },
      estadisticas: {
        totalConsultasHistoricas: parseInt(statsConsultas[0]?.total_consultas ?? '0', 10),
        primeraAtencion: statsConsultas[0]?.primera_atencion ?? null,
        ultimaAtencion: statsConsultas[0]?.ultima_atencion ?? null,
        diagnosticosRecurrentes: diagnosticosFrecuentes.map((d: any) => ({
          codigoCie10: d.codigo_cie10,
          diagnostico: d.diagnostico_principal,
          atenciones: parseInt(d.cantidad, 10),
        })),
      },
      timeline,
      meta: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  }
}




