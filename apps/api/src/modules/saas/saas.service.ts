import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { Plan } from './entities/plan.entity.js';
import { Suscripcion, EstadoSuscripcion } from './entities/suscripcion.entity.js';
import { SolicitudPlan, EstadoSolicitudPlan } from './entities/solicitud-plan.entity.js';
import { Consultorio } from '../consultorios/entities/consultorio.entity.js';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import { Rol } from '../roles/entities/rol.entity.js';
import { Paciente } from '../pacientes/entities/paciente.entity.js';
import { Consulta } from '../consultas/entities/consulta.entity.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import {
  OnboardingDto,
  CambiarPlanDto,
  CambiarEstadoTenantDto,
  SolicitarPlanDto,
} from './dto/saas.dto.js';

@Injectable()
export class SaasService implements OnModuleInit {
  private readonly logger = new Logger(SaasService.name);

  constructor(
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,

    @InjectRepository(Suscripcion)
    private readonly suscripcionRepo: Repository<Suscripcion>,

    @InjectRepository(SolicitudPlan)
    private readonly solicitudPlanRepo: Repository<SolicitudPlan>,

    @InjectRepository(Consultorio)
    private readonly consultorioRepo: Repository<Consultorio>,

    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,

    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,

    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,

    @InjectRepository(Consulta)
    private readonly consultaRepo: Repository<Consulta>,

    private readonly jwtService: JwtService,
    private readonly auditoriaService: AuditoriaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Asegura que los planes estándar SaaS y la cuenta SuperAdmin existan al iniciar el módulo.
   */
  async onModuleInit() {
    await this.seedPlanesIniciales();
    await this.seedSuperAdminInicial();
  }

  /**
   * Sembrado de la organización matriz y cuenta maestra de SuperAdmin de la plataforma SaaS.
   */
  async seedSuperAdminInicial() {
    // En producción, no ejecutar seeds automáticos
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      return;
    }

    const superAdminEmail = this.configService.get<string>('SUPERADMIN_EMAIL', 'superadmin@saas.com');
    const existe = await this.usuarioRepo.findOne({ where: { email: superAdminEmail } });
    if (existe) return;

    this.logger.log('Sembrando organización matriz y cuenta SuperAdmin de la plataforma SaaS...');

    // 1. Buscamos o creamos el consultorio matriz
    let matriz = await this.consultorioRepo.findOne({ where: { nombre: 'Plataforma SaaS Global' } });
    if (!matriz) {
      matriz = this.consultorioRepo.create({
        nombre: 'Plataforma SaaS Global',
        email: 'soporte@saas.com',
        telefono: '+1 (800) 555-SAAS',
        direccion: 'Sede Central Operativa',
        activo: true,
        modulosActivos: {
          general: true,
          recetas: true,
          documentos: true,
          ginecologia: true,
          reportes: true,
          auditoria: true,
          saas: true,
        },
      });
      matriz = await this.consultorioRepo.save(matriz);
    }

    // 2. Buscamos o creamos el rol global SUPERADMIN
    let rolSuperAdmin = await this.rolRepo.findOne({ where: { codigo: 'SUPERADMIN' } });
    if (!rolSuperAdmin) {
      rolSuperAdmin = this.rolRepo.create({
        codigo: 'SUPERADMIN',
        nombre: 'Super Administrador de Plataforma',
        descripcion: 'Acceso directivo a métricas globales de negocio, inquilinos y control SaaS',
        esSistema: true,
        consultorioId: null,
      });
      rolSuperAdmin = await this.rolRepo.save(rolSuperAdmin);
    }

    // 3. Creamos el usuario SuperAdmin con contraseña desde variable de entorno
    const superAdminPassword = this.configService.get<string>('SUPERADMIN_PASSWORD', 'SuperAdmin1234!');
    const passwordHash = await bcrypt.hash(superAdminPassword, 10);
    const superAdminUser = this.usuarioRepo.create({
      nombre: 'Super',
      apellido: 'Administrador SaaS',
      email: superAdminEmail,
      passwordHash,
      rolId: rolSuperAdmin.id,
      rol: rolSuperAdmin,
      rolCodigo: 'SUPERADMIN',
      consultorioId: matriz.id,
      activo: true,
      twoFactorEnabled: false,
    });
    await this.usuarioRepo.save(superAdminUser);

    this.logger.log(`SuperAdmin aprovisionado con éxito: ${superAdminEmail}`);
  }

