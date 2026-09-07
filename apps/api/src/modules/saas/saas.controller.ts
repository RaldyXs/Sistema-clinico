import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SaasService } from './saas.service.js';
import { OnboardingDto, CambiarPlanDto, CambiarEstadoTenantDto } from './dto/saas.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ConsultorioActual } from '../../common/decorators/consultorio-actual.decorator.js';

@Controller('saas')
export class SaasController {
  constructor(private readonly saasService: SaasService) {}

  // ==================== ENDPOINTS PÚBLICOS ====================

  /**
   * Catálogo de planes y precios comerciales disponibles en el SaaS.
   */
  @Get('planes')
  async listarPlanes() {
    return this.saasService.listarPlanes();
  }

  /**
   * Onboarding público: Registro autónomo de una nueva clínica/consultorio.
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
   * Permite al consultorio ascender o modificar su plan (Upgrade/Downgrade).
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
   * Panel SuperAdmin: Métricas globales consolidadas de la plataforma SaaS.
   */
  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  async obtenerDashboardGlobal() {
    return this.saasService.obtenerDashboardGlobal();
  }

  /**
   * Panel SuperAdmin: Directorio maestro de todas las clínicas clientes.
   */
  @UseGuards(JwtAuthGuard)
  @Get('consultorios')
  async listarTodosConsultorios() {
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
  ) {
    return this.saasService.cambiarEstadoConsultorio(consultorioId, dto);
  }
}
