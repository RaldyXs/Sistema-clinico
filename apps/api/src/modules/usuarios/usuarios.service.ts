import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { Usuario, RolUsuario } from './entities/usuario.entity.js';
import { Rol } from '../roles/entities/rol.entity.js';
import { Suscripcion } from '../saas/entities/suscripcion.entity.js';
import { CrearUsuarioDto } from './dto/crear-usuario.dto.js';
import { ActualizarUsuarioDto } from './dto/actualizar-usuario.dto.js';
import { FiltrosUsuariosDto } from './dto/filtros-usuario.dto.js';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,

    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,

    @InjectRepository(Suscripcion)
    private readonly suscripcionRepo: Repository<Suscripcion>,
  ) {}

  /**
   * Elimina el campo sensible passwordHash del objeto devuelto al cliente.
   */
  private sanitizarUsuario(usuario: Usuario): Omit<Usuario, 'passwordHash'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...sanitizado } = usuario;
    return sanitizado as Omit<Usuario, 'passwordHash'>;
  }

  /**
   * Crea un nuevo usuario (médico, recepcionista o personal asistencial)
   * vinculado estrictamente al consultorio del administrador solicitante.
   */
  async crear(consultorioId: string, dto: CrearUsuarioDto): Promise<Omit<Usuario, 'passwordHash'>> {
    const emailNormalizado = dto.email.trim().toLowerCase();

    // 1. Verificamos la cuota total de usuarios del plan de la clínica (incluye médicos, secretarias y personal)
    const suscripcion = await this.suscripcionRepo.findOne({
      where: { consultorioId },
      order: { creadoEn: 'DESC' },
      relations: { plan: true },
    });
    if (suscripcion?.plan) {
      const totalUsuariosActivos = await this.usuarioRepo.count({
        where: { consultorioId, activo: true },
      });
      if (totalUsuariosActivos >= suscripcion.plan.maxMedicos) {
        throw new BadRequestException(
          `Has alcanzado el límite total de usuarios permitidos (${suscripcion.plan.maxMedicos}) para tu ${suscripcion.plan.nombre}. Por favor, actualiza tu plan en Configuración para registrar más colaboradores.`,
        );
      }
    }

    // 2. Verificamos si el email ya existe en el sistema
    const existente = await this.usuarioRepo.findOne({
      where: { email: emailNormalizado },
    });

    if (existente) {
      throw new ConflictException(`El correo "${emailNormalizado}" ya se encuentra registrado`);
    }

    // 3. Regla de negocio: Solo puede existir un único Administrador por consultorio/clínica
    const rolSolicitado = dto.rolCodigo || RolUsuario.MEDICO;
    if (rolSolicitado === RolUsuario.ADMIN) {
      const adminExistente = await this.usuarioRepo.findOne({
        where: { consultorioId, rolCodigo: 'ADMIN' },
      });
      if (adminExistente) {
        throw new BadRequestException(
          'Ya existe un Administrador principal para este consultorio. Solo se permite un Administrador por clínica.',
        );
      }
    }

    // 4. Buscamos y vinculamos la entidad Rol correspondiente
    let rolEntidad: Rol | null = null;
    if (dto.rolId) {
      rolEntidad = await this.rolRepo.findOne({ where: { id: dto.rolId } });
    } else {
      const codigoBuscar =
        rolSolicitado === RolUsuario.MEDICO ? 'PROFESIONAL_SALUD' : rolSolicitado;
      rolEntidad = await this.rolRepo.findOne({ where: { codigo: codigoBuscar } });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const nuevoUsuario = this.usuarioRepo.create({
      consultorioId,
      email: emailNormalizado,
      passwordHash,
      nombre: dto.nombre.trim(),
      apellido: dto.apellido ? dto.apellido.trim() : null,
      rolCodigo: rolSolicitado,
      rolId: rolEntidad?.id || null,
      rol: rolEntidad || null,
      especialidad: dto.especialidad ? dto.especialidad.trim() : null,
      matriculaProfesional: dto.matriculaProfesional ? dto.matriculaProfesional.trim() : null,
      telefono: dto.telefono ? dto.telefono.trim() : null,
      activo: true,
    });

    const guardado = await this.usuarioRepo.save(nuevoUsuario);
    return this.sanitizarUsuario(guardado);
  }

  /**
   * Lista todos los usuarios pertenecientes al consultorio con filtros opcionales.
   */
  async listar(
    consultorioId: string,
    filtros?: FiltrosUsuariosDto,
  ): Promise<Omit<Usuario, 'passwordHash'>[]> {
    const qb = this.usuarioRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.rol', 'rol')
      .where('u.consultorio_id = :consultorioId', { consultorioId });

    if (filtros?.rolCodigo) {
      qb.andWhere('u.rol_codigo = :rolCodigo', { rolCodigo: filtros.rolCodigo });
    }

    if (filtros?.activo !== undefined) {
      qb.andWhere('u.activo = :activo', { activo: filtros.activo });
    }

    if (filtros?.especialidad) {
      qb.andWhere('u.especialidad ILIKE :especialidad', {
        especialidad: `%${filtros.especialidad.trim()}%`,
      });
    }

    if (filtros?.busqueda) {
      const termino = `%${filtros.busqueda.trim()}%`;
      qb.andWhere(
        '(u.nombre ILIKE :termino OR u.apellido ILIKE :termino OR u.email ILIKE :termino OR u.matricula_profesional ILIKE :termino)',
        { termino },
      );
    }

    qb.orderBy('u.nombre', 'ASC');

    const usuarios = await qb.getMany();
    return usuarios.map((u) => this.sanitizarUsuario(u));
  }

  /**
   * Devuelve la nómina de médicos y profesionales de la salud activos del consultorio.
   * Utilizado en la selección rápida de turnos y agendas.
   */
  async listarMedicos(consultorioId: string): Promise<Omit<Usuario, 'passwordHash'>[]> {
    const medicos = await this.usuarioRepo.find({
      where: {
        consultorioId,
        rolCodigo: RolUsuario.MEDICO,
        activo: true,
      },
      relations: {
        rol: true,
      },
      order: {
        nombre: 'ASC',
      },
    });

    return medicos.map((m) => this.sanitizarUsuario(m));
  }

  /**
   * Obtiene el perfil de un usuario con aislamiento multi-tenant estricto.
   * Si el usuario no existe o pertenece a otra clínica, responde 404 Not Found genérico.
   */
  async obtenerPorId(consultorioId: string, id: string): Promise<Omit<Usuario, 'passwordHash'>> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id, consultorioId },
      relations: { rol: true },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado`);
    }

    return this.sanitizarUsuario(usuario);
  }

  /**
   * Actualiza el perfil, especialidad, rol o credenciales de un usuario.
   */
  async actualizar(
    consultorioId: string,
    id: string,
    dto: ActualizarUsuarioDto,
  ): Promise<Omit<Usuario, 'passwordHash'>> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id, consultorioId },
      relations: { rol: true },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado`);
    }

    if (dto.nombre !== undefined) usuario.nombre = dto.nombre.trim();
    if (dto.apellido !== undefined) usuario.apellido = dto.apellido ? dto.apellido.trim() : null;
    if (dto.rolCodigo !== undefined) usuario.rolCodigo = dto.rolCodigo;
    if (dto.rolId !== undefined) usuario.rolId = dto.rolId;
    if (dto.especialidad !== undefined) usuario.especialidad = dto.especialidad ? dto.especialidad.trim() : null;
    if (dto.matriculaProfesional !== undefined) usuario.matriculaProfesional = dto.matriculaProfesional ? dto.matriculaProfesional.trim() : null;
    if (dto.telefono !== undefined) usuario.telefono = dto.telefono ? dto.telefono.trim() : null;
    if (dto.activo !== undefined) usuario.activo = dto.activo;

    if (dto.password) {
      const saltRounds = 10;
      usuario.passwordHash = await bcrypt.hash(dto.password, saltRounds);
    }

    const actualizado = await this.usuarioRepo.save(usuario);
    return this.sanitizarUsuario(actualizado);
  }

  /**
   * Activa o suspende el acceso de un usuario al consultorio.
   */
  async cambiarEstado(
    consultorioId: string,
    id: string,
    activo: boolean,
    usuarioSolicitanteId?: string,
  ): Promise<Omit<Usuario, 'passwordHash'>> {
    if (!activo && usuarioSolicitanteId && usuarioSolicitanteId === id) {
      throw new BadRequestException('No puedes suspender o desactivar tu propia cuenta de usuario.');
    }
    return this.actualizar(consultorioId, id, { activo });
  }
}
