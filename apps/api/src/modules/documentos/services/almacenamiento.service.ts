import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ArchivoSubido } from '../interfaces/archivo-subido.interface.js';

/**
 * Servicio de Almacenamiento Físico de Archivos.
 *
 * Principios de seguridad y arquitectura:
 * - Particionamiento por tenant: Cada consultorio almacena sus archivos en una carpeta aislada:
 *   `uploads/tenants/{consultorioId}/`.
 * - Ofuscación de nombres: Los archivos se renombran a UUID v4 con extensión saneada para impedir
 *   ataques de Directory Traversal o ejecución de scripts arbitrarios.
 * - Integridad: Calcula el hash SHA-256 de cada archivo para garantizar inmutabilidad.
 * - Validación estricta de tipos MIME permitidos en el entorno médico.
 */
@Injectable()
export class AlmacenamientoService {
  private readonly logger = new Logger(AlmacenamientoService.name);
  private readonly baseUploadDir: string;

  /** Extensiones y tipos MIME permitidos en el ámbito clínico */
  private readonly tiposPermitidos = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/dicom',
    'application/dicom',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);

  constructor(private readonly configService: ConfigService) {
    const configuredDir = this.configService.get<string>('UPLOAD_DIR');
    if (configuredDir) {
      this.baseUploadDir = path.resolve(configuredDir);
    } else {
      const cwd = process.cwd();
      const parentRoot = path.resolve(cwd, '..', '..');
      if (fs.existsSync(path.join(parentRoot, 'package.json'))) {
        this.baseUploadDir = path.join(parentRoot, 'uploads');
      } else {
        this.baseUploadDir = path.join(cwd, 'uploads');
      }
    }

    if (!fs.existsSync(this.baseUploadDir)) {
      fs.mkdirSync(this.baseUploadDir, { recursive: true });
    }
  }

  /**
   * Valida y guarda físicamente el archivo en el directorio correspondiente al consultorio.
   */
  async guardarArchivo(
    consultorioId: string,
    file: ArchivoSubido,
  ): Promise<{
    nombreOriginal: string;
    nombreAlmacenado: string;
    mimeType: string;
    pesoBytes: number;
    hashSha256: string;
    rutaRelativa: string;
  }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No se ha proporcionado un archivo válido');
    }

    // 1. Validar tipo MIME
    if (!this.tiposPermitidos.has(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido (${file.mimetype}). Se admiten PDF, imágenes (JPG, PNG, WEBP), DICOM y documentos de texto.`,
      );
    }

    // 2. Extraer y sanear extensión
    const extOriginal = path.extname(file.originalname).toLowerCase();
    const extensionValida = extOriginal.match(/^\.[a-z0-9]{1,8}$/) ? extOriginal : '.bin';

    // 3. Generar identificador único y nombres seguros
    const idUnico = crypto.randomUUID();
    const nombreAlmacenado = `${idUnico}${extensionValida}`;

    // 4. Directorio del tenant
    const dirTenantRelativo = path.join('tenants', consultorioId);
    const dirTenantAbsoluto = path.join(this.baseUploadDir, dirTenantRelativo);

    if (!fs.existsSync(dirTenantAbsoluto)) {
      await fs.promises.mkdir(dirTenantAbsoluto, { recursive: true });
    }

    const rutaAbsoluta = path.join(dirTenantAbsoluto, nombreAlmacenado);
    const rutaRelativa = path.join(dirTenantRelativo, nombreAlmacenado).replace(/\\/g, '/');

    // 5. Prevenir Directory Traversal verificando que la ruta pertenezca al directorio base
    const resolvedPath = path.resolve(rutaAbsoluta);
    if (!resolvedPath.startsWith(this.baseUploadDir)) {
      throw new BadRequestException('Ruta de archivo inválida');
    }

    // 6. Escribir archivo en disco y calcular hash SHA-256
    await fs.promises.writeFile(rutaAbsoluta, file.buffer);
    const hashSha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');

    this.logger.log(`Archivo guardado: ${nombreAlmacenado} (${file.size} bytes) para consultorio ${consultorioId}`);

    return {
      nombreOriginal: file.originalname,
      nombreAlmacenado,
      mimeType: file.mimetype,
      pesoBytes: file.size,
      hashSha256,
      rutaRelativa,
    };
  }

  /**
   * Resuelve la ruta absoluta de un archivo verificando que no escape del directorio base.
   */
  obtenerRutaAbsoluta(rutaRelativa: string): string {
    const rutaAbsoluta = path.resolve(this.baseUploadDir, rutaRelativa);
    if (!rutaAbsoluta.startsWith(this.baseUploadDir)) {
      throw new BadRequestException('Acceso no autorizado al sistema de archivos');
    }
    return rutaAbsoluta;
  }

  /**
   * Elimina un archivo físico del disco si existe.
   */
  async eliminarArchivo(rutaRelativa: string): Promise<boolean> {
    try {
      const rutaAbsoluta = this.obtenerRutaAbsoluta(rutaRelativa);
      if (fs.existsSync(rutaAbsoluta)) {
        await fs.promises.unlink(rutaAbsoluta);
        return true;
      }
      return false;
    } catch (err) {
      this.logger.error(`Error al eliminar archivo en ${rutaRelativa}`, err);
      return false;
    }
  }
}
