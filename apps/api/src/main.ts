import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

/**
 * Función principal de arranque (bootstrap) de la API.
 * NestJS utiliza esta función para inicializar la aplicación.
 */
async function bootstrap() {
  // Creamos la instancia de la aplicación basándonos en el módulo raíz (AppModule).
  const app = await NestFactory.create(AppModule);

  // 1. Habilitamos CORS para permitir peticiones desde la aplicación web (Vite en puerto 5173)
  app.enableCors();

  // 2. Activamos la tubería de validación global (ValidationPipe).
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
  // o en el puerto 3000 por defecto (el que definimos en .env.example).
  const port = process.env.API_PORT ?? process.env.PORT ?? 3000;
  await app.listen(port);
}

// Ejecutamos la función de arranque
await bootstrap();