  /**
   * Sembrado de planes predeterminados (Básico, Profesional y Enterprise).
   */
  async seedPlanesIniciales() {
    const planesExistentes = await this.planRepo.count();
    if (planesExistentes > 0) return;

    this.logger.log('Sembrando planes estándar del SaaS clínico...');

    const planes = [
      {
        codigo: 'BASICO',
        nombre: 'Plan Consultorio Básico',
        descripcion: 'Ideal para consultas médicas individuales y consultorios independientes.',
        precioMensual: 29.0,
        precioAnual: 290.0,
        maxMedicos: 2,
        maxPacientes: 500,
        maxAlmacenamientoMb: 2048,
        destacado: false,
        caracteristicas: [
          'Hasta 2 profesionales médicos',
          'Hasta 500 pacientes activos',
          'Agenda de turnos y citas ilimitadas',
          'Recetas clínicas en PDF con membrete',
          '2 GB de almacenamiento de adjuntos',
          'Soporte técnico por correo',
        ],
        modulosIncluidos: {
          general: true,
          recetas: true,
          documentos: true,
          ginecologia: true,
          reportes: true,
        },
      },
      {
        codigo: 'PROFESIONAL',
        nombre: 'Plan Clínica Profesional',
        descripcion: 'Para centros médicos en crecimiento con múltiples especialidades y requerimientos de auditoría.',
        precioMensual: 79.0,
        precioAnual: 790.0,
        maxMedicos: 10,
        maxPacientes: 5000,
        maxAlmacenamientoMb: 10240,
        destacado: true,
        caracteristicas: [
          'Hasta 10 profesionales médicos',
          'Hasta 5,000 pacientes activos',
          'Módulo de Ginecología & Obstetricia (Naegele y Hadlock)',
          'Autenticación en Dos Factores (2FA) y gestión de sesiones',
          'Auditoría forense de accesos HIPAA / GDPR',
          'Reportes analíticos avanzados y exportación CSV',
          '10 GB de almacenamiento de adjuntos',
          'Soporte prioritario',
        ],
        modulosIncluidos: {
          general: true,
          recetas: true,
          documentos: true,
          ginecologia: true,
          reportes: true,
          auditoria: true,
        },
      },
      {
        codigo: 'ENTERPRISE',
        nombre: 'Plan Red Médica Enterprise',
        descripcion: 'Para policlínicos, hospitales y redes de clínicas con alta concurrencia y soporte SLA.',
        precioMensual: 199.0,
        precioAnual: 1990.0,
        maxMedicos: 9999,
        maxPacientes: 999999,
        maxAlmacenamientoMb: 102400,
        destacado: false,
        caracteristicas: [
          'Médicos y asistentes ilimitados',
          'Pacientes ilimitados',
          'Todas las especialidades médicas activas',
          'Copias de seguridad automáticas y verificadas con SHA-256',
          'Panel interno multi-sede',
          '100 GB de almacenamiento en la nube',
          'SLA 99.9% y soporte telefónico 24/7',
        ],
        modulosIncluidos: {
          general: true,
          recetas: true,
          documentos: true,
          ginecologia: true,
          reportes: true,
          auditoria: true,
          enterprise: true,
        },
      },
    ];

    for (const p of planes) {
      await this.planRepo.save(this.planRepo.create(p));
    }

    this.logger.log('Planes SaaS inicializados correctamente');
  }

  /**
   * Retorna los planes comerciales disponibles.
   */
  async listarPlanes() {
    return this.planRepo.find({
      where: { activo: true },
      order: { precioMensual: 'ASC' },
    });
  }

