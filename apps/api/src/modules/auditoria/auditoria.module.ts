import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaLog } from './entities/auditoria-log.entity.js';
import { AuditoriaService } from './auditoria.service.js';
import { AuditoriaController } from './auditoria.controller.js';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditoriaLog])],
  controllers: [AuditoriaController],
  providers: [AuditoriaService],
  exports: [AuditoriaService, TypeOrmModule],
})
export class AuditoriaModule {}
