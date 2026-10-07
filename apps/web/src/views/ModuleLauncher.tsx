import * as React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Stethoscope,
  Receipt,
  CalendarDays,
  Database,
  Settings2,
  LogOut,
  Moon,
  Sun,
  Building2,
  Globe2,
  Shield,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export type ModuloId =
  | 'gestion-medica'
  | 'facturacion'
  | 'secretaria'
  | 'base-datos'
  | 'administracion'
  | 'saas';

interface ModuloCard {
  id: ModuloId;
  label: string;
  descripcion: string;
  icon: React.ReactNode;
  color: string;       // Tailwind bg class for the icon circle
  textColor: string;   // Tailwind text class for the icon
  roles: string[];
}

const MODULOS: ModuloCard[] = [
  {
    id: 'gestion-medica',
    label: 'Gestión Médica',
    descripcion: 'Pacientes del día, consultas, recetas y diagnósticos.',
    icon: <Stethoscope className="size-8" />,
    color: 'bg-sky-500/10 dark:bg-sky-500/15',
    textColor: 'text-sky-600 dark:text-sky-400',
    roles: ['ADMIN', 'MEDICO'],
  },
  {
    id: 'facturacion',
    label: 'Facturación',
    descripcion: 'Emitir facturas por consulta, laboratorio, imagen y más.',
    icon: <Receipt className="size-8" />,
    color: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    roles: ['ADMIN', 'FACTURADOR'],
  },
  {
    id: 'secretaria',
    label: 'Secretaría',
    descripcion: 'Agendar citas, datos de pacientes y subir resultados.',
    icon: <CalendarDays className="size-8" />,
    color: 'bg-violet-500/10 dark:bg-violet-500/15',
    textColor: 'text-violet-600 dark:text-violet-400',
    roles: ['ADMIN', 'RECEPCION'],
  },
  {
    id: 'base-datos',
    label: 'Base de Datos',
    descripcion: 'Expedientes de pacientes con filtros y ficha completa.',
    icon: <Database className="size-8" />,
    color: 'bg-amber-500/10 dark:bg-amber-500/15',
    textColor: 'text-amber-600 dark:text-amber-400',
    roles: ['ADMIN', 'MEDICO', 'RECEPCION'],
  },
  {
    id: 'administracion',
    label: 'Administración',
    descripcion: 'Dashboard, reportes, seguridad y configuración.',
    icon: <Settings2 className="size-8" />,
    color: 'bg-rose-500/10 dark:bg-rose-500/15',
    textColor: 'text-rose-600 dark:text-rose-400',
    roles: ['ADMIN'],
  },
];

interface ModuleLauncherProps {
  onSelectModulo: (modulo: ModuloId) => void;
}

export function ModuleLauncher({ onSelectModulo }: ModuleLauncherProps) {
  const { user, logout, quickLogin } = useAuth();
  const [isDark, setIsDark] = React.useState(() => {
    try {
      const saved = localStorage.getItem('theme_clinico');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  const isSuperAdmin = user?.rolCodigo === 'SUPERADMIN';
  const rolCodigo = user?.rolCodigo ?? '';

  const isSandboxOrDev =
    import.meta.env.DEV ||
    (typeof window !== 'undefined' &&
      (window.location.hostname.includes('192.168.') ||
        window.location.hostname.includes('10.') ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'));

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

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // SuperAdmin tiene su propio módulo de plataforma
  if (isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <header className="h-14 border-b border-border bg-card/80 backdrop-blur-xs px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Globe2 className="size-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight">Gestia — Panel SaaS</div>
              <div className="text-[10px] text-muted-foreground">Plataforma Global</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="size-8" onClick={toggleTheme}>
              {isDark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4" />}
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={logout} title="Cerrar sesión">
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-sm">
            <div className="size-20 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
              <Globe2 className="size-10 text-amber-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Control SaaS</h2>
              <p className="text-sm text-muted-foreground mt-1">Panel de administración de la plataforma global.</p>
            </div>
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => onSelectModulo('saas')}
            >
              Acceder al Panel SaaS <ArrowRight className="size-4 ml-2" />
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const modulosVisibles = MODULOS.filter((m) => m.roles.includes(rolCodigo));
  const clinicName = user?.consultorio?.nombre || 'Mi Clínica';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-xs px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="size-4 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">Gestia</div>
            <div className="text-[10px] text-muted-foreground truncate max-w-[160px]">{clinicName}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="size-8" onClick={toggleTheme}>
            {isDark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4" />}
          </Button>
          <div className="hidden sm:block text-right text-xs">
            <span className="font-semibold text-foreground block leading-tight">
              {user?.nombre} {user?.apellido || ''}
            </span>
            <span className="text-[10px] text-muted-foreground">{user?.especialidad || rolCodigo}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={logout}
            title="Cerrar sesión"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      {/* Launcher principal */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-4xl space-y-8">
          {/* Saludo */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Bienvenido, {user?.nombre} 👋
            </h1>
            <p className="text-muted-foreground text-sm">
              Selecciona el módulo con el que deseas trabajar hoy.
            </p>
          </div>

          {/* Grilla de módulos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modulosVisibles.map((mod) => (
              <button
                key={mod.id}
                onClick={() => onSelectModulo(mod.id)}
                className="group relative flex flex-col items-start gap-4 p-6 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 text-left cursor-pointer"
              >
                <div className={`size-16 rounded-xl flex items-center justify-center ${mod.color} ${mod.textColor} transition-transform group-hover:scale-105 duration-200`}>
                  {mod.icon}
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-base leading-tight">{mod.label}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{mod.descripcion}</div>
                </div>
                <ArrowRight className="absolute bottom-5 right-5 size-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
              </button>
            ))}
          </div>

          {/* Sin módulos (edge case) */}
          {modulosVisibles.length === 0 && (
            <div className="text-center py-16 space-y-3">
              <Shield className="size-12 mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">Tu cuenta no tiene módulos asignados. Contacta al administrador.</p>
            </div>
          )}
        </div>
      </main>

      {/* Demo switcher (solo en dev/LAN) */}
      {isSandboxOrDev && (
        <div className="border-t border-border bg-muted/30 px-6 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <UserCheck className="size-3 text-emerald-500" /> Demo — Cambiar Rol:
          </span>
          <Button variant="outline" size="sm" className="text-[10px] h-6 px-2 border-amber-500/40 text-amber-600" onClick={() => quickLogin('superadmin')}>👑 SuperAdmin</Button>
          <Button variant="outline" size="sm" className="text-[10px] h-6 px-2" onClick={() => quickLogin('carlos')}>🏥 Admin</Button>
          <Button variant="outline" size="sm" className="text-[10px] h-6 px-2 text-sky-600" onClick={() => quickLogin('medico')}>🩺 Médico</Button>
          <Button variant="outline" size="sm" className="text-[10px] h-6 px-2 text-violet-600" onClick={() => quickLogin('secretaria')}>📋 Secretaría</Button>
        </div>
      )}
    </div>
  );
}
