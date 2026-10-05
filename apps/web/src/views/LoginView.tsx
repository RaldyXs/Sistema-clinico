import * as React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Lock,
  Mail,
  ShieldCheck,
  AlertCircle,
  Building2,
  Sun,
  Moon,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  CreditCard,
  ArrowRight,
  Users,
} from 'lucide-react';

export function LoginView() {
  const { login, quickLogin, isLoading, sessionExpiredMsg } = useAuth();

  // Formulario Login
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Modal para solicitar acceso comercial / información de alta
  const [showModalContacto, setShowModalContacto] = React.useState(false);

  // Selector Demo colapsable
  const [showDemoPanel, setShowDemoPanel] = React.useState(true);

  const isSandboxOrDev =
    import.meta.env.DEV ||
    (typeof window !== 'undefined' &&
      (window.location.hostname.includes('192.168.') ||
        window.location.hostname.includes('10.') ||
        window.location.hostname.includes('172.') ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'));

  const [isDark, setIsDark] = React.useState(() => {
    try {
      const saved = localStorage.getItem('theme_clinico');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark') ||
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        try { localStorage.setItem('theme_clinico', 'dark'); } catch {}
      } else {
        document.documentElement.classList.remove('dark');
        try { localStorage.setItem('theme_clinico', 'light'); } catch {}
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  const handleQuickLogin = async (type: 'carlos' | 'elena' | 'superadmin' | 'medico' | 'secretaria') => {
    setError(null);
    try {
      await quickLogin(type);
    } catch (err: any) {
      setError(err.message || 'Error en acceso rápido');
    }
  };

  return (
    <div className="h-full min-h-full w-full flex flex-col lg:flex-row bg-background text-foreground overflow-hidden">
      {/* ========================================================= */}
      {/* COLUMNA IZQUIERDA: SHOWCASE & PROPUESTA DE VALOR (Desktop) */}
      {/* ========================================================= */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 xl:p-16 relative bg-slate-950 text-white overflow-hidden border-r border-slate-800">
        {/* Luces ambientales y efectos de fondo */}
        <div className="absolute -top-32 -left-32 size-[500px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 -right-32 size-[450px] rounded-full bg-sky-500/15 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 left-1/4 size-[400px] rounded-full bg-emerald-500/15 blur-[120px] pointer-events-none" />

        {/* Patrón de cuadrícula tenue */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Encabezado de Marca */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-gradient-to-tr from-primary to-sky-400 p-0.5 shadow-lg shadow-primary/25">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Activity className="size-6 text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white font-sans">
                  Sistema Clínico
                </span>
                <Badge className="bg-primary/20 text-primary-foreground border-primary/30 text-[10px] uppercase font-mono tracking-wider">
                  v2.4 SaaS
                </Badge>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Plataforma de Gestión Integral
              </p>
            </div>
          </div>

          <div className="pt-8 max-w-lg space-y-3">
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Plataforma de Gestión Integral
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Espacio de trabajo unificado para la atención de pacientes, recepción, administración y control de operaciones.
            </p>
          </div>

          {/* Accesos y áreas: Etiquetas ligeras sin saturación de texto */}
          <div className="flex flex-wrap gap-2.5 pt-4">
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 font-medium backdrop-blur-sm">
              <Users className="size-3.5 text-sky-400" /> Recepción y Agenda
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 font-medium backdrop-blur-sm">
              <Stethoscope className="size-3.5 text-emerald-400" /> Atención y Consultas
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 font-medium backdrop-blur-sm">
              <CreditCard className="size-3.5 text-purple-400" /> Caja y Administración
            </span>
          </div>
        </div>

        {/* Pie de Marca y Estado de Sistema */}
        <div className="relative z-10 pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-medium text-slate-300">
              Servicio en línea
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Conexión Segura</span>
            <span>•</span>
            <span>Alta Disponibilidad</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* COLUMNA DERECHA: ACCESO, REGISTRO Y MODO DEMO              */}
      {/* ========================================================= */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 overflow-y-auto relative bg-background">
        {/* Barra superior con selector de tema */}
        <div className="flex items-center justify-between pb-6">
          {/* Logo visible solo en Mobile/Tablet */}
          <div className="flex lg:hidden items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Activity className="size-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">
              Sistema Clínico
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-xl border-border bg-card hover:bg-muted"
              onClick={toggleTheme}
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-slate-600" />}
            </Button>
          </div>
        </div>

        {/* Contenedor central del formulario */}
        <div className="w-full max-w-md mx-auto my-auto space-y-6">
          {/* Mensajes de error o sesión expirada */}
          {(error || sessionExpiredMsg) && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
                error
                  ? 'bg-destructive/10 border-destructive/25 text-destructive'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
              }`}
            >
              <AlertCircle className="size-4 shrink-0" />
              <span className="font-medium">{error || sessionExpiredMsg}</span>
            </div>
          )}

          <div className="space-y-6">
              <div className="space-y-1 text-left">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Iniciar Sesión
                </h2>
                <p className="text-xs text-muted-foreground">
                  Ingresa tus credenciales para acceder a tu espacio de trabajo.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Mail className="size-3.5 text-muted-foreground" /> Correo Electrónico
                  </label>
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="tu.correo@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-10 text-xs pl-3.5 bg-card"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Lock className="size-3.5 text-muted-foreground" /> Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        alert(
                          'Para restablecer tu contraseña, contacta al administrador de tu centro.'
                        )
                      }
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-10 text-xs pl-3.5 pr-10 bg-card font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                      title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="size-3.5 rounded border-input text-primary focus:ring-primary/20 accent-primary"
                    />
                    <span className="text-xs text-muted-foreground">Recordar en este equipo</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 font-semibold text-xs shadow-md bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2 cursor-pointer"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    'Iniciando sesión...'
                  ) : (
                    <>
                      Iniciar Sesión <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* ========================================================= */}
              {/* SELECTOR PROFESIONAL DE DEMOSTRACIÓN / ROLES MULTI-TENANT */}
              {/* ========================================================= */}
              {isSandboxOrDev && (
              <div className="pt-2 border-t border-border space-y-3">
                <div
                  onClick={() => setShowDemoPanel(!showDemoPanel)}
                  className="flex items-center justify-between cursor-pointer py-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-emerald-500" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Accesos Rápidos de Prueba (Demo)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                      Sandbox
                    </Badge>
                    {showDemoPanel ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  </div>
                </div>

                {showDemoPanel && (
                  <div className="space-y-2.5 animate-in fade-in duration-200">
                    {/* Perfiles de Clínica: Centro Médico Del Sol */}
                    <div>
                      <div className="text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                        <Building2 className="size-3 text-primary" /> Roles de Clínica (Centro Médico Del Sol):
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {/* Dr. Carlos - Admin */}
                        <button
                          type="button"
                          onClick={() => handleQuickLogin('carlos')}
                          disabled={isLoading}
                          className="p-2.5 rounded-lg border border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/10 transition-all text-left flex flex-col justify-between group"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="size-6 rounded-md bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xs font-bold shrink-0">
                              👨‍⚕️
                            </div>
                            <span className="text-[11px] font-bold text-foreground truncate">
                              Dr. Carlos
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground leading-tight">
                            Director / Admin
                          </div>
                          <span className="text-[9px] text-sky-600 dark:text-sky-400 font-medium mt-0.5">
                            Acceso Total
                          </span>
                        </button>

                        {/* Dr. Roberto - Médico */}
                        <button
                          type="button"
                          onClick={() => handleQuickLogin('medico')}
                          disabled={isLoading}
                          className="p-2.5 rounded-lg border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-all text-left flex flex-col justify-between group"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="size-6 rounded-md bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                              🩺
                            </div>
                            <span className="text-[11px] font-bold text-foreground truncate">
                              Dr. Roberto
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground leading-tight">
                            Especialista
                          </div>
                          <span className="text-[9px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                            Historias & Recetas
                          </span>
                        </button>

                        {/* María - Secretaria */}
                        <button
                          type="button"
                          onClick={() => handleQuickLogin('secretaria')}
                          disabled={isLoading}
                          className="p-2.5 rounded-lg border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-all text-left flex flex-col justify-between group"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="size-6 rounded-md bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold shrink-0">
                              👩‍💼
                            </div>
                            <span className="text-[11px] font-bold text-foreground truncate">
                              María
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground leading-tight">
                            Recepción & Caja
                          </div>
                          <span className="text-[9px] text-purple-600 dark:text-purple-400 font-medium mt-0.5">
                            Cobros & Citas
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Clínica Aislada: San Rafael */}
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('elena')}
                      disabled={isLoading}
                      className="w-full p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all text-left flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                          🏥
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-foreground truncate">
                            Dra. Elena Ramos (Clínica San Rafael)
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Tenant completamente separado (aislamiento verificado)
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 text-[9px] shrink-0">
                        Multi-tenant
                      </Badge>
                    </button>
                  </div>
                )}
              </div>
              )}

              <div className="pt-4 border-t border-border/60 text-center">
                <button
                  type="button"
                  onClick={() => setShowModalContacto(true)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  ¿Tu centro aún no tiene cuenta?{' '}
                  <span className="text-primary hover:underline font-medium">Solicitar acceso</span>
                </button>
              </div>
            </div>
        </div>

        {/* Modal Informativo: Solicitar Alta y Contactar Ventas */}
        {showModalContacto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      Adquisición y Alta de Clínicas
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Plataforma de gestión clínica privada
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModalContacto(false)}
                  className="size-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-muted-foreground">
                <p className="text-foreground font-medium">
                  Para registrar tu clínica o consultorio y coordinar la activación mediante transferencia bancaria, comunícate con nuestro equipo:
                </p>

                <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-2">
                      <Mail className="size-3.5 text-primary" /> Correo Comercial:
                    </span>
                    <span className="font-mono text-foreground font-bold">ventas@sistemaclinico.com</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-2">
                      <Activity className="size-3.5 text-emerald-500" /> Atención / WhatsApp:
                    </span>
                    <span className="font-mono text-foreground font-bold">+1 (800) 555-CLINIC</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5 text-[11px]">
                  <div className="font-semibold text-primary flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5" /> Proceso de Aprovisionamiento:
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Solicitas la cotización según la cantidad de médicos y personal.</li>
                    <li>Realizas la transferencia bancaria a la cuenta oficial.</li>
                    <li>El Administrador da de alta tu centro médico y te entrega tus accesos de inmediato.</li>
                  </ol>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => setShowModalContacto(false)}
                  className="w-full text-xs font-semibold"
                >
                  Entendido, volver al inicio
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Pie de página con copyright y legal */}
        <div className="pt-8 text-center text-[11px] text-muted-foreground space-y-1">
          <div className="flex items-center justify-center gap-3">
            <span className="hover:underline cursor-pointer">Privacidad</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Términos</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Soporte Técnico</span>
          </div>
          <p>© 2026 Sistema Clínico. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}
