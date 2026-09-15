import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente, TipoDocumento, Genero } from './entities/paciente.entity.js';
import { CrearPacienteDto } from './dto/crear-paciente.dto.js';
import { ActualizarPacienteDto } from './dto/actualizar-paciente.dto.js';
import { FiltrosPacienteDto } from './dto/filtros-paciente.dto.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';

/**
 * Servicio de Pacientes (PacientesService).
 *
 * Encapsula la lógica de negocio para la gestión de pacientes:
 * - Aislamiento multi-tenant forzoso por `consultorioId`.
 * - Prevención de duplicación de documentos de identidad en el mismo consultorio.
 * - Validación de fechas y estados.
 */
@Injectable()
export class PacientesService {
  private readonly logger = new Logger(PacientesService.name);

  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  /**
   * Registra un nuevo paciente vinculado automáticamente al consultorio del usuario.
   */
  async crear(
    consultorioId: string,
    dto: CrearPacienteDto,
    usuarioSolicitante?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Paciente> {
    const docNormalizado = (dto.documentoIdentidad || dto.dni || '').trim() || null;
    const tipoDoc = dto.tipoDocumento || TipoDocumento.DNI;
    const genero = dto.genero || (dto.sexo as any) || Genero.FEMENINO;

    // 1. Verificamos duplicidad de documento solo dentro del mismo consultorio
    if (docNormalizado) {
      const existe = await this.pacienteRepo.findOne({
        where: {
          consultorioId,
          documentoIdentidad: docNormalizado,
        },
      });

      if (existe) {
        throw new ConflictException(
          `Ya existe un paciente con el documento de identidad "${docNormalizado}"`,
        );
      }
    }

    // 2. Instanciamos la entidad asignando el tenant validado por el JWT
    const { dni, sexo, ...resto } = dto;
    const nuevoPaciente = this.pacienteRepo.create({
      ...resto,
      nombre: dto.nombre.trim(),
      apellido: dto.apellido.trim(),
      tipoDocumento: tipoDoc,
      documentoIdentidad: docNormalizado,
      genero,
      alergias: dto.alergias ? dto.alergias.trim() : null,
      email: dto.email ? dto.email.toLowerCase().trim() : null,
      telefono: dto.telefono ? dto.telefono.trim() : null,
      fechaNacimiento: new Date(dto.fechaNacimiento),
      consultorioId, // ¡Aislamiento multi-tenant automático!
      activo: true,
    });

    const guardado = await this.pacienteRepo.save(nuevoPaciente);
    this.logger.log(`Paciente creado: ${guardado.nombre} ${guardado.apellido} (${guardado.id}) en consultorio ${consultorioId}`);

    const nombreUsuario = usuarioSolicitante
      ? `${usuarioSolicitante.nombre ?? ''} ${usuarioSolicitante.apellido ?? ''}`.trim() || usuarioSolicitante.email
      : 'Personal de la Clínica';

    await this.auditoriaService.registrar({
      consultorioId,
      usuarioId: usuarioSolicitante?.id ?? null,
      usuarioEmail: usuarioSolicitante?.email ?? 'personal',
      usuarioNombre: nombreUsuario,
      modulo: 'PACIENTES',
      accion: 'PACIENTE_CREAR',
      entidadTipo: 'Paciente',
      entidadId: guardado.id,
      detalles: {
        pacienteId: guardado.id,
        pacienteNombre: `${guardado.nombre} ${guardado.apellido}`.trim(),
        documentoIdentidad: guardado.documentoIdentidad,
        telefono: guardado.telefono,
        email: guardado.email,
        grupoSanguineo: guardado.grupoSanguineo,
      },
      ipAddress,
      userAgent,
    });

    return guardado;
  }

  /**
   * Obtiene la ficha de un paciente validando pertenencia al consultorio.
   */
  async obtenerPorId(consultorioId: string, id: string): Promise<Paciente> {
    const paciente = await this.pacienteRepo.findOne({
      where: { id, consultorioId },
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return paciente;
  }

  /**
   * Actualiza los datos de un paciente asegurando que pertenezca al consultorio activo.
   */
  async actualizar(
    consultorioId: string,
    id: string,
    dto: ActualizarPacienteDto,
    usuarioSolicitante?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Paciente> {
    const paciente = await this.obtenerPorId(consultorioId, id);

    // Si se actualiza el documento de identidad, validamos que no colisione con otro paciente
    const docInput = dto.documentoIdentidad !== undefined ? dto.documentoIdentidad : dto.dni;
    if (docInput !== undefined) {
      const docNormalizado = docInput ? docInput.trim() : null;

      if (docNormalizado && docNormalizado !== paciente.documentoIdentidad) {
        const duplicado = await this.pacienteRepo.findOne({
          where: {
            consultorioId,
            documentoIdentidad: docNormalizado,
          },
        });

        if (duplicado && duplicado.id !== id) {
          throw new ConflictException(
            `Ya existe otro paciente con el documento "${docNormalizado}"`,
          );
        }
      }
      paciente.documentoIdentidad = docNormalizado;
    }

    // Aplicamos los campos opcionales enviados
    if (dto.nombre !== undefined) paciente.nombre = dto.nombre.trim();
    if (dto.apellido !== undefined) paciente.apellido = dto.apellido.trim();
    if (dto.tipoDocumento !== undefined) paciente.tipoDocumento = dto.tipoDocumento;
    if (dto.fechaNacimiento !== undefined) paciente.fechaNacimiento = new Date(dto.fechaNacimiento);
    if (dto.genero !== undefined) paciente.genero = dto.genero;
    else if (dto.sexo !== undefined) paciente.genero = dto.sexo as any;
    if (dto.telefono !== undefined) paciente.telefono = dto.telefono ? dto.telefono.trim() : null;
    if (dto.email !== undefined) paciente.email = dto.email ? dto.email.toLowerCase().trim() : null;
    if (dto.direccion !== undefined) paciente.direccion = dto.direccion ? dto.direccion.trim() : null;
    if (dto.grupoSanguineo !== undefined) paciente.grupoSanguineo = dto.grupoSanguineo;
    if (dto.alergias !== undefined) paciente.alergias = dto.alergias ? dto.alergias.trim() : null;
    if (dto.antecedentesMedicos !== undefined) paciente.antecedentesMedicos = dto.antecedentesMedicos ? dto.antecedentesMedicos.trim() : null;
    if (dto.antecedentesFamiliares !== undefined) paciente.antecedentesFamiliares = dto.antecedentesFamiliares ? dto.antecedentesFamiliares.trim() : null;
    if (dto.contactoEmergenciaNombre !== undefined) paciente.contactoEmergenciaNombre = dto.contactoEmergenciaNombre ? dto.contactoEmergenciaNombre.trim() : null;
    if (dto.contactoEmergenciaTelefono !== undefined) paciente.contactoEmergenciaTelefono = dto.contactoEmergenciaTelefono ? dto.contactoEmergenciaTelefono.trim() : null;
    if (dto.activo !== undefined) paciente.activo = dto.activo;

    const actualizado = await this.pacienteRepo.save(paciente);
    this.logger.log(`Paciente actualizado: ${actualizado.id}`);

    const nombreUsuario = usuarioSolicitante
      ? `${usuarioSolicitante.nombre ?? ''} ${usuarioSolicitante.apellido ?? ''}`.trim() || usuarioSolicitante.email
      : 'Personal de la Clínica';

    await this.auditoriaService.registrar({
      consultorioId,
      usuarioId: usuarioSolicitante?.id ?? null,
      usuarioEmail: usuarioSolicitante?.email ?? 'personal',
      usuarioNombre: nombreUsuario,
      modulo: 'PACIENTES',
      accion: 'PACIENTE_ACTUALIZAR',
      entidadTipo: 'Paciente',
      entidadId: actualizado.id,
      detalles: {
        pacienteId: actualizado.id,
        pacienteNombre: `${actualizado.nombre} ${actualizado.apellido}`.trim(),
        documentoIdentidad: actualizado.documentoIdentidad,
        telefono: actualizado.telefono,
        email: actualizado.email,
        grupoSanguineo: actualizado.grupoSanguineo,
        alergias: actualizado.alergias,
        activo: actualizado.activo,
      },
      ipAddress,
      userAgent,
    });

    return actualizado;
  }

  /**
   * Lista los pacientes del consultorio aplicando búsqueda libre, filtros y paginación.
   */
  async listar(consultorioId: string, filtros: FiltrosPacienteDto) {
    const {
      termino,
      genero,
      grupoSanguineo,
      activo,
      pagina = 1,
      limite = 10,
      ordenarPor = 'apellido',
      direccion = 'ASC',
    } = filtros;

    const qb = this.pacienteRepo.createQueryBuilder('p')
      .where('p.consultorioId = :consultorioId', { consultorioId });

    // 1. Filtro por término de búsqueda (nombre, apellido, documento o teléfono)
    const busquedaEfectiva = (termino || filtros.busqueda || '').trim();
    if (busquedaEfectiva !== '') {
      qb.andWhere(
        '(LOWER(p.nombre) LIKE :term OR LOWER(p.apellido) LIKE :term OR LOWER(CONCAT(p.nombre, \' \', p.apellido)) LIKE :term OR p.documentoIdentidad LIKE :termDoc OR p.telefono LIKE :termDoc)',
        {
          term: `%${busquedaEfectiva.toLowerCase()}%`,
          termDoc: `%${busquedaEfectiva}%`,
        },
      );
    }

    // 2. Filtro por género
    if (genero) {
      qb.andWhere('p.genero = :genero', { genero });
    }

    // 3. Filtro por grupo sanguíneo
    if (grupoSanguineo) {
      qb.andWhere('p.grupoSanguineo = :grupoSanguineo', { grupoSanguineo });
    }

    // 4. Filtro por estado activo (si no se envía, busca activos por defecto)
    if (activo !== undefined) {
      qb.andWhere('p.activo = :activo', { activo });
    } else {
      qb.andWhere('p.activo = true');
    }

    // 5. Ordenamiento y Paginación
    const dirNormalizada = (direccion.toUpperCase() === 'DESC' ? 'DESC' : 'ASC') as 'ASC' | 'DESC';
    const campoColumna = `p.${ordenarPor}`;

    qb.orderBy(campoColumna, dirNormalizada)
      .skip((pagina - 1) * limite)
      .take(limite);

    const [datos, total] = await qb.getManyAndCount();

    return {
      datos,
      data: datos, // Alias compatible para vistas del frontend
      meta: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite) || 1,
      },
    };
  }

  /**
   * Genera la Ficha Clínica Integral 360° del paciente.
   * Procesa en tiempo real:
   * - Edad exacta (años, meses, días).
   * - Alertas clínicas visuales (alergias destacadas, grupo sanguíneo).
   * - Consolidación de contactos de emergencia.
   * - Resumen para futuras fases (citas, consultas, recetas).
   */
  async obtenerFichaCompleta(consultorioId: string, id: string) {
    const paciente = await this.obtenerPorId(consultorioId, id);

    const edadCalculada = this.calcularEdadDetallada(paciente.fechaNacimiento);

    return {
      paciente,
      edad: edadCalculada,
      alertasMedicas: {
        tieneAlergias: Boolean(paciente.alergias && paciente.alergias.trim() !== ''),
        alergias: paciente.alergias,
        grupoSanguineo: paciente.grupoSanguineo,
        tieneAntecedentesMedicos: Boolean(paciente.antecedentesMedicos && paciente.antecedentesMedicos.trim() !== ''),
        tieneAntecedentesFamiliares: Boolean(paciente.antecedentesFamiliares && paciente.antecedentesFamiliares.trim() !== ''),
      },
      contactoEmergencia: {
        nombre: paciente.contactoEmergenciaNombre,
        telefono: paciente.contactoEmergenciaTelefono,
        registrado: Boolean(paciente.contactoEmergenciaNombre || paciente.contactoEmergenciaTelefono),
      },
      resumenHistorial: {
        totalCitas: 0,       // Se conectará en la Fase 3
        totalConsultas: 0,   // Se conectará en la Fase 4
        totalRecetas: 0,     // Se conectará en la Fase 5
      },
    };
  }

  /**
   * Algoritmo de cálculo clínico de edad exacta.
   * Maneja variaciones de días de mes y años bisiestos.
   */
  private calcularEdadDetallada(fechaNacimiento: Date | string) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);

    let anios = hoy.getFullYear() - nacimiento.getFullYear();
    let meses = hoy.getMonth() - nacimiento.getMonth();
    let dias = hoy.getDate() - nacimiento.getDate();

    if (dias < 0) {
      meses -= 1;
      const diasEnMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
      dias += diasEnMesAnterior;
    }

    if (meses < 0) {
      anios -= 1;
      meses += 12;
    }

    let texto: string;
    if (anios === 0) {
      texto = meses === 0 ? `${dias} días` : `${meses} meses y ${dias} días`;
    } else {
      texto = meses > 0 ? `${anios} años y ${meses} meses` : `${anios} años`;
    }

    return { anios, meses, dias, texto };
  }
}