  /**
   * Onboarding público: Aprovisiona un nuevo consultorio inquilino (tenant)
   * junto a su suscripción y su primer usuario Administrador.
   */
  async onboarding(dto: OnboardingDto, ipAddress?: string, userAgent?: string) {
    const emailNormalizado = dto.adminEmail.toLowerCase().trim();

    // 1. Verificamos que el correo no esté ocupado
    const existe = await this.usuarioRepo.findOne({ where: { email: emailNormalizado } });
    if (existe) {
      throw new ConflictException('Ya existe un usuario registrado con este correo electrónico');
    }

    // 2. Buscamos el plan seleccionado
    const plan = await this.planRepo.findOne({
      where: { codigo: dto.planCodigo.toUpperCase(), activo: true },
    });
    if (!plan) {
      throw new BadRequestException(`El plan ${dto.planCodigo} no está disponible`);
    }

    // 3. Creamos el Consultorio (Tenant aislado)
    const nuevoConsultorio = this.consultorioRepo.create({
      nombre: dto.nombreConsultorio.trim(),
      telefono: dto.telefono ? dto.telefono.trim() : null,
      direccion: dto.direccion ? dto.direccion.trim() : null,
      email: emailNormalizado,
      modulosActivos: {
        general: true,
        citas: true,
        pacientes: true,
        caja: true,
        recetas: true,
        documentos: true,
        ginecologia: true,
        reportes: true,
        auditoria: true,
        ...(plan.modulosIncluidos || {}),
      },
      activo: true,
    });
    const consultorioGuardado = await this.consultorioRepo.save(nuevoConsultorio);

    // 4. Creamos el Administrador de la clínica
    const passwordHash = await bcrypt.hash(dto.adminPassword, 10);
    const rolAdmin = await this.rolRepo.findOne({ where: { codigo: 'ADMIN' } });

    const nuevoUsuario = this.usuarioRepo.create({
      nombre: dto.adminNombre.trim(),
      apellido: dto.adminApellido ? dto.adminApellido.trim() : null,
      email: emailNormalizado,
      passwordHash,
      rolId: rolAdmin?.id ?? null,
      rol: rolAdmin ?? null,
      rolCodigo: 'ADMIN',
      consultorioId: consultorioGuardado.id,
      activo: true,
      twoFactorEnabled: false,
    });
    const usuarioGuardado = await this.usuarioRepo.save(nuevoUsuario);

    // 5. Creamos la Suscripción inicial con período de prueba (14 días gratis)
    const ahora = new Date();
    const fechaFin = new Date(ahora);
    fechaFin.setDate(fechaFin.getDate() + 14);

    const nuevaSuscripcion = this.suscripcionRepo.create({
      consultorioId: consultorioGuardado.id,
      planId: plan.id,
      estado: EstadoSuscripcion.PRUEBA,
      periodo: dto.periodo || 'MENSUAL',
      fechaInicio: ahora,
      fechaFin,
      precioCobrado: dto.periodo === 'ANUAL' ? plan.precioAnual : plan.precioMensual,
      renovacionAutomatica: true,
    });
    const suscripcionGuardada = await this.suscripcionRepo.save(nuevaSuscripcion);

    // 6. Registramos evento en auditoría
    await this.auditoriaService.registrar({
      consultorioId: consultorioGuardado.id,
      usuarioId: usuarioGuardado.id,
      usuarioEmail: usuarioGuardado.email,
      usuarioNombre: `${usuarioGuardado.nombre} ${usuarioGuardado.apellido ?? ''}`.trim(),
      modulo: 'SAAS',
      accion: 'ONBOARDING_TENANT',
      entidadTipo: 'Consultorio',
      entidadId: consultorioGuardado.id,
      ipAddress,
      userAgent,
      detalles: {
        plan: plan.codigo,
        periodo: nuevaSuscripcion.periodo,
        diasPrueba: 14,
      },
    });

    // 7. Emitimos token JWT para acceso instantáneo
    const accessToken = this.jwtService.sign({
      sub: usuarioGuardado.id,
      email: usuarioGuardado.email,
      rol: 'ADMIN',
      consultorioId: consultorioGuardado.id,
      permisos: rolAdmin?.permisos?.map((p) => p.codigo) ?? [],
    });

    return {
      mensaje: '¡Clínica aprovisionada con éxito en la nube!',
      accessToken,
      usuario: {
        id: usuarioGuardado.id,
        nombre: usuarioGuardado.nombre,
        apellido: usuarioGuardado.apellido,
        email: usuarioGuardado.email,
        rol: 'ADMIN',
      },
      consultorio: {
        id: consultorioGuardado.id,
        nombre: consultorioGuardado.nombre,
        modulosActivos: consultorioGuardado.modulosActivos,
      },
      plan: {
        codigo: plan.codigo,
        nombre: plan.nombre,
        maxMedicos: plan.maxMedicos,
        maxPacientes: plan.maxPacientes,
      },
      suscripcion: {
        id: suscripcionGuardada.id,
        estado: suscripcionGuardada.estado,
        fechaInicio: suscripcionGuardada.fechaInicio,
        fechaFin: suscripcionGuardada.fechaFin,
      },
    };
  }

