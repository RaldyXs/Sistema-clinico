import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consultorio } from './entities/consultorio.entity.js';
import { ActualizarConsultorioDto } from './dto/actualizar-consultorio.dto.js';
import { ActualizarConfiguracionDto } from './dto/actualizar-configuracion.dto.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';

/**
 * Servicio de Consultorios (ConsultoriosService).
 *
 * Encargado de la gestión y configuración de la organización (tenant).
 */
@Injectable()
export class ConsultoriosService {
  constructor(
    @InjectRepository(Consultorio)
    private readonly consultorioRepo: Repository<Consultorio>,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  /**
   * Obtiene la información del consultorio por su ID.
   */
  async obtenerPorId(id: string): Promise<Consultorio> {
    const consultorio = await this.consultorioRepo.findOne({
      where: { id },
      relations: {
        usuarios: true,
      },
    });

    if (!consultorio) {
      throw new NotFoundException(`Consultorio con ID "${id}" no encontrado`);
    }

    return consultorio;
  }

  /**
   * Actualiza los datos de la organización/consultorio.
   */
  async actualizar(id: string, dto: ActualizarConsultorioDto): Promise<Consultorio> {
    const consultorio = await this.obtenerPorId(id);

    if (dto.nombre !== undefined) consultorio.nombre = dto.nombre.trim();
    if (dto.telefono !== undefined) consultorio.telefono = dto.telefono.trim();
    if (dto.direccion !== undefined) consultorio.direccion = dto.direccion.trim();

    return this.consultorioRepo.save(consultorio);
  }

  /**
   * Actualiza la configuración de identidad, colores de marca, horarios de apertura,
   * módulos activos y diseño de recetas del consultorio.
   */
  async actualizarConfiguracion(
    id: string,
    dto: ActualizarConfiguracionDto,
    usuarioSolicitante?: any,
  ): Promise<Consultorio> {
    const consultorio = await this.obtenerPorId(id);

    if (dto.nombre !== undefined) consultorio.nombre = dto.nombre.trim();
    if (dto.telefono !== undefined) consultorio.telefono = dto.telefono ? dto.telefono.trim() : null;
    if (dto.direccion !== undefined) consultorio.direccion = dto.direccion ? dto.direccion.trim() : null;
    if (dto.email !== undefined) consultorio.email = dto.email ? dto.email.trim().toLowerCase() : null;
    if (dto.logoUrl !== undefined) consultorio.logoUrl = dto.logoUrl ? dto.logoUrl.trim() : null;
    if (dto.colorPrimario !== undefined) consultorio.colorPrimario = dto.colorPrimario;
    if (dto.colorSecundario !== undefined) consultorio.colorSecundario = dto.colorSecundario;
    if (dto.horarioAtencion !== undefined) consultorio.horarioAtencion = dto.horarioAtencion;
    if (dto.modulosActivos !== undefined) {
      consultorio.modulosActivos = {
        ...consultorio.modulosActivos,
        ...dto.modulosActivos,
      };
    }
    if (dto.configuracionReceta !== undefined) {
      consultorio.configuracionReceta = {
        ...consultorio.configuracionReceta,
        ...dto.configuracionReceta,
      };
    }

    const guardado = await this.consultorioRepo.save(consultorio);

    await this.auditoriaService.registrar({
      consultorioId: id,
      usuarioId: usuarioSolicitante?.id ?? null,
      usuarioEmail: usuarioSolicitante?.email ?? 'admin',
      usuarioNombre: `${usuarioSolicitante?.nombre ?? ''} ${usuarioSolicitante?.apellido ?? ''}`.trim() || 'Administrador',
      modulo: 'CONFIGURACION',
      accion: 'CONFIGURACION_ACTUALIZAR',
      entidadTipo: 'Consultorio',
      entidadId: id,
      detalles: {
        nombre: guardado.nombre,
        telefono: guardado.telefono,
        direccion: guardado.direccion,
        colorPrimario: guardado.colorPrimario,
        modulosActivos: guardado.modulosActivos,
      },
    });

    return guardado;
  }
}
