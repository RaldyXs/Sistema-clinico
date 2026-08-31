import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

/**
 * Función principal de arranque (bootstrap) de la API.
 * NestJS utiliza esta función para inicializar la aplicación.
 */
async function bootstrap() {
  // Creamos la instancia de la aplicación basándonos en el módulo raíz (AppModule).
  const app = await NestFactory.create(AppModule);

  // Iniciamos el servidor escuchando en el puerto definido en las variables de entorno,
  // o en el puerto 3000 por defecto (el que definimos en .env.example).
  await app.listen(process.env.PORT ?? 3000);
}

// Ejecutamos la función de arranque
await bootstrap();