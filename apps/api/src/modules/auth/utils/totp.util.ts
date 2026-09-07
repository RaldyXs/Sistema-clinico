import crypto from 'node:crypto';

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Genera una clave secreta en base32 (160 bits / 20 bytes) compatible con RFC 6238.
 */
export function generateBase32Secret(length = 20): string {
  const buffer = crypto.randomBytes(length);
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodifica una cadena Base32 a Buffer binario.
 */
export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const charIdx = BASE32_CHARS.indexOf(clean[i]);
    if (charIdx === -1) continue;
    value = (value << 5) | charIdx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Genera el código numérico TOTP de 6 dígitos para un instante temporal dado.
 */
export function generateTotpCode(secret: string, timeStepSeconds = 30, offsetSteps = 0): string {
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStepSeconds) + offsetSteps;

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = (binary % 1000000).toString().padStart(6, '0');
  return otp;
}

/**
 * Verifica un código TOTP de 6 dígitos aplicando tolerancia de ventana (+/- window pasos).
 */
export function verifyTotpCode(secret: string, token: string, window = 1): boolean {
  if (!token || typeof token !== 'string') return false;
  const cleanToken = token.trim();
  if (!/^\d{6}$/.test(cleanToken)) return false;

  const targetBuf = Buffer.from(cleanToken);

  for (let i = -window; i <= window; i++) {
    const calculated = generateTotpCode(secret, 30, i);
    const calcBuf = Buffer.from(calculated);
    if (calcBuf.length === targetBuf.length && crypto.timingSafeEqual(calcBuf, targetBuf)) {
      return true;
    }
  }
  return false;
}

/**
 * Genera la URI estandarizada `otpauth://` para que aplicaciones móviles
 * (Google Authenticator, Microsoft Authenticator, 1Password) la reconozcan de inmediato.
 */
export function generateOtpAuthUri(accountName: string, issuer: string, secret: string): string {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const encIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Genera códigos alfanuméricos de respaldo (Recovery Codes) para el usuario.
 */
export function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const hex = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${hex.slice(0, 4)}-${hex.slice(4, 8)}`);
  }
  return codes;
}
