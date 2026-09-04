import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Permiso } from './entities/permiso.entity.js';
import { Rol } from './entities/rol.entity.js';

/**
 * Catálogo de permisos iniciales del sistema.
 * Dividido entre el Núcleo SaaS (Core) y el Dominio Clínico.
 */
export const PERMISOS_INICIALES = [
  // Núcleo SaaS (Aplica a cualquier tipo de negocio)
  { codigo: 'usuarios:crear', nombre: 'Crear usuarios', modulo: 'CORE_USUARIOS', descripcion: 'Registrar nuevos colaboradores en la organización' },
  { codigo: 'usuarios:ver', nombre: 'Ver usuarios', modulo: 'CORE_USUARIOS', descripcion: 'Listar usuarios y profesionales del equipo' },
  { codigo: 'usuarios:editar', nombre: 'Editar usuarios', modulo: 'CORE_USUARIOS', descripcion: 'Modificar datos o roles de colaboradores' },
  { codigo: 'roles:gestionar', nombre: 'Gestionar roles', modulo: 'CORE_SEGURIDAD', descripcion: 'Crear y asignar roles y permisos personalizados' },
  { codigo: 'organizacion:editar', nombre: 'Editar organización', modulo: 'CORE_ORGANIZACION', descripcion: 'Configurar datos, teléfonos y dirección del consultorio' },

  // Dominio Clínico (Plantilla de Salud)
  { codigo: 'pacientes:crear', nombre: 'Crear pacientes', modulo: 'CLINICA_PACIENTES', descripcion: 'Registrar nuevos pacientes en el sistema' },
  { codigo: 'pacientes:ver', nombre: 'Ver pacientes', modulo: 'CLINICA_PACIENTES', descripcion: 'Consultar información personal y clínica de pacientes' },
  { codigo: 'pacientes:editar', nombre: 'Editar pacientes', modulo: 'CLINICA_PACIENTES', descripcion: 'Actualizar datos de filiación o contacto de pacientes' },
  { codigo: 'citas:ver', nombre: 'Ver citas y agenda', modulo: 'CLINICA_CITAS', descripcion: 'Consultar la agenda diaria y semanal de citas' },
  { codigo: 'citas:agendar', nombre: 'Agendar citas', modulo: 'CLINICA_CITAS', descripcion: 'Crear, agendar y reprogramar citas' },
  { codigo: 'citas:cancelar', nombre: 'Cancelar citas', modulo: 'CLINICA_CITAS', descripcion: 'Cancelar o registrar inasistencias a citas' },
  { codigo: 'consultas:crear', nombre: 'Crear consulta médica', modulo: 'CLINICA_CONSULTAS', descripcion: 'Registrar atención clínica, anamnesis y diagnóstico' },
  { codigo: 'consultas:ver', nombre: 'Ver historial clínico', modulo: 'CLINICA_CONSULTAS', descripcion: 'Revisar consultas previas del paciente' },
  { codigo: 'recetas:crear', nombre: 'Emitir recetas', modulo: 'CLINICA_RECETAS', descripcion: 'Generar recetas e indicaciones médicas' },
];

/**
 * Servicio de Roles y Permisos (RolesService).
 *
 * Implementa `OnModuleInit`:
 * Al arrancar la aplicación, se asegura automáticamente de que:
 * 1. Todos los permisos base existan en la tabla `permisos`.
 * 2. El rol universal `ADMIN` exista y tenga el 100% de los permisos.
 * 3. Las plantillas de roles operativos (Profesional de Salud, Recepción) estén creadas.
 */
