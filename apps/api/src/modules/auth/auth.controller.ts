import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';
import { Verify2faDto, Disable2faDto, Login2faDto } from './dto/two-factor.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  async registro(@Body() dto: RegistroDto, @Request() req: any) {
    const ip = req.ip || req.connection?.remoteAddress;
    const ua = req.headers['user-agent'];
    return this.authService.registro(dto, ip, ua);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Request() req: any) {
    const ip = req.ip || req.connection?.remoteAddress;
    const ua = req.headers['user-agent'];
    return this.authService.login(dto, ip, ua);
  }

  @Post('login-2fa')
  @HttpCode(HttpStatus.OK)
  async login2fa(@Body() dto: Login2faDto, @Request() req: any) {
    const ip = req.ip || req.connection?.remoteAddress;
    const ua = req.headers['user-agent'];
    return this.authService.login2fa(dto, ip, ua);
  }

  @UseGuards(JwtAuthGuard)
  @Get('perfil')
  obtenerPerfil(@Request() req: any) {
    const usuario = req.user;
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol?.codigo ?? usuario.rolCodigo,
      rolCodigo: usuario.rolCodigo ?? usuario.rol?.codigo ?? 'MEDICO',
      twoFactorEnabled: usuario.twoFactorEnabled ?? false,
      consultorio: {
        id: usuario.consultorio?.id ?? usuario.consultorioId,
        nombre: usuario.consultorio?.nombre,
      },
    };
  }

  // --- 2FA Endpoints ---

  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  async setup2fa(@Request() req: any) {
    return this.authService.iniciarSetup2fa(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/confirmar')
  @HttpCode(HttpStatus.OK)
  async confirmar2fa(@Request() req: any, @Body() dto: Verify2faDto) {
    const ip = req.ip || req.connection?.remoteAddress;
    const ua = req.headers['user-agent'];
    return this.authService.confirmar2fa(req.user.id, dto.codigo, ip, ua);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/desactivar')
  @HttpCode(HttpStatus.OK)
  async desactivar2fa(@Request() req: any, @Body() dto: Disable2faDto) {
    const ip = req.ip || req.connection?.remoteAddress;
    const ua = req.headers['user-agent'];
    return this.authService.desactivar2fa(req.user.id, dto, ip, ua);
  }

  // --- Gestión de Sesiones ---

  @UseGuards(JwtAuthGuard)
  @Get('sesiones')
  async listarSesiones(@Request() req: any) {
    return this.authService.listarSesiones(req.user.id, req.user.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sesiones/otras')
  @HttpCode(HttpStatus.OK)
  async revocarOtrasSesiones(@Request() req: any) {
    const ip = req.ip || req.connection?.remoteAddress;
    const ua = req.headers['user-agent'];
    return this.authService.revocarOtrasSesiones(req.user.id, req.user.sessionId, ip, ua);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sesiones/:id')
  @HttpCode(HttpStatus.OK)
  async revocarSesion(@Request() req: any, @Param('id', ParseUUIDPipe) sesionId: string) {
    const ip = req.ip || req.connection?.remoteAddress;
    const ua = req.headers['user-agent'];
    return this.authService.revocarSesion(req.user.id, sesionId, req.user.sessionId, ip, ua);
  }
}