  /**
   * Obtiene la suscripción actual del consultorio junto a sus métricas de consumo de cupos.
   */
  async obtenerMiSuscripcion(consultorioId: string) {
    let suscripcion = await this.suscripcionRepo.findOne({
      where: { consultorioId },
      order: { creadoEn: 'DESC' },
      relations: { plan: true },
    });

    if (!suscripcion) {
      // Auto-asignación para consultorios preexistentes
      const planDefault =
        (await this.planRepo.findOne({ where: { codigo: 'PROFESIONAL' } })) ||
        (await this.planRepo.findOne({ where: { codigo: 'BASICO' } }));

      if (!planDefault) {
        throw new NotFoundException('No se encontró suscripción activa para este consultorio');
      }

      const ahora = new Date();
      const fechaFin = new Date(ahora);
      fechaFin.setDate(fechaFin.getDate() + 30);

      suscripcion = await this.suscripcionRepo.save(
        this.suscripcionRepo.create({
          consultorioId,
          planId: planDefault.id,
          plan: planDefault,
          estado: EstadoSuscripcion.ACTIVA,
          periodo: 'MENSUAL',
          fechaInicio: ahora,
          fechaFin,
          precioCobrado: planDefault.precioMensual,
          renovacionAutomatica: true,
        }),
      );
    }

    // Calculamos consumo de cuotas (total de usuarios/personal activo y pacientes)
    const [totalUsuarios, totalPacientes] = await Promise.all([
      this.usuarioRepo.count({
        where: { consultorioId, activo: true, eliminado: false },
      }),
      this.pacienteRepo.count({
        where: { consultorioId, activo: true },
      }),
    ]);

    const ahora = new Date();
    const diasRestantes = Math.max(
      0,
      Math.ceil((new Date(suscripcion.fechaFin).getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)),
    );

    return {
      suscripcion: {
        id: suscripcion.id,
        estado: suscripcion.estado,
        periodo: suscripcion.periodo,
        fechaInicio: suscripcion.fechaInicio,
        fechaFin: suscripcion.fechaFin,
        diasRestantes,
        precioCobrado: suscripcion.precioCobrado,
      },
      plan: suscripcion.plan,
      consumo: {
        usuarios: {
          actual: totalUsuarios,
          maximo: suscripcion.plan.maxMedicos,
          porcentaje: Math.min(100, Math.round((totalUsuarios / suscripcion.plan.maxMedicos) * 100)),
        },
        medicos: {
          actual: totalUsuarios,
          maximo: suscripcion.plan.maxMedicos,
          porcentaje: Math.min(100, Math.round((totalUsuarios / suscripcion.plan.maxMedicos) * 100)),
        },
        pacientes: {
          actual: totalPacientes,
          maximo: suscripcion.plan.maxPacientes,
          porcentaje: Math.min(100, Math.round((totalPacientes / suscripcion.plan.maxPacientes) * 100)),
        },
      },
    };
  }

