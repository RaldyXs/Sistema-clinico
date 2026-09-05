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

    // 9. Módulo Clínico: Recetas y Documentos Médicos (Fase 5)
    RecetasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}