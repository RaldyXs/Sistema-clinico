import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
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
import { AuditoriaService } from '../auditoria/auditoria.service.js';

@Injectable()
export class BackupsService {
  private readonly logger = new Logger(BackupsService.name);
  private readonly baseBackupDir = path.resolve(process.cwd(), 'uploads', 'backups');

  constructor(
    @InjectRepository(BackupRegistro)
    private readonly backupRepo: Repository<BackupRegistro>,

    @InjectRepository(Consultorio)
    private readonly consultorioRepo: Repository<Consultorio>,

    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,

    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,

    @InjectRepository(Cita)
    private readonly citaRepo: Repository<Cita>,

    @InjectRepository(Consulta)
    private readonly consultaRepo: Repository<Consulta>,

    @InjectRepository(Receta)
    private readonly recetaRepo: Repository<Receta>,

    @InjectRepository(DocumentoClinico)
    private readonly docRepo: Repository<DocumentoClinico>,

    @InjectRepository(HistoriaGinecologica)
    private readonly ginRepo: Repository<HistoriaGinecologica>,

    @InjectRepository(Embarazo)
    private readonly embarazoRepo: Repository<Embarazo>,

    @InjectRepository(ControlPrenatal)
    private readonly controlRepo: Repository<ControlPrenatal>,

    @InjectRepository(Ecografia)
    private readonly ecoRepo: Repository<Ecografia>,

    @InjectRepository(AuditoriaLog)
    private readonly auditRepo: Repository<AuditoriaLog>,

    private readonly auditoriaService: AuditoriaService,
  ) {
    if (!fs.existsSync(this.baseBackupDir)) {
      fs.mkdirSync(this.baseBackupDir, { recursive: true });
    }
  }