  /**
   * Permite a un consultorio ascender o modificar su plan contratado.
   */
  async cambiarPlan(consultorioId: string, dto: CambiarPlanDto, usuarioSolicitante?: any) {
    const nuevoPlan = await this.planRepo.findOne({
      where: { codigo: dto.planCodigo.toUpperCase(), activo: true },
    });
    if (!nuevoPlan) {
      throw new NotFoundException('El plan solicitado no existe');
    }

    const consultorio = await this.consultorioRepo.findOne({ where: { id: consultorioId } });
    if (!consultorio) {
      throw new NotFoundException('Consultorio no encontrado');
    }

    // Actualizamos los módulos habilitados de la clínica según el nuevo plan
    consultorio.modulosActivos = nuevoPlan.modulosIncluidos;
    await this.consultorioRepo.save(consultorio);

    // Registramos la nueva suscripción
    const ahora = new Date();
    const fechaFin = new Date(ahora);
    fechaFin.setDate(fechaFin.getDate() + (dto.periodo === 'ANUAL' ? 365 : 30));

    const nuevaSuscripcion = this.suscripcionRepo.create({
      consultorioId,
      planId: nuevoPlan.id,
      estado: EstadoSuscripcion.ACTIVA,
      periodo: dto.periodo || 'MENSUAL',
      fechaInicio: ahora,
      fechaFin,
      precioCobrado: dto.periodo === 'ANUAL' ? nuevoPlan.precioAnual : nuevoPlan.precioMensual,
      renovacionAutomatica: true,
    });
    await this.suscripcionRepo.save(nuevaSuscripcion);

    await this.auditoriaService.registrar({
      consultorioId,
      usuarioId: usuarioSolicitante?.id ?? null,
      usuarioEmail: usuarioSolicitante?.email ?? 'sistema',
      usuarioNombre: `${usuarioSolicitante?.nombre ?? ''} ${usuarioSolicitante?.apellido ?? ''}`.trim() || 'Administrador',
      modulo: 'SAAS',
      accion: 'CAMBIAR_PLAN',
      entidadTipo: 'Plan',
      entidadId: nuevoPlan.id,
      detalles: { nuevoPlan: nuevoPlan.codigo, periodo: nuevaSuscripcion.periodo },
    });

    return {
      mensaje: `Plan actualizado exitosamente a ${nuevoPlan.nombre}`,
      plan: nuevoPlan,
      suscripcion: nuevaSuscripcion,
    };
  }

  /**
   * Registra una solicitud de cambio/renovación de plan por transferencia bancaria.
   * Queda en estado PENDIENTE a la espera de verificación manual por el SuperAdmin.
   */
  async solicitarPlan(consultorioId: string, dto: SolicitarPlanDto, usuario?: any) {
    const plan = await this.planRepo.findOne({
      where: { codigo: dto.planCodigo.toUpperCase(), activo: true },
    });
    if (!plan) {
      throw new NotFoundException('El plan seleccionado no existe o no está disponible');
    }

    const consultorio = await this.consultorioRepo.findOne({ where: { id: consultorioId } });
    if (!consultorio) {
      throw new NotFoundException('Consultorio no encontrado');
    }

    // 1. Validar que la clínica no intente solicitar el mismo plan que ya tiene activo
    const suscripcionActual = await this.suscripcionRepo.findOne({
      where: { consultorioId },
      order: { creadoEn: 'DESC' },
      relations: { plan: true },
    });

    if (
      suscripcionActual &&
      (suscripcionActual.planId === plan.id || suscripcionActual.plan?.codigo === plan.codigo)
    ) {
      throw new BadRequestException(
        `Tu clínica ya cuenta con el ${plan.nombre} activo. Selecciona un plan diferente para cambiar o mejorar.`,
      );
    }

    // 2. Validar que no exista una solicitud previa en revisión
    const solicitudPendiente = await this.solicitudPlanRepo.findOne({
      where: {
        consultorioId,
        estado: EstadoSolicitudPlan.PENDIENTE,
      },
    });
    if (solicitudPendiente) {
      throw new BadRequestException(
        'Ya tienes una solicitud de plan pendiente de revisión por el Administrador.',
      );
    }

    const periodo = dto.periodo === 'ANUAL' ? 'ANUAL' : 'MENSUAL';
    const monto = Number(periodo === 'ANUAL' ? plan.precioAnual : plan.precioMensual);

    const solicitud = this.solicitudPlanRepo.create({
      consultorioId,
      planId: plan.id,
      plan,
      periodo,
      monto,
      referenciaTransferencia: dto.referenciaTransferencia.trim(),
      bancoOrigen: dto.bancoOrigen ? dto.bancoOrigen.trim() : null,
      notas: dto.notas ? dto.notas.trim() : null,
      estado: EstadoSolicitudPlan.PENDIENTE,
    });

    const guardada = await this.solicitudPlanRepo.save(solicitud);

    await this.auditoriaService.registrar({
      consultorioId,
      usuarioId: usuario?.id,
      usuarioEmail: usuario?.email,
      usuarioNombre: usuario?.nombre,
      modulo: 'SAAS',
      accion: 'SOLICITUD_PLAN_TRANSFERENCIA',
      entidadTipo: 'SolicitudPlan',
      entidadId: guardada.id,
      detalles: {
        plan: plan.codigo,
        monto,
        referencia: dto.referenciaTransferencia,
        periodo,
      },
    });

    return {
      mensaje: 'Solicitud enviada correctamente. El Administrador verificará la transferencia y activará tu plan.',
      solicitud: guardada,
    };
  }

