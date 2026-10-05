/**
 * Cliente HTTP para comunicación con el backend de NestJS (@sistema-clinico/api).
 * Gestiona automáticamente el token JWT y los encabezados de autenticación.
 */

const defaultHost = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
const isStandardWebPort = typeof window !== 'undefined' && (window.location.port === '' || window.location.port === '80');
const API_BASE_URL = import.meta.env.VITE_API_URL || (isStandardWebPort ? '/api' : `http://${defaultHost}:3000`);

export class ApiError extends Error {
  statusCode: number;
  data?: any;

  constructor(statusCode: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const storedToken = token ?? localStorage.getItem('token_clinico');
  if (storedToken) {
    headers['Authorization'] = `Bearer ${storedToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  // Si es un archivo binario, PDF o petición de descarga
  const contentType = response.headers.get('content-type');
  if (
    endpoint.includes('/descargar') ||
    endpoint.includes('/pdf') ||
    (contentType &&
      (contentType.includes('application/pdf') ||
        contentType.includes('application/octet-stream') ||
        contentType.includes('image/')))
  ) {
    return (await response.blob()) as unknown as T;
  }

  const text = await response.text();
  let data: any = null;
  if (text && text.trim().length > 0) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    // Si el backend responde 401 Unauthorized (token expirado o inválido) en peticiones autenticadas
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('token_clinico');
      localStorage.removeItem('usuario_clinico');
      window.dispatchEvent(
        new CustomEvent('auth:expired', {
          detail: {
            message: 'Tu sesión ha expirado por seguridad (límite de 24 horas). Por favor, inicia sesión nuevamente.',
          },
        }),
      );
    }

    const errorMsg = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || `Error HTTP ${response.status}`;
    throw new ApiError(response.status, errorMsg, data);
  }

  return data as T;
}

export const api = {
  get: <T = any>(endpoint: string, token?: string | null) =>
    apiRequest<T>(endpoint, { method: 'GET' }, token),

  post: <T = any>(endpoint: string, body: any, token?: string | null) =>
    apiRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }, token),

  patch: <T = any>(endpoint: string, body: any, token?: string | null) =>
    apiRequest<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }, token),

  delete: <T = any>(endpoint: string, token?: string | null) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }, token),

  upload: <T = any>(endpoint: string, formData: FormData, token?: string | null) =>
    apiRequest<T>(endpoint, { method: 'POST', body: formData }, token),

  downloadBlob: async (endpoint: string, filename: string, token?: string | null) => {
    const blob = await apiRequest<Blob>(endpoint, { method: 'GET' }, token);
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  },
};
