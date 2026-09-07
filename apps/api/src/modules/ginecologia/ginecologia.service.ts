import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoriaGinecologica } from './entities/historia-ginecologica.entity.js';
import { Embarazo, EstadoEmbarazo } from './entities/embarazo.entity.js';
import { ControlPrenatal } from './entities/control-prenatal.entity.js';
import { Ecografia } from './entities/ecografia.entity.js';
import { Paciente } from '../pacientes/entities/paciente.entity.js';
import { Consulta } from '../consultas/entities/consulta.entity.js';
import { DocumentoClinico } from '../documentos/entities/documento-clinico.entity.js';
import { GuardarHistoriaGinecologicaDto } from './dto/historia-ginecologica.dto.js';
import {
  CrearEmbarazoDto,
  FinalizarEmbarazoDto,
} from './dto/crear-embarazo.dto.js';
import { CrearControlPrenatalDto } from './dto/crear-control-prenatal.dto.js';
import { CrearEcografiaDto } from './dto/crear-ecografia.dto.js';
import { CalculadoraObstetricaDto } from './dto/calculadora-obstetrica.dto.js';

/**
 * Servicio Especializado de Ginecología y Obstetricia.
 *
 * Módulo satélite desacoplado del núcleo con fórmulas obstétricas clínicas:
 * - Regla de Naegele para Fecha Probable de Parto (FPP).
 * - Cálculo continuo de edad gestacional y amenorrea.
 * - Vigilancia de preeclampsia y curva de altura uterina (AU).
 * - Biometría fetal ecográfica (fórmula de Hadlock).
 * - Aislamiento multi-tenant ciego (HTTP 404 ante accesos no autorizados).
 */
@Injectable()
export class GinecologiaService {
  private readonly logger = new Logger(GinecologiaService.name);

