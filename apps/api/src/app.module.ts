import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

/**
 * AppModule es el módulo raíz de la aplicación backend.
 * Más adelante, todos los módulos de nuestra arquitectura (Pacientes, 
 * Consultorios, Citas) se importarán y orquestarán desde aquí.
 */
@Module({
  imports: [], // Aquí registraremos los futuros módulos del sistema
  controllers: [AppController], // Controladores que manejan las peticiones HTTP (rutas)
  providers: [AppService], // Servicios que contienen la lógica de negocio
})
export class AppModule {}