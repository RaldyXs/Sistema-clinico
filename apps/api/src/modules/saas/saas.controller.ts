import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { SaasService } from './saas.service.js';
import {
  OnboardingDto,
  CambiarPlanDto,
  CambiarEstadoTenantDto,
  SolicitarPlanDto,
  RechazarSolicitudPlanDto,
} from './dto/saas.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ConsultorioActual } from '../../common/decorators/consultorio-actual.decorator.js';

@Controller('saas')
export class SaasController {
  constructor(private readonly saasService: SaasService) {}

  /**
   * Helper para verificar rol SuperAdmin
   */
  private verificarSuperAdmin(req: any) {
    const rol = req.user?.rol?.codigo || req.user?.rolCodigo;
    if (rol !== 'SUPERADMIN') {
      throw new ForbiddenException('Acceso denegado: Se requiere rol SuperAdmin');
    }
  }

  // ==================== ENDPOINTS PÚBLICOS ====================

  /**
   * Catálogo de planes y precios comerciales disponibles en el SaaS.
   */
  @Get('planes')
  async listarPlanes() {
    return this.saasService.listarPlanes();
  }

  /**
   * Onboarding de clínica.
   */
  @Post('onboarding')
  @HttpCode(HttpStatus.CREATED)
  async onboarding(@Body() dto: OnboardingDto, @Request() req: any) {
    const ip = req.ip || req.connection?.remoteAddress;
    const ua = req.headers['user-agent'];
    return this.saasService.onboarding(dto, ip, ua);
  }

  // ==================== ENDPOINTS DE TENANT (CLÍNICA) ====================

  /**
   * Consulta el plan contratado, fecha de vencimiento y consumo de cuotas del consultorio autenticado.
   */
  @UseGuards(JwtAuthGuard)
  @Get('mi-suscripcion')
  async obtenerMiSuscripcion(@ConsultorioActual() consultorioId: string) {
    return this.saasService.obtenerMiSuscripcion(consultorioId);
  }

  /**
   * Solicita formalmente un cambio o mejora de plan aportando comprobante de transferencia bancaria.
   */
  @UseGuards(JwtAuthGuard)
  @Post('solicitar-plan')
  @HttpCode(HttpStatus.CREATED)
  async solicitarPlan(
    @ConsultorioActual() consultorioId: string,
    @Body() dto: SolicitarPlanDto,
    @Request() req: any,
  ) {
    return this.saasService.solicitarPlan(consultorioId, dto, req.user);
  }

  /**
   * Consulta si la clínica tiene una solicitud de cambio de plan pendiente de revisión.
   */
  @UseGuards(JwtAuthGuard)
  @Get('mi-solicitud-pendiente')
  async obtenerMiSolicitudPendiente(@ConsultorioActual() consultorioId: string) {
    return this.saasService.obtenerMiSolicitudPendiente(consultorioId);
  }

  /**
   * Permite al consultorio ascender o modificar su plan directamente.
   */
  @UseGuards(JwtAuthGuard)
  @Post('cambiar-plan')
  @HttpCode(HttpStatus.OK)
  async cambiarPlan(
    @ConsultorioActual() consultorioId: string,
    @Body() dto: CambiarPlanDto,
  ) {
    return this.saasService.cambiarPlan(consultorioId, dto);
  }

  // ==================== ENDPOINTS SUPERADMIN / PLATAFORMA ====================

  /**
   * Panel SuperAdmin: Alta manual de una clínica (tras recibir transferencia inicial).
   */
  @UseGuards(JwtAuthGuard)
  @Post('crear-clinica')
  @HttpCode(HttpStatus.CREATED)
  async crearClinicaSuperAdmin(@Body() dto: OnboardingDto, @Request() req: any) {
    this.verificarSuperAdmin(req);
    const ip = req.ip || req.connection?.remoteAddress;
    const ua = req.headers['user-agent'];
    return this.saasService.onboarding(dto, ip, ua);
  }

  /**
   * Panel SuperAdmin: Lista solicitudes de planes y pagos por transferencia pendientes.
   */
  @UseGuards(JwtAuthGuard)
  @Get('solicitudes')
  async listarSolicitudes(
    @Query('pendientes') pendientes: string,
    @Request() req: any,
  ) {
    this.verificarSuperAdmin(req);
    const soloPendientes = pendientes !== 'false';
    return this.saasService.listarSolicitudes(soloPendientes);
  }

  /**
   * Panel SuperAdmin: Aprueba una transferencia bancaria y activa el plan.
   */
  @UseGuards(JwtAuthGuard)
  @Post('solicitudes/:id/aprobar')
  @HttpCode(HttpStatus.OK)
  async aprobarSolicitudPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    this.verificarSuperAdmin(req);
    return this.saasService.aprobarSolicitudPlan(id, req.user.id);
  }

  /**
   * Panel SuperAdmin: Rechaza una solicitud de transferencia bancaria no confirmada.
   */
  @UseGuards(JwtAuthGuard)
  @Post('solicitudes/:id/rechazar')
  @HttpCode(HttpStatus.OK)
  async rechazarSolicitudPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RechazarSolicitudPlanDto,
    @Request() req: any,
  ) {
    this.verificarSuperAdmin(req);
    return this.saasService.rechazarSolicitudPlan(id, req.user.id, dto.motivo);
  }

  /**
   * Panel SuperAdmin: Métricas globales consolidadas de la plataforma SaaS.
   */
  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  async obtenerDashboardGlobal(@Request() req: any) {
    this.verificarSuperAdmin(req);
    return this.saasService.obtenerDashboardGlobal();
  }

  /**
   * Panel SuperAdmin: Directorio maestro de todas las clínicas clientes.
   */
  @UseGuards(JwtAuthGuard)
  @Get('consultorios')
  async listarTodosConsultorios(@Request() req: any) {
    this.verificarSuperAdmin(req);
    return this.saasService.listarTodosConsultorios();
  }

  /**
   * Panel SuperAdmin: Suspende o reactiva un consultorio completo.
   */
  @UseGuards(JwtAuthGuard)
  @Patch('consultorios/:id/estado')
  async cambiarEstadoConsultorio(
    @Param('id', ParseUUIDPipe) consultorioId: string,
    @Body() dto: CambiarEstadoTenantDto,
    @Request() req: any,
  ) {
    this.verificarSuperAdmin(req);
    return this.saasService.cambiarEstadoConsultorio(consultorioId, dto);
  }

  /**
   * Panel SuperAdmin: Cambia directamente el plan de un consultorio cliente.
   */
  @UseGuards(JwtAuthGuard)
  @Patch('consultorios/:id/plan')
  async cambiarPlanTenant(
    @Param('id', ParseUUIDPipe) consultorioId: string,
    @Body() dto: CambiarPlanDto,
    @Request() req: any,
  ) {
    this.verificarSuperAdmin(req);
    return this.saasService.cambiarPlan(consultorioId, dto);
  }
}
