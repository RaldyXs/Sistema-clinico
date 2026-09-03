import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

/**
 * AppModule es el módulo raíz de la aplicación backend.
 */
@Module({
  imports: [
    // 1. Cargamos las variables de entorno desde la raíz del monorepo
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env', // Subimos dos niveles: api -> apps -> raíz
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}