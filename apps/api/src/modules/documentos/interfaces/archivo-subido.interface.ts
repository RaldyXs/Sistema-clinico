/**
 * Representación tipada de un archivo recibido en memoria mediante Multer.
 */
export interface ArchivoSubido {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
