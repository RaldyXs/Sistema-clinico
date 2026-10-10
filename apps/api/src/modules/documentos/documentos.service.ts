import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { DocumentoClinico } from './entities/documento-clinico.entity.js';
import { Paciente } from '../pacientes/entities/paciente.entity.js';
import { Consulta } from '../consultas/entities/consulta.entity.js';
import { AlmacenamientoService } from './services/almacenamiento.service.js';
import { SubirDocumentoDto } from './dto/subir-documento.dto.js';
import { FiltrosDocumentosDto } from './dto/filtros-documentos.dto.js';
import { ArchivoSubido } from './interfaces/archivo-subido.interface.js';

/**
 * Servicio de Gestión de Documentos y Estudios Clínicos.
 *
 * Responsabilidades:
 * - Aislamiento multi-tenant estricto: toda operación está restringida al `consultorioId`.
 * - Validación cruzada: garantiza que el paciente y la consulta pertenezcan al mismo consultorio.
 * - Almacenamiento seguro en disco y registro de auditoría en base de datos.
 * - Entrega de archivos para descarga protegida por JWT.
 */
@Injectable()
export class DocumentosService {
  private readonly logger = new Logger(DocumentosService.name);

  constructor(
    @InjectRepository(DocumentoClinico)
    private readonly docRepo: Repository<DocumentoClinico>,

    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,

    @InjectRepository(Consulta)
    private readonly consultaRepo: Repository<Consulta>,

    private readonly almacenamientoService: AlmacenamientoService,
  ) {}

  /**
   * Sube un archivo clínico físico y lo vincula al historial del paciente y/o consulta.
   */
  async subir(
    consultorioId: string,
    profesionalId: string,
    file: ArchivoSubido,
    dto: SubirDocumentoDto,
  ): Promise<DocumentoClinico> {
    // 1. Validar que el paciente pertenezca a la clínica
    const paciente = await this.pacienteRepo.findOne({
      where: { id: dto.pacienteId, consultorioId },
    });
    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // 2. Si se asocia a una consulta, validar su pertenencia a la clínica
    if (dto.consultaId) {
      const consulta = await this.consultaRepo.findOne({
        where: { id: dto.consultaId, consultorioId },
      });
      if (!consulta) {
        throw new NotFoundException('Consulta clínica no encontrada');
      }
    }

    // 3. Guardar físicamente el archivo en el almacenamiento del tenant
    const metadataArchivo = await this.almacenamientoService.guardarArchivo(
      consultorioId,
      file,
    );

    // 4. Crear el registro documental en base de datos
    const nuevoDocumento = this.docRepo.create({
      consultorioId,
      pacienteId: dto.pacienteId,
      consultaId: dto.consultaId || null,
      profesionalId,
      categoria: dto.categoria,
      nombreOriginal: metadataArchivo.nombreOriginal,
      nombreAlmacenado: metadataArchivo.nombreAlmacenado,
      mimeType: metadataArchivo.mimeType,
      pesoBytes: metadataArchivo.pesoBytes,
      hashSha256: metadataArchivo.hashSha256,
      rutaRelativa: metadataArchivo.rutaRelativa,
      descripcion: dto.descripcion || null,
      fechaDocumento: dto.fechaDocumento || null,
    });

    const guardado = await this.docRepo.save(nuevoDocumento);
    this.logger.log(`Documento clínico subido [${guardado.id}] para paciente ${paciente.nombre} ${paciente.apellido}`);

    return this.obtenerPorId(consultorioId, guardado.id);
  }

  /**
   * Obtiene la lista de documentos y exámenes de un paciente con filtros y paginación.
   */
  async listarPorPaciente(
    consultorioId: string,
    pacienteId: string,
    filtros: FiltrosDocumentosDto,
  ) {
    const paciente = await this.pacienteRepo.findOne({
      where: { id: pacienteId, consultorioId },
    });
    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const { categoria, pagina = 1, limite = 20 } = filtros;

    const qb = this.docRepo
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.profesional', 'profesional')
      .leftJoinAndSelect('doc.consulta', 'consulta')
      .where('doc.consultorioId = :consultorioId', { consultorioId })
      .andWhere('doc.pacienteId = :pacienteId', { pacienteId });

    if (categoria) {
      qb.andWhere('doc.categoria = :categoria', { categoria });
    }

    qb.orderBy('doc.creadoEn', 'DESC')
      .skip((pagina - 1) * limite)
      .take(limite);

    const [datos, total] = await qb.getManyAndCount();

    return {
      datos,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    };
  }

  /**
   * Obtiene la lista general de documentos y estudios de la clínica con filtros.
   */
  async listarTodos(
    consultorioId: string,
    filtros: FiltrosDocumentosDto,
  ) {
    const { categoria, pagina = 1, limite = 25 } = filtros;

    const qb = this.docRepo
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.paciente', 'paciente')
      .leftJoinAndSelect('doc.profesional', 'profesional')
      .where('doc.consultorioId = :consultorioId', { consultorioId });

    if (categoria) {
      qb.andWhere('doc.categoria = :categoria', { categoria });
    }

    qb.orderBy('doc.creadoEn', 'DESC')
      .skip((pagina - 1) * limite)
      .take(limite);

    const [datos, total] = await qb.getManyAndCount();

    return {
      datos,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    };
  }

  /**
   * Obtiene los documentos adjuntos a una consulta clínica específica.
   */
  async listarPorConsulta(consultorioId: string, consultaId: string) {
    const consulta = await this.consultaRepo.findOne({
      where: { id: consultaId, consultorioId },
    });
    if (!consulta) {
      throw new NotFoundException('Consulta clínica no encontrada');
    }

    return this.docRepo.find({
      where: { consultorioId, consultaId },
      relations: { profesional: true },
      order: { creadoEn: 'DESC' },
    });
  }

  /**
   * Obtiene los metadatos de un documento clínico por ID con aislamiento multi-tenant.
   */
  async obtenerPorId(consultorioId: string, id: string): Promise<DocumentoClinico> {
    const doc = await this.docRepo.findOne({
      where: { id, consultorioId },
      relations: {
        paciente: true,
        profesional: true,
        consulta: true,
      },
    });

    if (!doc) {
      throw new NotFoundException('Documento clínico no encontrado');
    }

    return doc;
  }

  /**
   * Prepara la descarga física de un archivo adjunto asegurando existencia y tenencia.
   */
  async descargar(consultorioId: string, id: string): Promise<{ rutaAbsoluta: string; documento: DocumentoClinico }> {
    const documento = await this.obtenerPorId(consultorioId, id);
    const rutaAbsoluta = this.almacenamientoService.obtenerRutaAbsoluta(documento.rutaRelativa);

    if (!fs.existsSync(rutaAbsoluta)) {
      throw new NotFoundException('El archivo físico no se encuentra disponible en el almacenamiento');
    }

    return { rutaAbsoluta, documento };
  }

  /**
   * Elimina un archivo adjunto tanto física como lógicamente.
   */
  async eliminar(consultorioId: string, id: string): Promise<{ mensaje: string }> {
    const documento = await this.obtenerPorId(consultorioId, id);

    await this.almacenamientoService.eliminarArchivo(documento.rutaRelativa);
    await this.docRepo.remove(documento);

    this.logger.log(`Documento clínico [${id}] eliminado exitosamente del consultorio ${consultorioId}`);
    return { mensaje: 'Documento eliminado exitosamente' };
  }
}
