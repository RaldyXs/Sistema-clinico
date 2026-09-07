import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupRegistro } from './entities/backup-registro.entity.js';
import { Consultorio } from '../consultorios/entities/consultorio.entity.js';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import { Paciente } from '../pacientes/entities/paciente.entity.js';
import { Cita } from '../citas/entities/cita.entity.js';
import { Consulta } from '../consultas/entities/consulta.entity.js';
import { Receta } from '../recetas/entities/receta.entity.js';
import { DocumentoClinico } from '../documentos/entities/documento-clinico.entity.js';
import { HistoriaGinecologica } from '../ginecologia/entities/historia-ginecologica.entity.js';
import { Embarazo } from '../ginecologia/entities/embarazo.entity.js';
import { ControlPrenatal } from '../ginecologia/entities/control-prenatal.entity.js';
import { Ecografia } from '../ginecologia/entities/ecografia.entity.js';
import { AuditoriaLog } from '../auditoria/entities/auditoria-log.entity.js';
import { BackupsService } from './backups.service.js';
import { BackupsController } from './backups.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BackupRegistro,
      Consultorio,
      Usuario,
      Paciente,
      Cita,
      Consulta,
      Receta,
      DocumentoClinico,
      HistoriaGinecologica,
      Embarazo,
      ControlPrenatal,
      Ecografia,
      AuditoriaLog,
    ]),
  ],
  controllers: [BackupsController],
  providers: [BackupsService],
  exports: [BackupsService],
})
export class BackupsModule {}