@Injectable()
export class RolesService implements OnModuleInit {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(Permiso)
    private readonly permisoRepo: Repository<Permiso>,

    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,
  ) {}

  /**
   * Se ejecuta automáticamente al arrancar NestJS.
   * Inicializa los cimientos de seguridad sin requerir scripts SQL manuales.
   */
  async onModuleInit() {
    await this.inicializarPermisos();
    await this.inicializarRolesPorDefecto();
  }

  private async inicializarPermisos(): Promise<void> {
    for (const def of PERMISOS_INICIALES) {
      const existe = await this.permisoRepo.findOne({ where: { codigo: def.codigo } });
      if (!existe) {
        const nuevo = this.permisoRepo.create(def);
        await this.permisoRepo.save(nuevo);
      }
    }
    this.logger.log('Permisos del sistema inicializados correctamente');
  }

  private async inicializarRolesPorDefecto(): Promise<void> {
    const todosLosPermisos = await this.permisoRepo.find();

    // 1. Rol Universal del Núcleo: ADMIN (Tiene todos los permisos)
    let rolAdmin = await this.rolRepo.findOne({ where: { codigo: 'ADMIN', consultorioId: IsNull() } });
    if (!rolAdmin) {
      rolAdmin = this.rolRepo.create({
        codigo: 'ADMIN',
        nombre: 'Administrador de Organización',
        descripcion: 'Acceso total a la administración de la cuenta, usuarios y módulos',
        esSistema: true,
        consultorioId: null, // Rol global
        permisos: todosLosPermisos,
      });
      await this.rolRepo.save(rolAdmin);
      this.logger.log('Rol universal ADMIN creado con todos los permisos');
    }

    // 2. Plantilla de Dominio: PROFESIONAL_SALUD (Médicos, Odontólogos, Especialistas)
    let rolProfesional = await this.rolRepo.findOne({ where: { codigo: 'PROFESIONAL_SALUD', consultorioId: IsNull() } });
    if (!rolProfesional) {
      const permisosSalud = todosLosPermisos.filter(p =>
        p.codigo.startsWith('pacientes:') ||
        p.codigo.startsWith('citas:') ||
        p.codigo.startsWith('consultas:') ||
        p.codigo.startsWith('recetas:')
      );

      rolProfesional = this.rolRepo.create({
        codigo: 'PROFESIONAL_SALUD',
        nombre: 'Profesional de la Salud',
        descripcion: 'Atención de pacientes, agenda de citas, consultas y recetas',
        esSistema: true,
        consultorioId: null,
        permisos: permisosSalud,
      });
      await this.rolRepo.save(rolProfesional);
      this.logger.log('Rol plantilla PROFESIONAL_SALUD creado');
    }

    // 3. Plantilla de Dominio: RECEPCION (Secretaría / Asistentes)
    let rolRecepcion = await this.rolRepo.findOne({ where: { codigo: 'RECEPCION', consultorioId: IsNull() } });
    if (!rolRecepcion) {
      const permisosRecepcion = todosLosPermisos.filter(p =>
        p.codigo.startsWith('pacientes:') ||
        p.codigo.startsWith('citas:')
      );

      rolRecepcion = this.rolRepo.create({
        codigo: 'RECEPCION',
        nombre: 'Recepción y Asistencia',
        descripcion: 'Gestión de citas y registro de pacientes',
        esSistema: true,
        consultorioId: null,
        permisos: permisosRecepcion,
      });
      await this.rolRepo.save(rolRecepcion);
      this.logger.log('Rol plantilla RECEPCION creado');
    }
  }

  /**
   * Obtiene los roles disponibles para un consultorio (roles globales + personalizados).
   */
  async listarRoles(consultorioId?: string): Promise<Rol[]> {
    const qb = this.rolRepo.createQueryBuilder('rol')
      .leftJoinAndSelect('rol.permisos', 'permiso');

    if (consultorioId) {
      qb.where('rol.consultorioId IS NULL OR rol.consultorioId = :consultorioId', { consultorioId });
    } else {
      qb.where('rol.consultorioId IS NULL');
    }

    return qb.getMany();
  }

  /**
   * Obtiene todos los permisos del sistema agrupados por módulo.
   */
  async listarPermisos(): Promise<Permiso[]> {
    return this.permisoRepo.find({ order: { modulo: 'ASC', codigo: 'ASC' } });
  }

  /**
   * Busca un rol por su código (ej. 'ADMIN').
   */
  async buscarPorCodigo(codigo: string): Promise<Rol | null> {
    return this.rolRepo.findOne({ where: { codigo } });
  }
}
