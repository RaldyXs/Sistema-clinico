import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receta, EstadoReceta } from './entities/receta.entity.js';
import { Paciente } from '../pacientes/entities/paciente.entity.js';
import { Consulta } from '../consultas/entities/consulta.entity.js';
import { Consultorio } from '../consultorios/entities/consultorio.entity.js';
import { CrearRecetaDto } from './dto/crear-receta.dto.js';
import { FiltrosRecetasDto } from './dto/filtros-recetas.dto.js';
import { AnularRecetaDto } from './dto/anular-receta.dto.js';
import { RecetasPdfService } from './services/recetas-pdf.service.js';

/**
 * Servicio de Negocio del Módulo de Recetas y Prescripciones Médicas.
 *
 * Responsabilidades:
 * - Aislamiento multi-tenant ciego ("blind isolation"): 404 ante accesos no autorizados.
 * - Generación de folio correlativo único por clínica y por año (`REC-YYYY-000001`).
 * - Emisión, listado paginado, búsqueda y anulación asistencial justificada.
 * - Coordinación con `RecetasPdfService` para entrega de documentos oficiales en PDF.
 */
@Injectable()
export class RecetasService {
  private readonly logger = new Logger(RecetasService.name);

  constructor(
    @InjectRepository(Receta)
    private readonly recetaRepo: Repository<Receta>,

    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,

    @InjectRepository(Consulta)
    private readonly consultaRepo: Repository<Consulta>,

    @InjectRepository(Consultorio)
    private readonly consultorioRepo: Repository<Consultorio>,

    private readonly recetasPdfService: RecetasPdfService,
  ) {}

  /**
   * Emite una nueva receta médica con folio consecutivo garantizado por consultorio.
   */
  async crear(
    consultorioId: string,
    profesionalIdAutenticado: string,
    dto: CrearRecetaDto,
  ): Promise<Receta> {
    // 1. Validar que el paciente exista dentro del consultorio
    const paciente = await this.pacienteRepo.findOne({
      where: { id: dto.pacienteId, consultorioId },
    });
    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // 2. Si se vincula a una consulta, validar su pertenencia al consultorio
    if (dto.consultaId) {
      const consulta = await this.consultaRepo.findOne({
        where: { id: dto.consultaId, consultorioId },
      });
      if (!consulta) {
        throw new NotFoundException('Consulta clínica no encontrada');
      }
    }

    const profesionalId = dto.profesionalId || profesionalIdAutenticado;

    // 3. Generar folio correlativo único por clínica para el año en curso
    const numeroReceta = await this.generarSiguienteNumeroReceta(consultorioId);

    // 4. Crear y guardar la receta médica
    const nuevaReceta = this.recetaRepo.create({
      consultorioId,
      pacienteId: dto.pacienteId,
      profesionalId,
      consultaId: dto.consultaId || null,
      numeroReceta,
      fechaEmision: dto.fechaEmision ? new Date(dto.fechaEmision) : new Date(),
      fechaVencimiento: dto.fechaVencimiento || null,
      estado: EstadoReceta.EMITIDA,
      diagnosticoReferencia: dto.diagnosticoReferencia || null,
      medicamentos: dto.medicamentos,
      indicacionesGenerales: dto.indicacionesGenerales || null,
    });

    const guardada = await this.recetaRepo.save(nuevaReceta);
    const nombrePaciente = [paciente.nombre, paciente.apellido].filter(Boolean).join(' ');
    this.logger.log(`Receta médica ${numeroReceta} emitida exitosamente para paciente ${nombrePaciente}`);

    return this.obtenerPorId(consultorioId, guardada.id);
  }

  /**
   * Obtiene el listado paginado y filtrado de recetas del consultorio.
   */
  async listar(consultorioId: string, filtros: FiltrosRecetasDto) {
    const {
      pacienteId,
      profesionalId,
      estado,
      desde,
      hasta,
      pagina = 1,
      limite = 10,
    } = filtros;

    const qb = this.recetaRepo
      .createQueryBuilder('receta')
      .leftJoinAndSelect('receta.paciente', 'paciente')
      .leftJoinAndSelect('receta.profesional', 'profesional')
      .where('receta.consultorioId = :consultorioId', { consultorioId });

    if (pacienteId) {
      qb.andWhere('receta.pacienteId = :pacienteId', { pacienteId });
    }

    if (profesionalId) {
      qb.andWhere('receta.profesionalId = :profesionalId', { profesionalId });
    }

    if (estado) {
      qb.andWhere('receta.estado = :estado', { estado });
    }

    if (desde) {
      qb.andWhere('receta.fechaEmision >= :desde', { desde });
    }

    if (hasta) {
      qb.andWhere('receta.fechaEmision <= :hasta', { hasta });
    }

    qb.orderBy('receta.fechaEmision', 'DESC')
      .skip((pagina - 1) * limite)
      .take(limite);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    };
  }

  /**
   * Obtiene una receta médica por su ID con todas sus relaciones, garantizando aislamiento multi-tenant.
   */
  async obtenerPorId(consultorioId: string, id: string): Promise<Receta> {
    const receta = await this.recetaRepo.findOne({
      where: { id, consultorioId },
      relations: {
        paciente: true,
        profesional: true,
        consulta: true,
        consultorio: true,
      },
    });

    if (!receta) {
      throw new NotFoundException('Receta médica no encontrada');
    }

    return receta;
  }

  /**
   * Invalida formalmente una receta médica con motivo clínico justificado.
   */
  async anular(consultorioId: string, id: string, dto: AnularRecetaDto): Promise<Receta> {
    const receta = await this.obtenerPorId(consultorioId, id);

    if (receta.estado === EstadoReceta.ANULADA) {
      throw new BadRequestException('La receta médica ya se encuentra anulada');
    }

    receta.estado = EstadoReceta.ANULADA;
    receta.motivoAnulacion = dto.motivoAnulacion;

    await this.recetaRepo.save(receta);
    this.logger.log(`Receta ${receta.numeroReceta} anulada. Motivo: ${dto.motivoAnulacion}`);

    return receta;
  }

  /**
   * Genera el documento PDF oficial de la receta médica solicitada.
   */
  async generarPdf(consultorioId: string, id: string): Promise<{ buffer: Buffer; receta: Receta }> {
    const receta = await this.obtenerPorId(consultorioId, id);
    const buffer = await this.recetasPdfService.generarPdf(receta);
    return { buffer, receta };
  }

  /**
   * Calcula el siguiente número correlativo de folio para la clínica.
   * Formato estándar: REC-YYYY-000001
   */
  private async generarSiguienteNumeroReceta(consultorioId: string): Promise<string> {
    const añoActual = new Date().getFullYear();
    const patron = `REC-${añoActual}-%`;

    const ultimaReceta = await this.recetaRepo
      .createQueryBuilder('receta')
      .where('receta.consultorioId = :consultorioId', { consultorioId })
      .andWhere('receta.numeroReceta LIKE :patron', { patron })
      .orderBy('receta.numeroReceta', 'DESC')
      .getOne();

    let siguienteNumero = 1;
    if (ultimaReceta) {
      const partes = ultimaReceta.numeroReceta.split('-');
      if (partes.length === 3) {
        const correlativoAnterior = parseInt(partes[2], 10);
        if (!isNaN(correlativoAnterior)) {
          siguienteNumero = correlativoAnterior + 1;
        }
      }
    }

    const correlativo = String(siguienteNumero).padStart(6, '0');
    return `REC-${añoActual}-${correlativo}`;
  }
}
