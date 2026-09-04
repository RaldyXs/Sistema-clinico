import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import { Consultorio } from '../consultorios/entities/consultorio.entity.js';
import { Rol } from '../roles/entities/rol.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';

/**
 * Servicio de Autenticación (AuthService).
 *
 * Contiene la lógica de negocio central para:
 * 1. Registro de nuevas clínicas y usuarios administradores.
 * 2. Validación de credenciales con hashing (bcryptjs).
 * 3. Emisión de tokens firmados (JWT) con roles y permisos asociados.
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,

    @InjectRepository(Consultorio)
    private readonly consultorioRepo: Repository<Consultorio>,

    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,

    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registra un nuevo Consultorio (Organización SaaS) junto con su primer Administrador.
   */
  async registro(dto: RegistroDto) {
    const emailNormalizado = dto.email.toLowerCase().trim();

    // 1. Verificamos que el email no esté registrado previamente
    const existeUsuario = await this.usuarioRepo.findOne({
      where: { email: emailNormalizado },
    });

    if (existeUsuario) {
      throw new ConflictException('Ya existe un usuario registrado con este correo electrónico');
    }

    // 2. Creamos la organización / consultorio (Tenant)
    const nuevoConsultorio = this.consultorioRepo.create({
      nombre: dto.nombreConsultorio.trim(),
      activo: true,
    });
    const consultorioGuardado = await this.consultorioRepo.save(nuevoConsultorio);

    // 3. Generamos el hash criptográfico de la contraseña (10 rondas de salt)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // 4. Obtenemos el rol ADMIN universal del sistema
    const rolAdmin = await this.rolRepo.findOne({ where: { codigo: 'ADMIN' } });

    // 5. Creamos el usuario administrador vinculado al nuevo consultorio y con el rol ADMIN
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
    });
    const usuarioGuardado = await this.usuarioRepo.save(nuevoUsuario);

    // 6. Emitimos la pulsera (Token JWT)
    const token = this.generarToken(usuarioGuardado);

    return {
      mensaje: 'Consultorio y usuario administrador registrados exitosamente',
      accessToken: token,
      usuario: {
        id: usuarioGuardado.id,
        nombre: usuarioGuardado.nombre,
        apellido: usuarioGuardado.apellido,
        email: usuarioGuardado.email,
        rol: usuarioGuardado.rol?.codigo ?? usuarioGuardado.rolCodigo,
        consultorio: {
          id: consultorioGuardado.id,
          nombre: consultorioGuardado.nombre,
        },
      },
    };
  }

  /**
   * Valida credenciales e inicia sesión emitiendo un token JWT.
   */
  async login(dto: LoginDto) {
    const emailNormalizado = dto.email.toLowerCase().trim();

    // 1. Buscamos el usuario por su email incluyendo consultorio, rol y sus permisos
    const usuario = await this.usuarioRepo.findOne({
      where: { email: emailNormalizado },
      relations: {
        consultorio: true,
        rol: {
          permisos: true,
        },
      },
    });

    // 2. Si no existe o está desactivado, rechazamos con 401
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Correo electrónico o contraseña incorrectos');
    }

    // 3. Comparamos la contraseña en texto plano con el hash almacenado
    const passwordValida = await bcrypt.compare(dto.password, usuario.passwordHash);

    if (!passwordValida) {
      throw new UnauthorizedException('Correo electrónico o contraseña incorrectos');
    }

    // 4. Verificamos que el consultorio no esté suspendido
    if (usuario.consultorio && !usuario.consultorio.activo) {
      throw new UnauthorizedException('El consultorio asociado se encuentra suspendido');
    }

    // 5. Credenciales correctas: generamos el token JWT
    const token = this.generarToken(usuario);

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
        permisos: usuario.rol?.permisos?.map(p => p.codigo) ?? [],
        consultorio: {
          id: usuario.consultorio.id,
          nombre: usuario.consultorio.nombre,
        },
      },
    };
  }

  /**
   * Genera y firma el token JWT con la información de identidad y contexto multi-tenant.
   */
  private generarToken(usuario: Usuario): string {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol?.codigo ?? usuario.rolCodigo ?? 'ADMIN',
      consultorioId: usuario.consultorioId,
      permisos: usuario.rol?.permisos?.map(p => p.codigo) ?? [],
    };

    return this.jwtService.sign(payload);
  }
}