  constructor(
    @InjectRepository(HistoriaGinecologica)
    private readonly historiaRepo: Repository<HistoriaGinecologica>,

    @InjectRepository(Embarazo)
    private readonly embarazoRepo: Repository<Embarazo>,

    @InjectRepository(ControlPrenatal)
    private readonly controlRepo: Repository<ControlPrenatal>,

    @InjectRepository(Ecografia)
    private readonly ecografiaRepo: Repository<Ecografia>,

    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,

    @InjectRepository(Consulta)
    private readonly consultaRepo: Repository<Consulta>,

    @InjectRepository(DocumentoClinico)
    private readonly documentoRepo: Repository<DocumentoClinico>,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. HISTORIA GINECOLÓGICA (Tarea 26)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene la historia ginecológica basal de una paciente.
   */
  async obtenerHistoriaGinecologica(
    consultorioId: string,
    pacienteId: string,
  ): Promise<HistoriaGinecologica | null> {
    await this.validarPaciente(consultorioId, pacienteId);

    return this.historiaRepo.findOne({
      where: { consultorioId, pacienteId },
      relations: { paciente: true },
    });
  }

  /**
   * Crea o actualiza la historia ginecológica y calcula la fórmula obstétrica GPCA.
   */
  async guardarHistoriaGinecologica(
    consultorioId: string,
    pacienteId: string,
    dto: GuardarHistoriaGinecologicaDto,
  ): Promise<HistoriaGinecologica> {
    const paciente = await this.validarPaciente(consultorioId, pacienteId);

    let historia = await this.historiaRepo.findOne({
      where: { consultorioId, pacienteId },
    });

    const gestas = dto.gestas ?? historia?.gestas ?? 0;
    const partos = dto.partos ?? historia?.partos ?? 0;
    const cesareas = dto.cesareas ?? historia?.cesareas ?? 0;
    const abortos = dto.abortos ?? historia?.abortos ?? 0;
    const ectopicos = dto.ectopicos ?? historia?.ectopicos ?? 0;

    let formula = `G${gestas} P${partos} C${cesareas} A${abortos}`;
    if (ectopicos > 0) {
      formula += ` E${ectopicos}`;
    }

    if (!historia) {
      historia = this.historiaRepo.create({
        consultorioId,
        pacienteId,
        ...dto,
        gestas,
        partos,
        cesareas,
        abortos,
        ectopicos,
        formulaObstetrica: formula,
      });
    } else {
      Object.assign(historia, dto, {
        gestas,
        partos,
        cesareas,
        abortos,
        ectopicos,
        formulaObstetrica: formula,
      });
    }

    const guardada = await this.historiaRepo.save(historia);
    this.logger.log(
      `Historia ginecológica actualizada para paciente ${paciente.nombre} ${paciente.apellido} (${formula})`,
    );

    return guardada;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. EMBARAZOS Y ALGORITMOS OBSTÉTRICOS (Tareas 27 y 28)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Registra un nuevo episodio de embarazo calculando la FPP mediante Regla de Naegele.
   */
  async crearEmbarazo(
    consultorioId: string,
    profesionalIdAutenticado: string,
    dto: CrearEmbarazoDto,
  ): Promise<Embarazo> {
    const paciente = await this.validarPaciente(consultorioId, dto.pacienteId);

    // 1. Calcular FPP según Regla de Naegele: FUR + 7 días - 3 meses + 1 año (+280 días)
    const fechaFur = new Date(dto.fur);
    const fppCalculada = new Date(fechaFur.getTime() + 280 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // 2. Calcular IMC pregestacional si se envían peso y talla
    let imcPregestacional: number | null = null;
    if (dto.pesoPregestacionalKg && dto.tallaCm) {
      const tallaMetros = dto.tallaCm / 100;
      imcPregestacional = Number(
        (dto.pesoPregestacionalKg / (tallaMetros * tallaMetros)).toFixed(2),
      );
    }

    const profesionalId = dto.profesionalId || profesionalIdAutenticado;

    // 3. Crear registro del embarazo
    const nuevoEmbarazo = this.embarazoRepo.create({
      consultorioId,
      pacienteId: dto.pacienteId,
      profesionalId,
      gravidezNumero: dto.gravidezNumero || 1,
      estado: EstadoEmbarazo.ACTIVO,
      tipoEmbarazo: dto.tipoEmbarazo,
      fur: dto.fur,
      furConfiable: dto.furConfiable ?? true,
      fpp: fppCalculada,
      fppEcoPrecoz: dto.fppEcoPrecoz || null,
      grupoSanguineo: dto.grupoSanguineo || null,
      factorRh: dto.factorRh || null,
      sensibilizadaRh: dto.sensibilizadaRh ?? false,
      pesoPregestacionalKg: dto.pesoPregestacionalKg || null,
      tallaCm: dto.tallaCm || null,
      imcPregestacional,
      observaciones: dto.observaciones || null,
    });

    const guardado = await this.embarazoRepo.save(nuevoEmbarazo);

    // 4. Actualizar automáticamente gestas en la historia ginecológica si existe
    const historia = await this.historiaRepo.findOne({
      where: { consultorioId, pacienteId: dto.pacienteId },
    });
    if (historia) {
      historia.gestas += 1;
      historia.formulaObstetrica = `G${historia.gestas} P${historia.partos} C${historia.cesareas} A${historia.abortos}`;
      await this.historiaRepo.save(historia);
    }

    this.logger.log(
      `Embarazo aperturado [${guardado.id}] para paciente ${paciente.nombre} ${paciente.apellido}. FPP: ${fppCalculada}`,
    );

    return this.obtenerEmbarazoPorId(consultorioId, guardado.id);
  }

  /**
   * Lista todos los embarazos (activos y concluidos) de una paciente.
   */
  async listarEmbarazosPorPaciente(
    consultorioId: string,
    pacienteId: string,
  ): Promise<Embarazo[]> {
    await this.validarPaciente(consultorioId, pacienteId);

    return this.embarazoRepo.find({
      where: { consultorioId, pacienteId },
      order: { creadoEn: 'DESC' },
    });
  }

  /**
   * Obtiene el embarazo actualmente activo con cálculo dinámico de edad gestacional hoy.
   */
  async obtenerEmbarazoActivo(
    consultorioId: string,
    pacienteId: string,
  ) {
    await this.validarPaciente(consultorioId, pacienteId);

    const embarazo = await this.embarazoRepo.findOne({
      where: {
        consultorioId,
        pacienteId,
        estado: EstadoEmbarazo.ACTIVO,
      },
      relations: { profesional: true, paciente: true },
    });

    if (!embarazo) {
      return null;
    }

    // Cálculo dinámico de edad gestacional hoy
    const params = this.calcularParametrosObstetricos({ fur: embarazo.fur });

    return {
      embarazo,
      calculoObstetricoHoy: params,
    };
  }

  /**
   * Obtiene el detalle de un embarazo por ID con blind isolation.
   */
  async obtenerEmbarazoPorId(
    consultorioId: string,
    id: string,
  ): Promise<Embarazo> {
    const embarazo = await this.embarazoRepo.findOne({
      where: { id, consultorioId },
      relations: {
        paciente: true,
        profesional: true,
      },
    });

    if (!embarazo) {
      throw new NotFoundException('Expediente de embarazo no encontrado');
    }

    return embarazo;
  }

  /**
   * Finaliza formalmente un embarazo registrando el desenlace y actualizando la paridad.
   */
  async finalizarEmbarazo(
    consultorioId: string,
    id: string,
    dto: FinalizarEmbarazoDto,
  ): Promise<Embarazo> {
    const embarazo = await this.obtenerEmbarazoPorId(consultorioId, id);

    if (embarazo.estado !== EstadoEmbarazo.ACTIVO) {
      throw new BadRequestException('El embarazo ya se encuentra finalizado');
    }

    embarazo.estado = dto.estado;
    embarazo.fechaTermino = dto.fechaTermino;
    embarazo.desenlaceDetalles = dto.desenlaceDetalles;

    const actualizado = await this.embarazoRepo.save(embarazo);

    // Actualizar paridad en la historia ginecológica
    const historia = await this.historiaRepo.findOne({
      where: { consultorioId, pacienteId: embarazo.pacienteId },
    });
    if (historia) {
      if (dto.estado === EstadoEmbarazo.FINALIZADO_PARTO) historia.partos += 1;
      if (dto.estado === EstadoEmbarazo.FINALIZADO_CESAREA) historia.cesareas += 1;
      if (dto.estado === EstadoEmbarazo.FINALIZADO_ABORTO) historia.abortos += 1;

      historia.formulaObstetrica = `G${historia.gestas} P${historia.partos} C${historia.cesareas} A${historia.abortos}`;
      await this.historiaRepo.save(historia);
    }

    this.logger.log(`Embarazo [${id}] finalizado con estado ${dto.estado}`);
    return actualizado;
  }

  /**
   * Calculadora obstétrica clínica (Regla de Naegele, edad gestacional y cronograma).
   */
  calcularParametrosObstetricos(dto: CalculadoraObstetricaDto) {
    const { fur, fechaReferencia, cicloDias = 28 } = dto;

    const fechaFur = new Date(fur);
    const fechaRef = fechaReferencia ? new Date(fechaReferencia) : new Date();

    // Ajuste Naegele por duración del ciclo: (cicloDias - 28)
    const ajusteDiasCiclo = cicloDias - 28;
    const diasTotalesFpp = 280 + ajusteDiasCiclo;

    const fppDate = new Date(fechaFur.getTime() + diasTotalesFpp * 24 * 60 * 60 * 1000);
    const fppStr = fppDate.toISOString().split('T')[0];

    // Días de gestación a la fecha de referencia
    const diferenciaMs = fechaRef.getTime() - fechaFur.getTime();
    const diasGestacion = Math.max(0, Math.floor(diferenciaMs / (1000 * 60 * 60 * 24)));

    const semanas = Math.floor(diasGestacion / 7);
    const dias = diasGestacion % 7;

    // Clasificación de trimestre
    let trimestre = '1° Trimestre';
    if (semanas >= 28) {
      trimestre = '3° Trimestre';
    } else if (semanas >= 14) {
      trimestre = '2° Trimestre';
    }

    // Días restantes para el parto
    const diasParaElParto = Math.max(
      0,
      Math.floor((fppDate.getTime() - fechaRef.getTime()) / (1000 * 60 * 60 * 24)),
    );

    return {
      fur,
      fpp: fppStr,
      edadGestacionalTexto: `${semanas}.${dias} semanas`,
      edadGestacionalSemanas: semanas,
      edadGestacionalDias: dias,
      diasAmenorreaTotales: diasGestacion,
      trimestre,
      diasParaElParto,
      cronogramaEstudiosRecomendados: [
        { semanas: '6 - 8', estudio: 'Ecografía transvaginal precoz (vitalidad embrionaria y LCN)' },
        { semanas: '11 - 13.6', estudio: 'Screening de primer trimestre (Translucencia nucal y ductus)' },
        { semanas: '20 - 24', estudio: 'Ecografía morfológica de segundo trimestre (anatomía fetal de órganos)' },
        { semanas: '24 - 28', estudio: 'Test de O’Sullivan / Prueba de tolerancia a la glucosa' },
        { semanas: '32 - 36', estudio: 'Ecografía de crecimiento y estimación de peso fetal Hadlock' },
        { semanas: '35 - 37', estudio: 'Cultivo vaginal-rectal para Estreptococo Grupo B (SGB)' },
      ],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. CONTROLES PRENATALES (Tarea 29)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Registra un control prenatal calculando automáticamente el correlativo y ganancia ponderal.
   */
  async crearControlPrenatal(
    consultorioId: string,
    profesionalIdAutenticado: string,
    dto: CrearControlPrenatalDto,
  ): Promise<ControlPrenatal> {
    await this.validarPaciente(consultorioId, dto.pacienteId);
    const embarazo = await this.obtenerEmbarazoPorId(consultorioId, dto.embarazoId);

    if (dto.consultaId) {
      const consulta = await this.consultaRepo.findOne({
        where: { id: dto.consultaId, consultorioId },
      });
      if (!consulta) {
        throw new NotFoundException('Consulta clínica no encontrada');
      }
    }

    // Correlativo del control dentro del embarazo
    const controlesPrevios = await this.controlRepo.count({
      where: { consultorioId, embarazoId: dto.embarazoId },
    });
    const numeroControl = controlesPrevios + 1;

    // Calcular edad gestacional si no se especificó
    let egSemanas = dto.edadGestacionalSemanas;
    let egDias = dto.edadGestacionalDias ?? 0;
    if (egSemanas === undefined) {
      const params = this.calcularParametrosObstetricos({
        fur: embarazo.fur,
        fechaReferencia: dto.fechaControl,
      });
      egSemanas = params.edadGestacionalSemanas;
      egDias = params.edadGestacionalDias;
    }

    // Ganancia de peso materna respecto al peso pregestacional
    let gananciaPesoKg: number | null = null;
    if (embarazo.pesoPregestacionalKg) {
      gananciaPesoKg = Number(
        (dto.pesoMaternoKg - Number(embarazo.pesoPregestacionalKg)).toFixed(2),
      );
    }

    const profesionalId = dto.profesionalId || profesionalIdAutenticado;

    const nuevoControl = this.controlRepo.create({
      consultorioId,
      embarazoId: dto.embarazoId,
      pacienteId: dto.pacienteId,
      consultaId: dto.consultaId || null,
      profesionalId,
      numeroControl,
      fechaControl: dto.fechaControl ? new Date(dto.fechaControl) : new Date(),
      edadGestacionalSemanas: egSemanas,
      edadGestacionalDias: egDias,
      pesoMaternoKg: dto.pesoMaternoKg,
      gananciaPesoKg,
      presionSistolica: dto.presionSistolica,
      presionDiastolica: dto.presionDiastolica,
      alturaUterinaCm: dto.alturaUterinaCm || null,
      frecuenciaCardiacaFetalLpm: dto.frecuenciaCardiacaFetalLpm || null,
      movimientosFetales: dto.movimientosFetales || null,
      presentacionFetal: dto.presentacionFetal,
      edema: dto.edema,
      proteinuria: dto.proteinuria || null,
      sintomasAlarma: dto.sintomasAlarma || null,
      indicaciones: dto.indicaciones || null,
      proximoControlFecha: dto.proximoControlFecha || null,
    });

    const guardado = await this.controlRepo.save(nuevoControl);
    this.logger.log(`Control prenatal #${numeroControl} registrado para embarazo [${dto.embarazoId}]`);

    return guardado;
  }

  /**
   * Obtiene la cronología de controles prenatales de un embarazo.
   */
  async listarControlesPorEmbarazo(
    consultorioId: string,
    embarazoId: string,
  ): Promise<ControlPrenatal[]> {
    await this.obtenerEmbarazoPorId(consultorioId, embarazoId);

    return this.controlRepo.find({
      where: { consultorioId, embarazoId },
      relations: { profesional: true },
      order: { numeroControl: 'ASC' },
    });
  }

  /**
   * Obtiene las series temporales para graficar curvas de crecimiento fetal (AU y peso).
   */
  async obtenerCurvaCrecimiento(consultorioId: string, embarazoId: string) {
    const embarazo = await this.obtenerEmbarazoPorId(consultorioId, embarazoId);
    const controles = await this.listarControlesPorEmbarazo(consultorioId, embarazoId);

    const puntosCurva = controles.map((c) => ({
      numeroControl: c.numeroControl,
      fecha: c.fechaControl,
      edadGestacional: `${c.edadGestacionalSemanas}.${c.edadGestacionalDias}`,
      semanas: c.edadGestacionalSemanas,
      pesoMaternoKg: Number(c.pesoMaternoKg),
      gananciaPesoKg: c.gananciaPesoKg ? Number(c.gananciaPesoKg) : null,
      presionArterial: `${c.presionSistolica}/${c.presionDiastolica}`,
      alturaUterinaCm: c.alturaUterinaCm,
      fcfLpm: c.frecuenciaCardiacaFetalLpm,
    }));

    return {
      embarazoId,
      pesoPregestacionalKg: embarazo.pesoPregestacionalKg,
      totalControles: controles.length,
      puntosCurva,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. ECOGRAFÍAS Y BIOMETRÍA HADLOCK (Tarea 30)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Registra un informe ecográfico con biometría fetal y estimación de Hadlock.
   */
  async crearEcografia(
    consultorioId: string,
    profesionalIdAutenticado: string,
    dto: CrearEcografiaDto,
  ): Promise<Ecografia> {
    await this.validarPaciente(consultorioId, dto.pacienteId);

    if (dto.embarazoId) {
      await this.obtenerEmbarazoPorId(consultorioId, dto.embarazoId);
    }

    if (dto.documentoId) {
      const doc = await this.documentoRepo.findOne({
        where: { id: dto.documentoId, consultorioId },
      });
      if (!doc) {
        throw new NotFoundException('Documento clínico adjunto no encontrado');
      }
    }

    // Cálculo automatizado de Hadlock si se tienen DBP, CC, CA, LF y no se envió PFE
    const bio = dto.biometriaFetal ? { ...dto.biometriaFetal } : null;
    if (bio && bio.dbpMm && bio.ccMm && bio.caMm && bio.lfMm && !bio.pfeGramos) {
      // Fórmula de Hadlock IV: log10(BW) = 1.3596 - 0.00386*(AC*FL) + 0.0064*HC + 0.061*BPD + 0.0424*AC + 0.174*FL
      // Todas las medidas en centímetros
      const bpdCm = bio.dbpMm / 10;
      const hcCm = bio.ccMm / 10;
      const acCm = bio.caMm / 10;
      const flCm = bio.lfMm / 10;

      const log10Bw =
        1.3596 -
        0.00386 * (acCm * flCm) +
        0.0064 * hcCm +
        0.061 * bpdCm +
        0.0424 * acCm +
        0.174 * flCm;

      const pesoGramos = Math.round(Math.pow(10, log10Bw));
      if (pesoGramos > 0 && pesoGramos < 7000) {
        bio.pfeGramos = pesoGramos;
      }
    }

    const profesionalId = dto.profesionalId || profesionalIdAutenticado;

    const nuevaEco = this.ecografiaRepo.create({
      consultorioId,
      pacienteId: dto.pacienteId,
      embarazoId: dto.embarazoId || null,
      consultaId: dto.consultaId || null,
      profesionalId,
      documentoId: dto.documentoId || null,
      tipoEcografia: dto.tipoEcografia,
      fechaEstudio: dto.fechaEstudio ? new Date(dto.fechaEstudio) : new Date(),
      edadGestacionalSemanas: dto.edadGestacionalSemanas || null,
      edadGestacionalDias: dto.edadGestacionalDias || null,
      biometriaFetal: bio,
      placentaLocalizacion: dto.placentaLocalizacion || null,
      placentaGrado: dto.placentaGrado !== undefined ? dto.placentaGrado : null,
      liquidoAmniotico: dto.liquidoAmniotico || null,
      ilaCm: dto.ilaCm || null,
      uteroMedidas: dto.uteroMedidas || null,
      endometrioGrosorMm: dto.endometrioGrosorMm || null,
      ovariosDetalles: dto.ovariosDetalles || null,
      conclusionDiagnostica: dto.conclusionDiagnostica,
      observaciones: dto.observaciones || null,
    });

    const guardada = await this.ecografiaRepo.save(nuevaEco);
    this.logger.log(`Ecografía [${guardada.id}] registrada: ${dto.tipoEcografia}`);

    return this.obtenerEcografiaPorId(consultorioId, guardada.id);
  }

  /**
   * Obtiene las ecografías de una paciente.
   */
  async listarEcografiasPorPaciente(
    consultorioId: string,
    pacienteId: string,
  ): Promise<Ecografia[]> {
    await this.validarPaciente(consultorioId, pacienteId);

    return this.ecografiaRepo.find({
      where: { consultorioId, pacienteId },
      relations: { profesional: true, documento: true },
      order: { fechaEstudio: 'DESC' },
    });
  }

  /**
   * Obtiene las ecografías asociadas a un embarazo.
   */
  async listarEcografiasPorEmbarazo(
    consultorioId: string,
    embarazoId: string,
  ): Promise<Ecografia[]> {
    await this.obtenerEmbarazoPorId(consultorioId, embarazoId);

    return this.ecografiaRepo.find({
      where: { consultorioId, embarazoId },
      relations: { profesional: true, documento: true },
      order: { fechaEstudio: 'ASC' },
    });
  }

  /**
   * Obtiene el informe ecográfico completo por ID con blind isolation.
   */
  async obtenerEcografiaPorId(
    consultorioId: string,
    id: string,
  ): Promise<Ecografia> {
    const eco = await this.ecografiaRepo.findOne({
      where: { id, consultorioId },
      relations: {
        paciente: true,
        profesional: true,
        embarazo: true,
        documento: true,
      },
    });

    if (!eco) {
      throw new NotFoundException('Informe ecográfico no encontrado');
    }

    return eco;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUXILIARES PRIVADOS
  // ═══════════════════════════════════════════════════════════════════════════

  private async validarPaciente(consultorioId: string, pacienteId: string): Promise<Paciente> {
    const paciente = await this.pacienteRepo.findOne({
      where: { id: pacienteId, consultorioId },
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return paciente;
  }
}
