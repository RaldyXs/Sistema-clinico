import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consultorio } from './entities/consultorio.entity.js';
import { ActualizarConsultorioDto } from './dto/actualizar-consultorio.dto.js';

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
}
