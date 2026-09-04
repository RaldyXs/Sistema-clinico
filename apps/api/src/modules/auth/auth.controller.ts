import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

/**
 * Controlador de Autenticación (AuthController).
 *
 * Expone los endpoints HTTP bajo la ruta `/auth`:
 * - POST /auth/registro: Registro inicial (Público)
 * - POST /auth/login: Inicio de sesión (Público)
 * - GET  /auth/perfil: Consulta del usuario actual (Privado, requiere JWT)
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint de Registro inicial de Consultorio y Administrador.
   */
  @Post('registro')
  async registro(@Body() dto: RegistroDto) {
    return this.authService.registro(dto);
  }

  /**
   * Endpoint de Inicio de Sesión.
   * `HttpCode(HttpStatus.OK)` asegura que retorne HTTP 200 en lugar del 201 por defecto de POST.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Endpoint de Verificación de Perfil.
   * Está protegido por `JwtAuthGuard`. Si la petición no lleva un token válido en
   * la cabecera `Authorization: Bearer <token>`, NestJS devuelve 401 Unauthorized.
   */
  @UseGuards(JwtAuthGuard)
  @Get('perfil')
  obtenerPerfil(@Request() req: any) {
    const usuario = req.user;
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol,
      consultorio: {
        id: usuario.consultorio.id,
        nombre: usuario.consultorio.nombre,
      },
    };
  }
}
