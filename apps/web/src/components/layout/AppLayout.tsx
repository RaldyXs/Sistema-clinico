import * as React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  Building2,
  Menu,
  X,
  UserCheck,
  ShieldCheck,
  Globe2,
  Banknote,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'pacientes'
  | 'citas'
  | 'caja'
  | 'consultas'
  | 'recetas'
  | 'ginecologia'
  | 'reportes'
  | 'seguridad'
  | 'saas'
  | 'configuracion';

interface AppLayoutProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  children: React.ReactNode;
}

export function AppLayout({ currentTab, onSelectTab, children }: AppLayoutProps) {
  const { user, logout, quickLogin } = useAuth();
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
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

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
      try { localStorage.setItem('theme_clinico', 'dark'); } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      try { localStorage.setItem('theme_clinico', 'light'); } catch {}
    }
  }, [isDark]);

  const isSuperAdmin = user?.rolCodigo === 'SUPERADMIN';
  const isMedico = user?.rolCodigo === 'MEDICO';
  const isRecepcion = user?.rolCodigo === 'RECEPCION';

  const isSandboxOrDev =
    import.meta.env.DEV ||
    (typeof window !== 'undefined' &&
      (window.location.hostname.includes('192.168.') ||
        window.location.hostname.includes('10.') ||
        window.location.hostname.includes('172.') ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'));

  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode }> = React.useMemo(() => {
    if (isSuperAdmin) {
      return [
        { id: 'saas', label: 'Plataforma SaaS', icon: <Globe2 className="size-4" /> },
        { id: 'seguridad', label: 'Auditoría & Seguridad', icon: <ShieldCheck className="size-4" /> },
      ];
    }

    if (isRecepcion) {
      return [
        { id: 'citas', label: 'Agenda de Citas', icon: <Calendar className="size-4" /> },
        { id: 'pacientes', label: 'Pacientes', icon: <Users className="size-4" /> },
        { id: 'caja', label: 'Caja & Cobros', icon: <Banknote className="size-4" /> },
      ];
    }

    if (isMedico) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-4" /> },
        { id: 'pacientes', label: 'Pacientes', icon: <Users className="size-4" /> },
        { id: 'citas', label: 'Agenda de Citas', icon: <Calendar className="size-4" /> },
        { id: 'consultas', label: 'Consultas Médicas', icon: <Stethoscope className="size-4" /> },
        { id: 'recetas', label: 'Recetas y PDF', icon: <FileText className="size-4" /> },
      ];
    }

    // Administrador de Clínica (Cliente)
    return [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-4" /> },
      { id: 'pacientes', label: 'Pacientes', icon: <Users className="size-4" /> },
      { id: 'citas', label: 'Agenda de Citas', icon: <Calendar className="size-4" /> },
      { id: 'caja', label: 'Caja & Cobros', icon: <Banknote className="size-4" /> },
      { id: 'consultas', label: 'Consultas Médicas', icon: <Stethoscope className="size-4" /> },
      { id: 'recetas', label: 'Recetas y PDF', icon: <FileText className="size-4" /> },
      { id: 'reportes', label: 'Reportes & Métricas', icon: <BarChart3 className="size-4" /> },
      { id: 'seguridad', label: 'Seguridad & Backups', icon: <ShieldCheck className="size-4" /> },
      { id: 'configuracion', label: 'Configuración & Plan', icon: <Settings className="size-4" /> },
    ];
  }, [isSuperAdmin, isMedico, isRecepcion]);

  const clinicName = isSuperAdmin
    ? 'Plataforma SaaS Global'
    : (user?.consultorio?.nombre || 'Mi Consultorio');

  return (
    <div className="flex h-full w-full overflow-hidden bg-background text-foreground">
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 border-r border-border bg-card flex flex-col h-full shrink-0 transition-transform duration-200 print:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header de la Clínica */}
        <div className="h-14 border-b border-border px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`size-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs shrink-0 ${
              isSuperAdmin ? 'bg-amber-500 text-white' : 'bg-primary text-primary-foreground'
            }`}>
              {isSuperAdmin ? <Globe2 className="size-4" /> : <Building2 className="size-4" />}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate leading-tight">{clinicName}</div>
              <div className="text-[11px] text-muted-foreground truncate">
                {isSuperAdmin ? 'Panel Maestro SaaS' : 'Multi-Tenant SaaS'}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden size-7"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Links de navegación */}
        <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto min-h-0">
          {navItems.map((item) => {
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? isSuperAdmin
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Tenant / Role Switcher (Demo bar) */}
        {isSandboxOrDev && (
          <div className="p-2 px-3 border-t border-border/80 bg-muted/25 space-y-1.5 shrink-0">
            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1">
                <UserCheck className="size-3 text-emerald-500" /> Switch Rol / Perfil (Demo)
              </span>
            </div>
            <div className="space-y-1">
              <Button
                variant={isSuperAdmin ? "default" : "outline"}
                size="sm"
                className={`w-full text-[10px] h-6 px-2 justify-start ${
                  isSuperAdmin
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
                }`}
                onClick={() => quickLogin('superadmin')}
                title="Cambiar a consola SuperAdmin SaaS"
              >
                👑 <span className="ml-1 font-semibold">Tú (SuperAdmin SaaS)</span>
              </Button>
              <div className="text-[8px] font-semibold text-muted-foreground uppercase pt-0.5">
                Clínica Del Sol (Roles):
              </div>
              <div className="grid grid-cols-3 gap-1">
                <Button
                  variant={!isSuperAdmin && user?.email === 'dr.carlos@test.com' ? "secondary" : "outline"}
                  size="sm"
                  className="text-[9px] h-6 px-1 justify-center font-medium"
                  onClick={() => quickLogin('carlos')}
                  title="Director / Administrador de la clínica"
                >
                  🏥 Admin
                </Button>
                <Button
                  variant={!isSuperAdmin && user?.email === 'medico@test.com' ? "secondary" : "outline"}
                  size="sm"
                  className="text-[9px] h-6 px-1 justify-center font-medium text-sky-600 dark:text-sky-400"
                  onClick={() => quickLogin('medico')}
                  title="Médico asistencial"
                >
                  🩺 Méd
                </Button>
                <Button
                  variant={!isSuperAdmin && user?.email === 'recepcion@test.com' ? "secondary" : "outline"}
                  size="sm"
                  className="text-[9px] h-6 px-1 justify-center font-medium text-purple-600 dark:text-purple-400"
                  onClick={() => quickLogin('secretaria')}
                  title="Secretaria"
                >
                  📋 Sec
                </Button>
              </div>
              <Button
                variant={!isSuperAdmin && user?.email === 'elena.rios@test2.com' ? "secondary" : "outline"}
                size="sm"
                className="w-full text-[9px] h-5.5 px-1.5 justify-center border-border/80"
                onClick={() => quickLogin('elena')}
                title="Clínica San Rafael"
              >
                🏥 Dra. Elena (Clínica San Rafael)
              </Button>
            </div>
          </div>
        )}

        {/* Footer del usuario en el sidebar */}
        <div className="p-2.5 px-3.5 border-t border-border flex items-center justify-between shrink-0 bg-card">
          <div className="min-w-0 pr-2">
            <div className="text-xs font-semibold truncate leading-tight text-foreground">
              {user?.nombre} {user?.apellido || ''}
            </div>
            <div className="text-[10px] text-muted-foreground truncate leading-tight">
              {user?.especialidad || user?.rolCodigo || 'Médico'}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            title="Cerrar Sesión"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 size-8 cursor-pointer shrink-0 rounded-lg transition-colors"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden print:p-0 print:m-0">
        {/* Topbar */}
        <header className="h-14 border-b border-border bg-card/60 backdrop-blur-xs px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 print:hidden">
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden size-7"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="size-4" />
            </Button>
            {isSuperAdmin ? (
              <Badge variant="outline" className="text-xs font-semibold border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 py-0.5 px-2.5">
                👑 SuperAdmin — Control Plataforma SaaS
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary py-0.5 px-2.5">
                {clinicName}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={toggleTheme}
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4" />}
            </Button>
            <div className="hidden sm:block text-right text-xs">
              <span className="font-semibold text-foreground text-xs block leading-tight">
                {user?.nombre} {user?.apellido || ''}
              </span>
              <span className="block text-[10px] text-muted-foreground leading-none">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Dynamic View Content */}
        <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden p-4 sm:p-5 lg:p-6">
          <div className="max-w-7xl w-full mx-auto pb-28">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
