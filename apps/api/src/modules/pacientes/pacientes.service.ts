import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from './entities/paciente.entity.js';
import { CrearPacienteDto } from './dto/crear-paciente.dto.js';
import { ActualizarPacienteDto } from './dto/actualizar-paciente.dto.js';

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
  ) {}

  /**
   * Registra un nuevo paciente vinculado automáticamente al consultorio del usuario.
   */
  async crear(consultorioId: string, dto: CrearPacienteDto): Promise<Paciente> {
    const docNormalizado = dto.documentoIdentidad ? dto.documentoIdentidad.trim() : null;

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
          `Ya existe un paciente con el documento de identidad "${docNormalizado}" registrado en su consultorio`,
        );
      }
    }

    // 2. Instanciamos la entidad asignando el tenant validado por el JWT
    const nuevoPaciente = this.pacienteRepo.create({
      ...dto,
      nombre: dto.nombre.trim(),
      apellido: dto.apellido.trim(),
      documentoIdentidad: docNormalizado,
      email: dto.email ? dto.email.toLowerCase().trim() : null,
      telefono: dto.telefono ? dto.telefono.trim() : null,
      fechaNacimiento: new Date(dto.fechaNacimiento),
      consultorioId, // ¡Aislamiento multi-tenant automático!
      activo: true,
    });

    const guardado = await this.pacienteRepo.save(nuevoPaciente);
    this.logger.log(`Paciente creado: ${guardado.nombre} ${guardado.apellido} (${guardado.id}) en consultorio ${consultorioId}`);
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
      throw new NotFoundException(`Paciente con ID "${id}" no encontrado en su consultorio`);
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
  ): Promise<Paciente> {
    const paciente = await this.obtenerPorId(consultorioId, id);

    // Si se actualiza el documento de identidad, validamos que no colisione con otro paciente
    if (dto.documentoIdentidad !== undefined) {
      const docNormalizado = dto.documentoIdentidad ? dto.documentoIdentidad.trim() : null;

      if (docNormalizado && docNormalizado !== paciente.documentoIdentidad) {
        const duplicado = await this.pacienteRepo.findOne({
          where: {
            consultorioId,
            documentoIdentidad: docNormalizado,
          },
        });

        if (duplicado && duplicado.id !== id) {
          throw new ConflictException(
            `Ya existe otro paciente con el documento "${docNormalizado}" en su consultorio`,
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
    return actualizado;
  }
}