  /**
   * Obtiene la solicitud pendiente más reciente de la clínica actual (para mostrar estado en UI).
   */
  async obtenerMiSolicitudPendiente(consultorioId: string) {
    return this.solicitudPlanRepo.findOne({
      where: {
        consultorioId,
        estado: EstadoSolicitudPlan.PENDIENTE,
      },
      order: { creadoEn: 'DESC' },
      relations: { plan: true },
    });
  }

  /**
   * Panel SuperAdmin: Lista todas las solicitudes de planes por transferencia.
   */
  async listarSolicitudes(soloPendientes = true) {
    const where: any = {};
    if (soloPendientes) {
      where.estado = EstadoSolicitudPlan.PENDIENTE;
    }
    return this.solicitudPlanRepo.find({
      where,
      order: { creadoEn: 'DESC' },
      relations: { consultorio: true, plan: true },
    });
  }

  /**
   * Panel SuperAdmin: Aprueba una solicitud de transferencia bancaria y activa el plan en la clínica.
   */
  async aprobarSolicitudPlan(solicitudId: string, superAdminId: string) {
    const solicitud = await this.solicitudPlanRepo.findOne({
      where: { id: solicitudId },
      relations: { consultorio: true, plan: true },
    });

    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (solicitud.estado !== EstadoSolicitudPlan.PENDIENTE) {
      throw new BadRequestException(`Esta solicitud ya fue procesada anteriormente (${solicitud.estado})`);
    }

    const plan = solicitud.plan;
    const consultorio = solicitud.consultorio;

    // 1. Marcamos solicitud como Aprobada
    solicitud.estado = EstadoSolicitudPlan.APROBADA;
    solicitud.revisadoPorId = superAdminId;
    solicitud.revisadoEn = new Date();
    await this.solicitudPlanRepo.save(solicitud);

    // 2. Actualizamos módulos activos del consultorio
    consultorio.modulosActivos = plan.modulosIncluidos;
    await this.consultorioRepo.save(consultorio);

    // 3. Creamos o actualizamos la suscripción
    const ahora = new Date();
    const fechaFin = new Date(ahora);
    fechaFin.setDate(fechaFin.getDate() + (solicitud.periodo === 'ANUAL' ? 365 : 30));

    const nuevaSuscripcion = this.suscripcionRepo.create({
      consultorioId: consultorio.id,
      planId: plan.id,
      plan,
      estado: EstadoSuscripcion.ACTIVA,
      periodo: solicitud.periodo,
      fechaInicio: ahora,
      fechaFin,
      precioCobrado: solicitud.monto,
      renovacionAutomatica: false,
    });
    await this.suscripcionRepo.save(nuevaSuscripcion);

    await this.auditoriaService.registrar({
      consultorioId: consultorio.id,
      modulo: 'SAAS',
      accion: 'APROBAR_SOLICITUD_PLAN',
      entidadTipo: 'SolicitudPlan',
      entidadId: solicitud.id,
      detalles: {
        plan: plan.codigo,
        monto: solicitud.monto,
        referencia: solicitud.referenciaTransferencia,
      },
    });

    return {
      mensaje: `Plan ${plan.nombre} activado exitosamente para ${consultorio.nombre}`,
      solicitud,
      suscripcion: nuevaSuscripcion,
    };
  }

  /**
   * Panel SuperAdmin: Declina / rechaza una solicitud de transferencia bancaria no confirmada.
   */
  async rechazarSolicitudPlan(solicitudId: string, superAdminId: string, motivo?: string) {
    const solicitud = await this.solicitudPlanRepo.findOne({
      where: { id: solicitudId },
      relations: { consultorio: true, plan: true },
    });

    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (solicitud.estado !== EstadoSolicitudPlan.PENDIENTE) {
      throw new BadRequestException(`Esta solicitud ya fue procesada anteriormente (${solicitud.estado})`);
    }

    solicitud.estado = EstadoSolicitudPlan.RECHAZADA;
    solicitud.motivoRechazo = motivo || 'Transferencia no reflejada en cuenta bancaria';
    solicitud.revisadoPorId = superAdminId;
    solicitud.revisadoEn = new Date();
    await this.solicitudPlanRepo.save(solicitud);

    await this.auditoriaService.registrar({
      consultorioId: solicitud.consultorioId,
      modulo: 'SAAS',
      accion: 'RECHAZAR_SOLICITUD_PLAN',
      entidadTipo: 'SolicitudPlan',
      entidadId: solicitud.id,
      detalles: { motivo: solicitud.motivoRechazo },
    });

    return {
      mensaje: 'Solicitud de plan rechazada',
      solicitud,
    };
  }

