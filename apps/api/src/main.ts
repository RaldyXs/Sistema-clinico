import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import type { NestExpressApplication } from '@nestjs/platform-express';

/**
 * Función principal de arranque (bootstrap) de la API.
 * NestJS utiliza esta función para inicializar la aplicación.
 */
async function bootstrap() {
  // Creamos la instancia de la aplicación basándonos en el módulo raíz (AppModule).
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Trust proxy para Docker / Nginx reverse proxy
  app.set('trust proxy', true);

  // 1. Cabeceras de seguridad HTTP (Helmet)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // 2. CORS dinámico compatible con credentials: true
  const corsOrigins = configService.get<string>('CORS_ORIGINS');
  const allowedOrigins = corsOrigins
    ? corsOrigins.split(',').map((o) => o.trim().toLowerCase())
    : ['*'];

  app.enableCors({
    origin: (origin, callback) => {
      // Peticiones sin origen (herramientas locales, curl, etc.)
      if (!origin) return callback(null, true);

      // Si está configurado wildcard '*', reflejar el origen para permitir credentials
      if (allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin.toLowerCase())) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });

  // 3. Activamos la tubería de validación global (ValidationPipe).
  // Esto hace que class-validator revise automáticamente cada DTO en cada petición.
  // - whitelist: true elimina cualquier propiedad no declarada en el DTO (seguridad).
  // - transform: true convierte automáticamente los tipos (strings a números, objetos a instancias de clase).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Iniciamos el servidor escuchando en el puerto definido en las variables de entorno,
  // o en el puerto 3000 por defecto. Bind a 0.0.0.0 para contenedores Docker.
  const port = configService.get<string>('API_PORT') ?? process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
}

// Ejecutamos la función de arranque
await bootstrap();