  /**
   * Genera una copia de seguridad lógica blindada y completa del consultorio (tenant).
   */
  async generarBackup(consultorioId: string, usuarioId: string, ipAddress?: string, userAgent?: string) {
    const consultorio = await this.consultorioRepo.findOne({ where: { id: consultorioId } });
    if (!consultorio) {
      throw new NotFoundException('Consultorio no encontrado');
    }

    // 1. Extraemos de forma aislada todos los registros pertenecientes al consultorio
    const [
      usuarios,
      pacientes,
      citas,
      consultas,
      recetas,
      documentos,
      historiasGinecologicas,
      embarazos,
      controlesPrenatales,
      ecografias,
      auditoria,
    ] = await Promise.all([
      this.usuarioRepo.find({
        where: { consultorioId },
        select: {
          id: true,
          email: true,
          nombre: true,
          apellido: true,
          especialidad: true,
          matriculaProfesional: true,
          telefono: true,
          rolCodigo: true,
          activo: true,
          creadoEn: true,
        },
      }),
      this.pacienteRepo.find({ where: { consultorioId } }),
      this.citaRepo.find({ where: { consultorioId } }),
      this.consultaRepo.find({ where: { consultorioId } }),
      this.recetaRepo.find({ where: { consultorioId } }),
      this.docRepo.find({ where: { consultorioId } }),
      this.ginRepo.find({ where: { consultorioId } }),
      this.embarazoRepo.find({ where: { consultorioId } }),
      this.controlRepo.find({ where: { consultorioId } }),
      this.ecoRepo.find({ where: { consultorioId } }),
      this.auditRepo.find({
        where: { consultorioId },
        order: { creadoEn: 'DESC' },
        take: 500,
      }),
    ]);

    const conteos = {
      usuarios: usuarios.length,
      pacientes: pacientes.length,
      citas: citas.length,
      consultas: consultas.length,
      recetas: recetas.length,
      documentos: documentos.length,
      historiasGinecologicas: historiasGinecologicas.length,
      embarazos: embarazos.length,
      controlesPrenatales: controlesPrenatales.length,
      ecografias: ecografias.length,
      auditoria: auditoria.length,
    };

    // 2. Estructuramos el archivo JSON del backup con su manifiesto
    const payloadBackup = {
      manifiesto: {
        sistema: 'Sistema Clínico SaaS',
        versionEsquema: '1.0.0',
        generadoEn: new Date().toISOString(),
        consultorio: {
          id: consultorio.id,
          nombre: consultorio.nombre,
          telefono: consultorio.telefono,
          direccion: consultorio.direccion,
        },
        conteos,
      },
      datos: {
        configuracion: consultorio,
        usuarios,
        pacientes,
        citas,
        consultas,
        recetas,
        documentos,
        ginecologia: {
          historias: historiasGinecologicas,
          embarazos,
          controles: controlesPrenatales,
          ecografias,
        },
        auditoria,
      },
    };

    const jsonString = JSON.stringify(payloadBackup, null, 2);
    const checksumSha256 = crypto.createHash('sha256').update(jsonString, 'utf-8').digest('hex');
    const tamanoBytes = Buffer.byteLength(jsonString, 'utf-8');

    // 3. Guardamos físicamente en disco por clínica
    const dirTenant = path.join(this.baseBackupDir, consultorioId);
    if (!fs.existsSync(dirTenant)) {
      fs.mkdirSync(dirTenant, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nombreArchivo = `backup_${consultorio.nombre.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${timestamp}.json`;
    const rutaArchivo = path.join(dirTenant, nombreArchivo);

    fs.writeFileSync(rutaArchivo, jsonString, 'utf-8');

    // 4. Registramos en base de datos
    const registro = this.backupRepo.create({
      consultorioId,
      usuarioId,
      nombreArchivo,
      rutaArchivo,
      tamanoBytes,
      checksumSha256,
      conteos,
      estado: 'GENERADO',
    });

    const guardado = await this.backupRepo.save(registro);

    // 5. Auditoría
    await this.auditoriaService.registrar({
      consultorioId,
      usuarioId,
      modulo: 'BACKUPS',
      accion: 'GENERAR_BACKUP',
      entidadTipo: 'BackupRegistro',
      entidadId: guardado.id,
      ipAddress,
      userAgent,
      detalles: {
        nombreArchivo,
        tamanoBytes,
        checksumSha256,
        conteos,
      },
    });

    return guardado;
  }

  /**
   * Lista los respaldos disponibles para el consultorio.
   */
  async listarBackups(consultorioId: string) {
    return this.backupRepo.find({
      where: { consultorioId },
      order: { creadoEn: 'DESC' },
    });
  }

  /**
   * Obtiene la ruta física del archivo con validación de pertenencia al consultorio.
   */
  async obtenerRutaDescarga(consultorioId: string, backupId: string, usuarioId: string, ipAddress?: string, userAgent?: string) {
    const backup = await this.backupRepo.findOne({
      where: { id: backupId, consultorioId },
    });

    if (!backup) {
      throw new NotFoundException('Copia de seguridad no encontrada');
    }

    if (!fs.existsSync(backup.rutaArchivo)) {
      throw new NotFoundException('El archivo físico del respaldo no se encuentra en el almacenamiento');
    }

    // Auditoría de descarga de datos clínicos sensibles
    await this.auditoriaService.registrar({
      consultorioId,
      usuarioId,
      modulo: 'BACKUPS',
      accion: 'DESCARGAR_BACKUP',
      entidadTipo: 'BackupRegistro',
      entidadId: backup.id,
      ipAddress,
      userAgent,
      detalles: { nombreArchivo: backup.nombreArchivo },
    });

    return {
      nombreArchivo: backup.nombreArchivo,
      rutaArchivo: backup.rutaArchivo,
      tamanoBytes: backup.tamanoBytes,
    };
  }

  /**
   * Verifica la integridad criptográfica del archivo de respaldo comparando su SHA-256.
   */
  async verificarIntegridad(consultorioId: string, backupId: string) {
    const backup = await this.backupRepo.findOne({
      where: { id: backupId, consultorioId },
    });

    if (!backup) {
      throw new NotFoundException('Copia de seguridad no encontrada');
    }

    if (!fs.existsSync(backup.rutaArchivo)) {
      return {
        valido: false,
        mensaje: 'El archivo físico del respaldo no existe en el servidor',
      };
    }

    const fileContent = fs.readFileSync(backup.rutaArchivo, 'utf-8');
    const hashCalculado = crypto.createHash('sha256').update(fileContent, 'utf-8').digest('hex');

    const coincide = hashCalculado === backup.checksumSha256;

    return {
      valido: coincide,
      backupId: backup.id,
      nombreArchivo: backup.nombreArchivo,
      checksumEsperado: backup.checksumSha256,
      checksumCalculado: hashCalculado,
      mensaje: coincide
        ? 'Integridad criptográfica verificada: El archivo no ha sufrido alteraciones ni corrupción'
        : 'Alerta de integridad: La suma de comprobación no coincide',
    };
  }
}