  /**
   * Panel SuperAdmin: Métricas globales consolidadas de la plataforma.
   */
  async obtenerDashboardGlobal() {
    const [totalConsultorios, consultoriosActivos, totalMedicos, totalPacientes, totalConsultas] =
      await Promise.all([
        this.consultorioRepo.count(),
        this.consultorioRepo.count({ where: { activo: true } }),
        this.usuarioRepo.count({ where: { rolCodigo: 'MEDICO', activo: true, eliminado: false } }),
        this.pacienteRepo.count({ where: { activo: true } }),
        this.consultaRepo.count(),
      ]);

    const suscripcionesActivas = await this.suscripcionRepo.find({
      where: { estado: EstadoSuscripcion.ACTIVA },
      relations: { plan: true },
    });

    // Estimación de Ingresos Mensuales Recurrentes (MRR)
    let mrrEstimado = 0;
    const porPlan: Record<string, number> = {};

    for (const s of suscripcionesActivas) {
      const codigo = s.plan?.codigo || 'BASICO';
      porPlan[codigo] = (porPlan[codigo] || 0) + 1;
      const precioMensual = s.periodo === 'ANUAL' ? (s.precioCobrado || 0) / 12 : (s.precioCobrado || 0);
      mrrEstimado += Number(precioMensual);
    }

    return {
      metricas: {
        totalConsultorios,
        consultoriosActivos,
        consultoriosSuspendidos: totalConsultorios - consultoriosActivos,
        totalMedicos,
        totalPacientes,
        totalConsultas,
        mrrEstimado: Math.round(mrrEstimado * 100) / 100,
      },
      distribucionPlanes: porPlan,
    };
  }

  /**
   * Panel SuperAdmin: Directorio maestro de todos los consultorios inquilinos.
   */
  async listarTodosConsultorios() {
    const consultorios = await this.consultorioRepo.find({
      order: { creadoEn: 'DESC' },
    });

    const resultado = [];

    for (const c of consultorios) {
      const [suscripcion, cantMedicos, cantPacientes] = await Promise.all([
        this.suscripcionRepo.findOne({
          where: { consultorioId: c.id },
          order: { creadoEn: 'DESC' },
          relations: { plan: true },
        }),
        this.usuarioRepo.count({ where: { consultorioId: c.id, rolCodigo: 'MEDICO', eliminado: false } }),
        this.pacienteRepo.count({ where: { consultorioId: c.id } }),
      ]);

      resultado.push({
        id: c.id,
        nombre: c.nombre,
        email: c.email,
        telefono: c.telefono,
        activo: c.activo,
        creadoEn: c.creadoEn,
        plan: suscripcion?.plan?.nombre || 'Plan Básico',
        planCodigo: suscripcion?.plan?.codigo || 'BASICO',
        estadoSuscripcion: suscripcion?.estado || 'PRUEBA',
        totalMedicos: cantMedicos,
        totalPacientes: cantPacientes,
      });
    }

    return resultado;
  }

  /**
   * Panel SuperAdmin: Suspende o reactiva un consultorio completo (soft-lock tenant).
   */
  async cambiarEstadoConsultorio(consultorioId: string, dto: CambiarEstadoTenantDto) {
    const consultorio = await this.consultorioRepo.findOne({ where: { id: consultorioId } });
    if (!consultorio) {
      throw new NotFoundException('Consultorio no encontrado');
    }

    consultorio.activo = dto.activo;
    await this.consultorioRepo.save(consultorio);

    await this.auditoriaService.registrar({
      consultorioId,
      modulo: 'SAAS',
      accion: dto.activo ? 'REACTIVAR_TENANT' : 'SUSPENDER_TENANT',
      entidadTipo: 'Consultorio',
      entidadId: consultorio.id,
      detalles: { activo: dto.activo },
    });

    return {
      mensaje: `Consultorio ${consultorio.nombre} ${dto.activo ? 'reactivado' : 'suspendido'} exitosamente`,
      consultorio,
    };
  }
}
