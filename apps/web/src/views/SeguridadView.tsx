import * as React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Laptop,
  KeyRound,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  Unlock,
  FileCheck2,
  HardDrive,
  Copy,
  LogOut,
  Clock,
  Eye,
} from 'lucide-react';

interface AuditoriaItem {
  id: string;
  usuarioEmail: string;
  usuarioNombre: string;
  modulo: string;
  accion: string;
  entidadTipo: string | null;
  entidadId: string | null;
  detalles: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  creadoEn: string;
}

interface AuditoriaResumen {
  totalHoy: number;
  totalSemana: number;
  porModulo: Record<string, number>;
  ultimosEventos: AuditoriaItem[];
}

interface SesionItem {
  id: string;
  dispositivo: string;
  ipAddress: string | null;
  userAgent: string | null;
  ultimoAcceso: string;
  creadoEn: string;
  esActual: boolean;
}

interface BackupItem {
  id: string;
  nombreArchivo: string;
  tamanoBytes: number;
  checksumSha256: string;
  conteos: Record<string, number> | null;
  estado: string;
  creadoEn: string;
}

export function SeguridadView() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = React.useState<'auditoria' | '2fa' | 'backups'>('auditoria');

  // Estados Auditoría
  const [resumen, setResumen] = React.useState<AuditoriaResumen | null>(null);
  const [logs, setLogs] = React.useState<AuditoriaItem[]>([]);
  const [filtroModulo, setFiltroModulo] = React.useState('TODOS');
  const [busqueda, setBusqueda] = React.useState('');
  const [selectedLog, setSelectedLog] = React.useState<AuditoriaItem | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = React.useState(false);

  // Estados 2FA y Sesiones
  const [is2faActive, setIs2faActive] = React.useState(user?.twoFactorEnabled ?? false);
  const [setupData, setSetupData] = React.useState<{ secret: string; qrUri: string } | null>(null);
  const [totpCodeInput, setTotpCodeInput] = React.useState('');
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[]>([]);
  const [disablePassword, setDisablePassword] = React.useState('');
  const [disableTotp, setDisableTotp] = React.useState('');
  const [showDisableModal, setShowDisableModal] = React.useState(false);
  const [sesiones, setSesiones] = React.useState<SesionItem[]>([]);
  const [mensaje2fa, setMensaje2fa] = React.useState<string | null>(null);

  // Estados Backups
  const [backups, setBackups] = React.useState<BackupItem[]>([]);
  const [isGeneratingBackup, setIsGeneratingBackup] = React.useState(false);
  const [verificacionResultado, setVerificacionResultado] = React.useState<{
    backupId: string;
    valido: boolean;
    mensaje: string;
  } | null>(null);

  const fetchAuditoria = React.useCallback(async () => {
    if (!token) return;
    setIsLoadingLogs(true);
    try {
      const [resResumen, resLogs] = await Promise.all([
        fetch('http://localhost:3000/auditoria/resumen', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:3000/auditoria?limite=50', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (resResumen.ok) {
        const data = await resResumen.json();
        setResumen(data);
      }
      if (resLogs.ok) {
        const data = await resLogs.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Error cargando auditoría:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [token]);

  const fetchSesiones = React.useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3000/auth/sesiones', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSesiones(data);
      }
    } catch (e) {
      console.error('Error cargando sesiones:', e);
    }
  }, [token]);

  const fetchBackups = React.useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3000/backups', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      }
    } catch (e) {
      console.error('Error cargando backups:', e);
    }
  }, [token]);

  React.useEffect(() => {
    if (activeTab === 'auditoria') {
      fetchAuditoria();
    } else if (activeTab === '2fa') {
      fetchSesiones();
    } else if (activeTab === 'backups') {
      fetchBackups();
    }
  }, [activeTab, fetchAuditoria, fetchSesiones, fetchBackups]);

  // Handlers 2FA
  const handleIniciarSetup2fa = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3000/auth/2fa/setup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSetupData(data);
        setMensaje2fa(null);
      }
    } catch (e) {
      console.error('Error al iniciar 2FA:', e);
    }
  };

  const handleConfirmar2fa = async () => {
    if (!token || !totpCodeInput) return;
    try {
      const res = await fetch('http://localhost:3000/auth/2fa/confirmar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ codigo: totpCodeInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setIs2faActive(true);
        setRecoveryCodes(data.recoveryCodes || []);
        setSetupData(null);
        setTotpCodeInput('');
        setMensaje2fa('¡Autenticación de doble factor habilitada correctamente!');
      } else {
        setMensaje2fa(data.message || 'Código incorrecto');
      }
    } catch (e) {
      console.error('Error confirmando 2FA:', e);
    }
  };

  const handleDesactivar2fa = async () => {
    if (!token || !disablePassword || !disableTotp) return;
    try {
      const res = await fetch('http://localhost:3000/auth/2fa/desactivar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: disablePassword, codigo: disableTotp }),
      });
      if (res.ok) {
        setIs2faActive(false);
        setShowDisableModal(false);
        setDisablePassword('');
        setDisableTotp('');
        setRecoveryCodes([]);
        setMensaje2fa('2FA desactivado correctamente');
      } else {
        const data = await res.json();
        setMensaje2fa(data.message || 'Error al desactivar 2FA');
      }
    } catch (e) {
      console.error('Error desactivando 2FA:', e);
    }
  };

  const handleRevocarSesion = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3000/auth/sesiones/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchSesiones();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || 'No se pudo revocar la sesión');
      }
    } catch (e) {
      console.error('Error revocando sesión:', e);
    }
  };

  const handleRevocarOtrasSesiones = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3000/auth/sesiones/otras', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchSesiones();
      }
    } catch (e) {
      console.error('Error revocando otras sesiones:', e);
    }
  };

  // Handlers Backups
  const handleGenerarBackup = async () => {
    if (!token) return;
    setIsGeneratingBackup(true);
    try {
      const res = await fetch('http://localhost:3000/backups/generar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchBackups();
      }
    } catch (e) {
      console.error('Error generando backup:', e);
    } finally {
      setIsGeneratingBackup(false);
    }
  };

  const handleVerificarIntegridad = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3000/backups/${id}/verificar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVerificacionResultado({
          backupId: id,
          valido: data.valido,
          mensaje: data.mensaje,
        });
      }
    } catch (e) {
      console.error('Error verificando integridad:', e);
    }
  };

  const handleDescargarBackup = async (id: string, nombreArchivo: string) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3000/backups/${id}/descargar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error('Error descargando backup:', e);
    }
  };

  const logsFiltrados = logs.filter((log) => {
    const cumpleModulo = filtroModulo === 'TODOS' || log.modulo === filtroModulo;
    const cumpleBusqueda =
      !busqueda ||
      log.usuarioEmail.toLowerCase().includes(busqueda.toLowerCase()) ||
      log.usuarioNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      log.accion.toLowerCase().includes(busqueda.toLowerCase()) ||
      (log.entidadTipo && log.entidadTipo.toLowerCase().includes(busqueda.toLowerCase()));
    return cumpleModulo && cumpleBusqueda;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="size-7 text-primary" />
            Seguridad Avanzada, Auditoría y Respaldos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cumplimiento normativo HIPAA / GDPR, trazabilidad de accesos clínicos, autenticación en dos factores (2FA) y copias de seguridad aisladas por clínica.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-muted rounded-lg border border-border">
          <button
            onClick={() => setActiveTab('auditoria')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'auditoria' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Auditoría Clínica
          </button>
          <button
            onClick={() => setActiveTab('2fa')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === '2fa' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            2FA & Sesiones
          </button>
          <button
            onClick={() => setActiveTab('backups')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'backups' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Copias de Seguridad
          </button>
        </div>
      </div>

      {/* TAB 1: AUDITORÍA CLÍNICA */}
      {activeTab === 'auditoria' && (
        <div className="space-y-6">
          {/* Métricas Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Eventos Hoy</p>
                  <p className="text-2xl font-bold mt-1 text-primary">{resumen?.totalHoy ?? 0}</p>
                </div>
                <Clock className="size-8 text-primary/30" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Últimos 7 Días</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-600">{resumen?.totalSemana ?? 0}</p>
                </div>
                <ShieldCheck className="size-8 text-emerald-500/30" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Eventos de Acceso (Auth)</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{resumen?.porModulo?.['AUTH'] ?? 0}</p>
                </div>
                <KeyRound className="size-8 text-blue-500/30" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Eventos de Seguridad</p>
                  <p className="text-2xl font-bold mt-1 text-amber-600">{resumen?.porModulo?.['SEGURIDAD'] ?? 0}</p>
                </div>
                <ShieldAlert className="size-8 text-amber-500/30" />
              </CardContent>
            </Card>
          </div>

          {/* Filtros y Buscador */}
          <Card>
            <CardHeader className="p-4 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {['TODOS', 'AUTH', 'PACIENTES', 'CONSULTAS', 'RECETAS', 'SEGURIDAD', 'BACKUPS'].map((mod) => (
                  <button
                    key={mod}
                    onClick={() => setFiltroModulo(mod)}
                    className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${
                      filtroModulo === mod
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {mod}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Buscar por usuario, acción o entidad..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-72 text-xs"
                />
                <Button size="sm" variant="outline" onClick={fetchAuditoria} disabled={isLoadingLogs}>
                  <RefreshCw className={`size-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                    <tr>
                      <th className="p-2.5">Fecha y Hora</th>
                      <th className="p-2.5">Usuario Responsable</th>
                      <th className="p-2.5">Módulo</th>
                      <th className="p-2.5">Acción</th>
                      <th className="p-2.5">Entidad Afectada</th>
                      <th className="p-2.5">Dirección IP</th>
                      <th className="p-2.5 text-right">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logsFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          No se encontraron registros de auditoría para los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      logsFiltrados.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-2.5 whitespace-nowrap font-mono text-xs">
                            {new Date(item.creadoEn).toLocaleString('es-ES', {
                              dateStyle: 'short',
                              timeStyle: 'medium',
                            })}
                          </td>
                          <td className="p-2.5">
                            <div className="font-medium text-foreground">{item.usuarioNombre}</div>
                            <div className="text-muted-foreground text-[10px]">{item.usuarioEmail}</div>
                          </td>
                          <td className="p-2.5">
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {item.modulo}
                            </Badge>
                          </td>
                          <td className="p-2.5">
                            <Badge
                              className={`text-[10px] font-semibold ${
                                item.accion.includes('ELIMINAR') || item.accion.includes('REVOCAR')
                                  ? 'bg-red-500/15 text-red-700 border-red-200 dark:border-red-900'
                                  : item.accion.includes('CREAR') || item.accion.includes('ACTIVAR')
                                  ? 'bg-emerald-500/15 text-emerald-700 border-emerald-200 dark:border-emerald-900'
                                  : 'bg-blue-500/15 text-blue-700 border-blue-200 dark:border-blue-900'
                              }`}
                            >
                              {item.accion}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-muted-foreground">
                            {item.entidadTipo ? `${item.entidadTipo} ${item.entidadId ? `(${item.entidadId.slice(0, 8)}...)` : ''}` : '—'}
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-muted-foreground">
                            {item.ipAddress || '127.0.0.1'}
                          </td>
                          <td className="p-2.5 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="size-7 p-0"
                              onClick={() => setSelectedLog(item)}
                            >
                              <Eye className="size-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Modal Detalle JSON del Log */}
          {selectedLog && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-card border border-border rounded-xl shadow-xl max-w-lg w-full p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="size-5 text-primary" />
                    <h3 className="font-semibold text-base">Detalles del Evento de Auditoría</h3>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedLog(null)}>
                    ✕
                  </Button>
                </div>
                <div className="space-y-2 text-xs">
                  <div><span className="font-semibold">Módulo / Acción:</span> {selectedLog.modulo} — {selectedLog.accion}</div>
                  <div><span className="font-semibold">Usuario:</span> {selectedLog.usuarioNombre} ({selectedLog.usuarioEmail})</div>
                  <div><span className="font-semibold">Navegador / Cliente:</span> <span className="font-mono">{selectedLog.userAgent || '—'}</span></div>
                  <div>
                    <span className="font-semibold">Payload y Metadatos:</span>
                    <pre className="bg-muted p-3 rounded-md font-mono text-[11px] mt-1 overflow-x-auto max-h-48">
                      {JSON.stringify(selectedLog.detalles || {}, null, 2)}
                    </pre>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button size="sm" onClick={() => setSelectedLog(null)}>Cerrar</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 2FA & SESIONES */}
      {activeTab === '2fa' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 2FA */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="size-5 text-primary" />
                  <CardTitle className="text-base">Autenticación en Dos Factores (2FA)</CardTitle>
                </div>
                {is2faActive ? (
                  <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-300 font-semibold">
                    <CheckCircle2 className="size-3 mr-1 inline" /> Protegido
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    <AlertTriangle className="size-3 mr-1 inline" /> No Habilitado
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Protege tu cuenta y el acceso a los expedientes clínicos de tus pacientes exigiendo un código temporal de 6 dígitos emitido por una aplicación autenticadora (Google Authenticator, Microsoft Authenticator, 1Password).
              </p>

              {mensaje2fa && (
                <div className="p-3 bg-muted border border-border rounded-md text-xs font-medium text-foreground">
                  {mensaje2fa}
                </div>
              )}

              {!is2faActive && !setupData && (
                <Button onClick={handleIniciarSetup2fa} className="w-full flex items-center justify-center gap-2">
                  <Lock className="size-4" />
                  Configurar Autenticación 2FA
                </Button>
              )}

              {/* Paso de Activación con Clave Base32 y QR */}
              {setupData && !is2faActive && (
                <div className="border border-border rounded-lg p-4 bg-muted/40 space-y-4">
                  <p className="text-xs font-semibold text-foreground">
                    1. Ingresa esta clave secreta en tu aplicación autenticadora:
                  </p>
                  <div className="p-3 bg-card border rounded-md font-mono text-center font-bold tracking-widest text-primary text-sm flex items-center justify-between">
                    <span>{setupData.secret}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(setupData.secret)}
                      className="text-muted-foreground hover:text-foreground"
                      title="Copiar clave"
                    >
                      <Copy className="size-4" />
                    </button>
                  </div>

                  <p className="text-xs font-semibold text-foreground">
                    2. O copia el enlace universal otpauth:
                  </p>
                  <Input readOnly value={setupData.qrUri} className="text-[11px] font-mono" />

                  <p className="text-xs font-semibold text-foreground">
                    3. Ingresa el código de 6 dígitos que muestra tu aplicación:
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="000000"
                      maxLength={6}
                      value={totpCodeInput}
                      onChange={(e) => setTotpCodeInput(e.target.value.replace(/\D/g, ''))}
                      className="font-mono text-center tracking-widest text-base font-bold w-36"
                    />
                    <Button onClick={handleConfirmar2fa} disabled={totpCodeInput.length !== 6}>
                      Verificar y Activar
                    </Button>
                  </div>
                </div>
              )}

              {/* Códigos de Recuperación generados */}
              {recoveryCodes.length > 0 && (
                <div className="border border-emerald-200 bg-emerald-500/10 p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                    <CheckCircle2 className="size-4" />
                    Códigos de Respaldo de Emergencia (Guárdalos en un lugar seguro)
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs text-foreground bg-background p-3 rounded-md border border-border">
                    {recoveryCodes.map((c, i) => (
                      <div key={i} className="py-0.5">{c}</div>
                    ))}
                  </div>
                </div>
              )}

              {is2faActive && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 p-3 rounded-md border border-emerald-200">
                    <ShieldCheck className="size-4" />
                    <span>Tu cuenta cuenta con el más alto estándar de protección biométrica y temporal.</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-500/10 border-red-200"
                    onClick={() => setShowDisableModal(true)}
                  >
                    <Unlock className="size-4 mr-2" />
                    Desactivar Doble Factor
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card Sesiones Activas */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Laptop className="size-5 text-primary" />
                <CardTitle className="text-base">Sesiones y Dispositivos Activos</CardTitle>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRevocarOtrasSesiones}
                className="text-xs text-red-600 hover:text-red-700 border-red-200"
              >
                <LogOut className="size-3.5 mr-1" /> Cerrar Otras Sesiones
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Controla en tiempo real los equipos y navegadores donde tu usuario tiene sesiones abiertas. Puedes revocar el acceso de forma remota e inmediata.
              </p>

              <div className="space-y-2 mt-2">
                {sesiones.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {s.dispositivo.toLowerCase().includes('iphone') || s.dispositivo.toLowerCase().includes('android') ? (
                        <Smartphone className="size-5 text-primary" />
                      ) : (
                        <Laptop className="size-5 text-primary" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-foreground">{s.dispositivo}</span>
                          {s.esActual && (
                            <Badge className="bg-emerald-500/20 text-emerald-700 text-[10px] py-0">
                              Esta sesión
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          IP: <span className="font-mono">{s.ipAddress || '127.0.0.1'}</span> • Último acceso:{' '}
                          {new Date(s.ultimoAcceso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {!s.esActual && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRevocarSesion(s.id)}
                      >
                        Cerrar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Modal Desactivar 2FA */}
          {showDisableModal && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-card border border-border rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4">
                <h3 className="font-semibold text-base text-red-600 flex items-center gap-2">
                  <AlertTriangle className="size-5" /> Desactivar 2FA
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ingresa tu contraseña actual y un código de 6 dígitos de tu aplicación autenticadora para confirmar la desactivación.
                </p>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Contraseña actual"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Código 2FA (6 dígitos)"
                    maxLength={6}
                    value={disableTotp}
                    onChange={(e) => setDisableTotp(e.target.value.replace(/\D/g, ''))}
                    className="font-mono text-center tracking-widest text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => setShowDisableModal(false)}>
                    Cancelar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleDesactivar2fa}>
                    Confirmar Desactivación
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BACKUPS MULTI-TENANT */}
      {activeTab === 'backups' && (
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <HardDrive className="size-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm text-foreground">Portabilidad de Datos & Respaldos Aislados</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Genera copias de seguridad lógicas integrales que empaquetan pacientes, citas, historias clínicas, recetas y ecografías con suma de verificación criptográfica SHA-256 inalterable.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleGenerarBackup}
                disabled={isGeneratingBackup}
                className="shrink-0 flex items-center gap-2"
              >
                {isGeneratingBackup ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    Generando Respaldo...
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    Crear Respaldo Ahora
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {verificacionResultado && (
            <div
              className={`p-4 rounded-lg border text-xs flex items-center justify-between ${
                verificacionResultado.valido
                  ? 'bg-emerald-500/10 border-emerald-200 text-emerald-800 dark:text-emerald-300'
                  : 'bg-red-500/10 border-red-200 text-red-800 dark:text-red-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {verificacionResultado.valido ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <AlertTriangle className="size-4" />
                )}
                <span>{verificacionResultado.mensaje}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="size-6 p-0 text-current"
                onClick={() => setVerificacionResultado(null)}
              >
                ✕
              </Button>
            </div>
          )}

          {/* Tabla de Backups */}
          <Card>
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-base">Historial de Copias de Seguridad</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                    <tr>
                      <th className="p-2.5">Fecha</th>
                      <th className="p-2.5">Archivo</th>
                      <th className="p-2.5">Tamaño</th>
                      <th className="p-2.5">Checksum SHA-256</th>
                      <th className="p-2.5">Registros Exportados</th>
                      <th className="p-2.5">Estado</th>
                      <th className="p-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {backups.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          No hay copias de seguridad registradas. Haz clic en "Crear Respaldo Ahora" para generar la primera.
                        </td>
                      </tr>
                    ) : (
                      backups.map((b) => (
                        <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-2.5 whitespace-nowrap font-mono text-xs">
                            {new Date(b.creadoEn).toLocaleDateString('es-ES', {
                              dateStyle: 'medium',
                            })}
                          </td>
                          <td className="p-2.5 font-medium text-foreground max-w-xs truncate" title={b.nombreArchivo}>
                            {b.nombreArchivo}
                          </td>
                          <td className="p-2.5 font-mono text-muted-foreground">
                            {(b.tamanoBytes / 1024).toFixed(1)} KB
                          </td>
                          <td className="p-2.5 font-mono text-[10px] text-muted-foreground">
                            {b.checksumSha256.slice(0, 16)}...
                          </td>
                          <td className="p-2.5">
                            {b.conteos ? (
                              <div className="flex gap-1 flex-wrap">
                                <Badge variant="outline" className="text-[10px]">
                                  {b.conteos.pacientes ?? 0} pac.
                                </Badge>
                                <Badge variant="outline" className="text-[10px]">
                                  {b.conteos.consultas ?? 0} cons.
                                </Badge>
                                <Badge variant="outline" className="text-[10px]">
                                  {b.conteos.recetas ?? 0} rec.
                                </Badge>
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="p-2.5">
                            <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 text-[10px]">
                              {b.estado}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-right space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => handleVerificarIntegridad(b.id)}
                            >
                              <CheckCircle2 className="size-3.5 mr-1" />
                              Verificar
                            </Button>
                            <Button
                              size="sm"
                              className="text-xs"
                              onClick={() => handleDescargarBackup(b.id, b.nombreArchivo)}
                            >
                              <Download className="size-3.5 mr-1" />
                              Descargar
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
