import * as React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  Lock,
  Mail,
  KeyRound,
  Server,
  Activity,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertTriangle,
  Terminal,
} from 'lucide-react';

export function AdminLoginView() {
  const { login, quickLogin, isLoading, sessionExpiredMsg } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [token2FA, setToken2FA] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isSandboxOrDev =
    import.meta.env.DEV ||
    (typeof window !== 'undefined' &&
      (window.location.hostname.includes('192.168.') ||
        window.location.hostname.includes('10.') ||
        window.location.hostname.includes('172.') ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Error de autenticación administrativa');
    }
  };

  const handleQuickAdmin = async () => {
    setError(null);
    try {
      await quickLogin('superadmin');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión como SuperAdmin');
    }
  };

  const irAPortalClinico = () => {
    window.location.href = '/';
  };

  return (
    <div className="h-full min-h-full w-full flex items-center justify-center p-4 bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
      {/* Luces y efectos de fondo estilo ciberseguridad */}
      <div className="absolute -top-40 -left-40 size-[500px] rounded-full bg-amber-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 size-[500px] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="w-full max-w-lg relative z-10 space-y-6">
        {/* Botón de regreso discreto */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={irAPortalClinico}
            className="text-xs text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="size-3.5" /> Portal Clínico Regular
          </button>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] uppercase font-mono tracking-wider">
            Consola Restringida
          </Badge>
        </div>

        {/* Tarjeta Principal de Consola */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
          {/* Cabecera */}
          <div className="text-center space-y-3 pb-4 border-b border-slate-800">
            <div className="size-14 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/10">
              <ShieldAlert className="size-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                Consola Maestra SaaS
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Centro de Operaciones Global, Facturación MRR y Control de Infraestructura
              </p>
            </div>
          </div>

          {/* Banner de Advertencia de Ciberseguridad */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-amber-200">Área Restringida de Nivel 0</span>
              <p className="text-[11px] text-amber-300/80 leading-snug">
                Esta consola es exclusiva para el propietario del SaaS. Toda actividad queda registrada en la bitácora criptográfica con dirección IP y firma forense.
              </p>
            </div>
          </div>

          {(error || sessionExpiredMsg) && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <ShieldAlert className="size-4 shrink-0 text-rose-400" />
              <span>{error || sessionExpiredMsg}</span>
            </div>
          )}

          {/* Formulario de Acceso Maestro */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="size-3.5 text-amber-400" /> Correo Maestro de Infraestructura
              </label>
              <Input
                type="email"
                placeholder="superadmin@saas.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-950/80 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-amber-500 focus:ring-amber-500/20 h-10 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="size-3.5 text-amber-400" /> Contraseña de Operador Root
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-950/80 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-amber-500 focus:ring-amber-500/20 h-10 text-xs font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="size-3.5 text-amber-400" /> Token de Seguridad / 2FA
                </label>
                <span className="text-[10px] text-slate-500 font-mono">OPCIONAL (DEMO)</span>
              </div>
              <Input
                placeholder="Ej. 748-192 o Llave FIDO2"
                value={token2FA}
                onChange={(e) => setToken2FA(e.target.value)}
                className="bg-slate-950/80 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-amber-500 focus:ring-amber-500/20 h-10 text-xs font-mono"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
              disabled={isLoading}
            >
              <Terminal className="size-4" />
              {isLoading ? 'Verificando credenciales...' : 'Autenticar en Consola Global'}
            </Button>
          </form>

          {/* Acceso Rápido Sandbox SuperAdmin */}
          {isSandboxOrDev && (
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
              <span>Modo Desarrollador / Sandbox</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> Activo
              </span>
            </div>
            <button
              type="button"
              onClick={handleQuickAdmin}
              disabled={isLoading}
              className="w-full p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-all text-left flex items-center gap-3 group cursor-pointer"
            >
              <div className="size-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                👑
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Acceso Rápido Propietario (1-Click)</span>
                  <Badge className="bg-amber-500 text-slate-950 text-[9px] py-0 font-bold">
                    SuperAdmin
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  superadmin@saas.com • Control maestro de clínicas y MRR
                </p>
              </div>
            </button>
          </div>
          )}
        </div>

        {/* Pie de página de ciberseguridad */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500 px-2 font-mono">
          <div className="flex items-center gap-2">
            <Server className="size-3.5 text-emerald-500" />
            <span>NODO: saas-core-01 (LATAM-DO)</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="size-3.5 text-amber-500" />
            <span>TLS 1.3 • AES-256-GCM • SHA-256 AUDIT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
