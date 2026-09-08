import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import bcrypt from 'bcryptjs';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import { Consultorio } from '../consultorios/entities/consultorio.entity.js';
import { Rol } from '../roles/entities/rol.entity.js';
import { SesionUsuario } from './entities/sesion-usuario.entity.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';
import { Disable2faDto, Login2faDto } from './dto/two-factor.dto.js';
import {
  generateBase32Secret,
  verifyTotpCode,
  generateOtpAuthUri,
  generateRecoveryCodes,
} from './utils/totp.util.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,

    @InjectRepository(Consultorio)
    private readonly consultorioRepo: Repository<Consultorio>,

    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,

    @InjectRepository(SesionUsuario)
    private readonly sesionRepo: Repository<SesionUsuario>,

    private readonly jwtService: JwtService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  /**
   * Registra un nuevo Consultorio (Tenant) junto con su primer Administrador.
   */
  async registro(dto: RegistroDto, ipAddress?: string, userAgent?: string) {
    const emailNormalizado = dto.email.toLowerCase().trim();

    const existeUsuario = await this.usuarioRepo.findOne({
      where: { email: emailNormalizado },
    });

    if (existeUsuario) {
      throw new ConflictException('Ya existe un usuario registrado con este correo electrónico');
    }

    const nuevoConsultorio = this.consultorioRepo.create({
      nombre: dto.nombreConsultorio.trim(),
      activo: true,
    });
    const consultorioGuardado = await this.consultorioRepo.save(nuevoConsultorio);

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const rolAdmin = await this.rolRepo.findOne({ where: { codigo: 'ADMIN' } });

    const nuevoUsuario = this.usuarioRepo.create({
      nombre: dto.nombre.trim(),
      apellido: dto.apellido ? dto.apellido.trim() : null,
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

    // Crear sesión de usuario
    const sesion = await this.sesionRepo.save(
      this.sesionRepo.create({
        usuarioId: usuarioGuardado.id,
        consultorioId: consultorioGuardado.id,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        dispositivo: this.detectarDispositivo(userAgent),
        activa: true,
        ultimoAcceso: new Date(),
      }),
    );

    const token = this.generarToken(usuarioGuardado, sesion.id);

    // Auditoría de registro
    await this.auditoriaService.registrar({
      consultorioId: consultorioGuardado.id,
      usuarioId: usuarioGuardado.id,
      usuarioEmail: usuarioGuardado.email,
      usuarioNombre: `${usuarioGuardado.nombre} ${usuarioGuardado.apellido ?? ''}`.trim(),
      modulo: 'AUTH',
      accion: 'REGISTRO',
      entidadTipo: 'Consultorio',
      entidadId: consultorioGuardado.id,
      ipAddress,
      userAgent,
      detalles: { consultorio: consultorioGuardado.nombre },
    });

    return {
      mensaje: 'Consultorio y usuario administrador registrados exitosamente',
      accessToken: token,
      usuario: {
        id: usuarioGuardado.id,
        nombre: usuarioGuardado.nombre,
        apellido: usuarioGuardado.apellido,
        email: usuarioGuardado.email,
        rol: usuarioGuardado.rol?.codigo ?? usuarioGuardado.rolCodigo,
        twoFactorEnabled: false,
        consultorio: {
          id: consultorioGuardado.id,
          nombre: consultorioGuardado.nombre,
        },
      },
    };
  }

  /**
   * Valida credenciales e inicia sesión.
   * Si el usuario tiene 2FA activado, emite un token temporal que requiere el paso 2.
   */
  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const emailNormalizado = dto.email.toLowerCase().trim();

    const usuario = await this.usuarioRepo.findOne({
      where: { email: emailNormalizado },
      relations: {
        consultorio: true,
        rol: {
          permisos: true,
        },
      },
    });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Correo electrónico o contraseña incorrectos');
    }

    const passwordValida = await bcrypt.compare(dto.password, usuario.passwordHash);

    if (!passwordValida) {
      throw new UnauthorizedException('Correo electrónico o contraseña incorrectos');
    }

    if (usuario.consultorio && !usuario.consultorio.activo) {
      throw new UnauthorizedException('El consultorio asociado se encuentra suspendido');
    }

    // Si tiene 2FA habilitado, exigimos el segundo factor
    if (usuario.twoFactorEnabled) {
      const tempToken = this.jwtService.sign(
        { sub: usuario.id, temp2fa: true, consultorioId: usuario.consultorioId },
        { expiresIn: '5m' },
      );

      return {
        require2FA: true,
        tempToken,
        mensaje: 'Se requiere código de verificación de doble factor (2FA)',
      };
    }

    // Iniciar sesión y registrar dispositivo
    const sesion = await this.sesionRepo.save(
      this.sesionRepo.create({
        usuarioId: usuario.id,
        consultorioId: usuario.consultorioId,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        dispositivo: this.detectarDispositivo(userAgent),
        activa: true,
        ultimoAcceso: new Date(),
      }),
    );

    const token = this.generarToken(usuario, sesion.id);

    // Auditoría de login
    await this.auditoriaService.registrar({
      consultorioId: usuario.consultorioId,
      usuarioId: usuario.id,
      usuarioEmail: usuario.email,
      usuarioNombre: `${usuario.nombre} ${usuario.apellido ?? ''}`.trim(),
      modulo: 'AUTH',
      accion: 'LOGIN',
      entidadTipo: 'Usuario',
      entidadId: usuario.id,
      ipAddress,
      userAgent,
      detalles: { metodo: 'PASSWORD', sesionId: sesion.id },
    });

    return {
      require2FA: false,
      accessToken: token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: {
          id: usuario.rol?.id,
          nombre: usuario.rol?.nombre ?? 'Administrador',
          codigo: usuario.rol?.codigo ?? usuario.rolCodigo,
        },
        permisos: usuario.rol?.permisos?.map((p) => p.codigo) ?? [],
        twoFactorEnabled: false,
        consultorio: {
          id: usuario.consultorio.id,
          nombre: usuario.consultorio.nombre,
        },
      },
    };
  }

  /**
   * Segundo paso de login para usuarios con 2FA activo.
   */
  async login2fa(dto: Login2faDto, ipAddress?: string, userAgent?: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(dto.tempToken);
    } catch {
      throw new UnauthorizedException('El token temporal de 2FA ha expirado o no es válido');
    }

    if (!payload.temp2fa || !payload.sub) {
      throw new UnauthorizedException('Token de 2FA no válido');
    }

    const usuario = await this.usuarioRepo.findOne({
      where: { id: payload.sub, activo: true },
      relations: {
        consultorio: true,
        rol: {
          permisos: true,
        },
      },
    });

    if (!usuario || !usuario.twoFactorSecret) {
      throw new UnauthorizedException('Usuario no válido para autenticación 2FA');
    }

    const cleanCode = dto.codigo.trim().toUpperCase();
    let esValido = verifyTotpCode(usuario.twoFactorSecret, cleanCode);
    let esCodigoRecuperacion = false;

    // Si no es un código TOTP válido, verificamos si es uno de los códigos de recuperación
    if (!esValido && usuario.twoFactorRecoveryCodes && usuario.twoFactorRecoveryCodes.length > 0) {
      const codigoSinGuion = cleanCode.replace(/-/g, '');
      const idx = usuario.twoFactorRecoveryCodes.findIndex(
        (c) => c.replace(/-/g, '').toUpperCase() === codigoSinGuion,
      );

      if (idx !== -1) {
        esValido = true;
        esCodigoRecuperacion = true;
        // Consumimos el código de recuperación
        usuario.twoFactorRecoveryCodes.splice(idx, 1);
        await this.usuarioRepo.save(usuario);
      }
    }

    if (!esValido) {
      throw new UnauthorizedException('Código de verificación 2FA incorrecto');
    }

    // Sesión activa
    const sesion = await this.sesionRepo.save(
      this.sesionRepo.create({
        usuarioId: usuario.id,
        consultorioId: usuario.consultorioId,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        dispositivo: this.detectarDispositivo(userAgent),
        activa: true,
        ultimoAcceso: new Date(),
      }),
    );

    const token = this.generarToken(usuario, sesion.id);

    // Auditoría
    await this.auditoriaService.registrar({
      consultorioId: usuario.consultorioId,
      usuarioId: usuario.id,
      usuarioEmail: usuario.email,
      usuarioNombre: `${usuario.nombre} ${usuario.apellido ?? ''}`.trim(),
      modulo: 'AUTH',
      accion: 'LOGIN_2FA',
      entidadTipo: 'Usuario',
      entidadId: usuario.id,
      ipAddress,
      userAgent,
      detalles: {
        metodo: esCodigoRecuperacion ? 'CODIGO_RECUPERACION' : 'TOTP',
        sesionId: sesion.id,
      },
    });

    return {
      accessToken: token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rol: {
          id: usuario.rol?.id,
          nombre: usuario.rol?.nombre ?? 'Administrador',
          codigo: usuario.rol?.codigo ?? usuario.rolCodigo,
        },
        permisos: usuario.rol?.permisos?.map((p) => p.codigo) ?? [],
        twoFactorEnabled: true,
        consultorio: {
          id: usuario.consultorio.id,
          nombre: usuario.consultorio.nombre,
        },
      },
    };
  }

  /**
   * Inicia la configuración de 2FA generando la clave secreta y la URI para el código QR.
   */
  async iniciarSetup2fa(usuarioId: string) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: usuarioId },
      relations: { consultorio: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const secret = generateBase32Secret(20);
    const nombreClinica = usuario.consultorio?.nombre || 'Sistema Clinico';
    const qrUri = generateOtpAuthUri(usuario.email, nombreClinica, secret);

    // Guardamos la clave temporal
    usuario.twoFactorSecret = secret;
    await this.usuarioRepo.save(usuario);

    return {
      secret,
      qrUri,
      mensaje: 'Escanea el código QR con tu app de autenticación (Google Authenticator, Authy, etc.)',
    };
  }

  /**
   * Confirma la activación de 2FA verificando el primer código emitido.
   */
  async confirmar2fa(usuarioId: string, codigo: string, ipAddress?: string, userAgent?: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { id: usuarioId } });

    if (!usuario || !usuario.twoFactorSecret) {
      throw new BadRequestException('Primero debe solicitar la clave de configuración 2FA');
    }

    const esValido = verifyTotpCode(usuario.twoFactorSecret, codigo);
    if (!esValido) {
      throw new BadRequestException('Código de verificación incorrecto. Revisa la hora de tu dispositivo.');
    }

    const recoveryCodes = generateRecoveryCodes(8);
    usuario.twoFactorEnabled = true;
    usuario.twoFactorRecoveryCodes = recoveryCodes;
    await this.usuarioRepo.save(usuario);

    // Auditoría
    await this.auditoriaService.registrar({
      consultorioId: usuario.consultorioId,
      usuarioId: usuario.id,
      usuarioEmail: usuario.email,
      usuarioNombre: `${usuario.nombre} ${usuario.apellido ?? ''}`.trim(),
      modulo: 'SEGURIDAD',
      accion: '2FA_ACTIVAR',
      entidadTipo: 'Usuario',
      entidadId: usuario.id,
      ipAddress,
      userAgent,
    });

    return {
      mensaje: 'Autenticación de dos factores (2FA) activada correctamente',
      twoFactorEnabled: true,
      recoveryCodes,
    };
  }

  /**
   * Desactiva el 2FA requiriendo la contraseña actual y un código TOTP válido.
   */
  async desactivar2fa(usuarioId: string, dto: Disable2faDto, ipAddress?: string, userAgent?: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { id: usuarioId } });

    if (!usuario || !usuario.twoFactorEnabled || !usuario.twoFactorSecret) {
      throw new BadRequestException('El usuario no tiene 2FA activo');
    }

    const passwordValida = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!passwordValida) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    const esValido = verifyTotpCode(usuario.twoFactorSecret, dto.codigo);
    if (!esValido) {
      throw new BadRequestException('Código 2FA incorrecto');
    }

    usuario.twoFactorEnabled = false;
    usuario.twoFactorSecret = null;
    usuario.twoFactorRecoveryCodes = null;
    await this.usuarioRepo.save(usuario);

    // Auditoría
    await this.auditoriaService.registrar({
      consultorioId: usuario.consultorioId,
      usuarioId: usuario.id,
      usuarioEmail: usuario.email,
      usuarioNombre: `${usuario.nombre} ${usuario.apellido ?? ''}`.trim(),
      modulo: 'SEGURIDAD',
      accion: '2FA_DESACTIVAR',
      entidadTipo: 'Usuario',
      entidadId: usuario.id,
      ipAddress,
      userAgent,
    });

    return {
      mensaje: 'Autenticación de dos factores desactivada exitosamente',
      twoFactorEnabled: false,
    };
  }

  /**
   * Lista todas las sesiones activas del usuario.
   */
  async listarSesiones(usuarioId: string, sesionActualId?: string) {
    const sesiones = await this.sesionRepo.find({
      where: { usuarioId, activa: true },
      order: { ultimoAcceso: 'DESC' },
    });

    return sesiones.map((s) => ({
      id: s.id,
      dispositivo: s.dispositivo,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      ultimoAcceso: s.ultimoAcceso,
      creadoEn: s.creadoEn,
      esActual: s.id === sesionActualId,
    }));
  }

  /**
   * Revoca una sesión remota específica.
   */
  async revocarSesion(
    usuarioId: string,
    sesionId: string,
    sesionActualId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (sesionActualId && sesionId === sesionActualId) {
      throw new BadRequestException(
        'No puedes revocar o desactivar tu propio token de sesión activa. Para salir del sistema, utiliza la opción Cerrar Sesión.',
      );
    }

    const sesion = await this.sesionRepo.findOne({
      where: { id: sesionId, usuarioId },
    });

    if (!sesion) {
      throw new NotFoundException('Sesión no encontrada');
    }

    sesion.activa = false;
    await this.sesionRepo.save(sesion);

    await this.auditoriaService.registrar({
      consultorioId: sesion.consultorioId,
      usuarioId,
      modulo: 'SEGURIDAD',
      accion: 'SESION_REVOCAR',
      entidadTipo: 'SesionUsuario',
      entidadId: sesionId,
      ipAddress,
      userAgent,
      detalles: { dispositivo: sesion.dispositivo },
    });

    return { mensaje: 'Sesión revocada exitosamente' };
  }

  /**
   * Revoca todas las demás sesiones excepto la sesión actual del usuario.
   */
  async revocarOtrasSesiones(usuarioId: string, sesionActualId?: string, ipAddress?: string, userAgent?: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { id: usuarioId } });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const whereClause: any = { usuarioId, activa: true };
    if (sesionActualId) {
      whereClause.id = Not(sesionActualId);
    }

    await this.sesionRepo.update(whereClause, { activa: false });

    await this.auditoriaService.registrar({
      consultorioId: usuario.consultorioId,
      usuarioId,
      modulo: 'SEGURIDAD',
      accion: 'SESIONES_REVOCAR_OTRAS',
      entidadTipo: 'SesionUsuario',
      ipAddress,
      userAgent,
    });

    return { mensaje: 'Todas las demás sesiones han sido cerradas exitosamente' };
  }

  /**
   * Emite el token JWT incluyendo el contexto de sesión y tenant.
   */
  private generarToken(usuario: Usuario, sessionId?: string): string {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol?.codigo ?? usuario.rolCodigo ?? 'ADMIN',
      consultorioId: usuario.consultorioId,
      permisos: usuario.rol?.permisos?.map((p) => p.codigo) ?? [],
      sessionId,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Helper que determina de forma legible el navegador y sistema operativo cliente.
   */
  private detectarDispositivo(userAgent?: string): string {
    if (!userAgent) return 'Navegador Web';
    const ua = userAgent.toLowerCase();

    let so = 'Dispositivo';
    if (ua.includes('windows')) so = 'Windows';
    else if (ua.includes('macintosh') || ua.includes('mac os')) so = 'macOS';
    else if (ua.includes('android')) so = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) so = 'iOS';
    else if (ua.includes('linux')) so = 'Linux';

    let navegador = 'Navegador';
    if (ua.includes('edg/')) navegador = 'Microsoft Edge';
    else if (ua.includes('chrome/')) navegador = 'Google Chrome';
    else if (ua.includes('firefox/')) navegador = 'Mozilla Firefox';
    else if (ua.includes('safari/') && !ua.includes('chrome')) navegador = 'Apple Safari';

    return `${navegador} en ${so}`;
  }
}
