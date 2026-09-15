import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { RolesModule } from './modules/roles/roles.module.js';
import { ConsultoriosModule } from './modules/consultorios/consultorios.module.js';
import { PacientesModule } from './modules/pacientes/pacientes.module.js';
import { CitasModule } from './modules/citas/citas.module.js';
import { ConsultasModule } from './modules/consultas/consultas.module.js';
import { RecetasModule } from './modules/recetas/recetas.module.js';
import { DocumentosModule } from './modules/documentos/documentos.module.js';
import { GinecologiaModule } from './modules/ginecologia/ginecologia.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { UsuariosModule } from './modules/usuarios/usuarios.module.js';
import { ReportesModule } from './modules/reportes/reportes.module.js';
import { AuditoriaModule } from './modules/auditoria/auditoria.module.js';
import { BackupsModule } from './modules/backups/backups.module.js';
import { SaasModule } from './modules/saas/saas.module.js';
import { CajaModule } from './modules/caja/caja.module.js';

/**
 * AppModule es el módulo raíz de la aplicación backend.
 */
@Module({
  imports: [
    // 1. Cargamos las variables de entorno desde la raíz del monorepo
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env', '../.env'],
    }),
    
    // 2. Configuramos la conexión a PostgreSQL usando TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true, // Sincroniza los modelos con la DB (solo para desarrollo local)
      }),
    }),

    // 3. Módulo de Autenticación y Seguridad
    AuthModule,

    // 4. Módulo de Roles y Permisos (RBAC)
    RolesModule,

    // 5. Módulo de Consultorios (Gestión de Organización y Aislamiento Multi-Tenant)
    ConsultoriosModule,

    // 6. Módulo Clínico: Pacientes (Fase 2)
    PacientesModule,

    // 7. Módulo Clínico: Citas y Agenda (Fase 3)
    CitasModule,

    // 8. Módulo Clínico: Consultas e Historia Clínica (Fase 4)
    ConsultasModule,

    // 9. Módulo Clínico: Recetas y Prescripciones Médicas (Fase 5)
    RecetasModule,

    // 10. Módulo Clínico: Almacenamiento y Documentos Adjuntos (Fase 5)
    DocumentosModule,

    // 11. Módulo Satélite de Especialidad: Ginecología y Obstetricia (Fase 6)
    GinecologiaModule,

    // 12. Módulo de Dashboard y KPIs en Tiempo Real (Fase 7)
    DashboardModule,

    // 13. Módulo de Administración de Personal y Usuarios (Fase 7)
    UsuariosModule,

    // 14. Módulo de Reportes Clínicos, Ausentismo y Productividad Médica (Fase 8)
    ReportesModule,

    // 15. Módulo de Auditoría Clínica Avanzada (Fase 9)
    AuditoriaModule,

    // 16. Módulo de Copias de Seguridad y Portabilidad de Datos (Fase 9)
    BackupsModule,

    // 17. Módulo de Planes, Suscripciones, Onboarding y SuperAdmin SaaS (Fase 10)
    SaasModule,

    // 18. Módulo Financiero, Caja Diaria y Cobros (Fase 11)
    CajaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}