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
  Baby,
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
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'pacientes'
  | 'citas'
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
  const [isDark, setIsDark] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  const isSuperAdmin = user?.rolCodigo === 'SUPERADMIN';
  const isMedico = user?.rolCodigo === 'MEDICO';
  const isRecepcion = user?.rolCodigo === 'RECEPCION';

  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode }> = React.useMemo(() => {
    if (isSuperAdmin) {
      return [
        { id: 'saas', label: 'Plataforma SaaS', icon: <Globe2 className="size-4" /> },
        { id: 'reportes', label: 'Métricas Globales', icon: <BarChart3 className="size-4" /> },
        { id: 'seguridad', label: 'Auditoría Global', icon: <ShieldCheck className="size-4" /> },
      ];
    }

    if (isRecepcion) {
      return [
        { id: 'citas', label: 'Agenda de Citas', icon: <Calendar className="size-4" /> },
        { id: 'pacientes', label: 'Pacientes', icon: <Users className="size-4" /> },
      ];
    }

    if (isMedico) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-4" /> },
        { id: 'pacientes', label: 'Pacientes', icon: <Users className="size-4" /> },
        { id: 'citas', label: 'Agenda de Citas', icon: <Calendar className="size-4" /> },
        { id: 'consultas', label: 'Consultas Médicas', icon: <Stethoscope className="size-4" /> },
        { id: 'recetas', label: 'Recetas y PDF', icon: <FileText className="size-4" /> },
        { id: 'ginecologia', label: 'Ginecología & Obs.', icon: <Baby className="size-4" /> },
      ];
    }

    // Administrador de Clínica (Cliente)
    return [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-4" /> },
      { id: 'pacientes', label: 'Pacientes', icon: <Users className="size-4" /> },
      { id: 'citas', label: 'Agenda de Citas', icon: <Calendar className="size-4" /> },
      { id: 'consultas', label: 'Consultas Médicas', icon: <Stethoscope className="size-4" /> },
      { id: 'recetas', label: 'Recetas y PDF', icon: <FileText className="size-4" /> },
      { id: 'ginecologia', label: 'Ginecología & Obs.', icon: <Baby className="size-4" /> },
      { id: 'reportes', label: 'Reportes & Métricas', icon: <BarChart3 className="size-4" /> },
      { id: 'seguridad', label: 'Seguridad & Backups', icon: <ShieldCheck className="size-4" /> },
      { id: 'configuracion', label: 'Configuración & Plan', icon: <Settings className="size-4" /> },
    ];
  }, [isSuperAdmin, isMedico, isRecepcion]);

  const clinicName = isSuperAdmin
    ? 'Plataforma SaaS Global'
    : (user?.consultorio?.nombre || 'Mi Consultorio');

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 border-r border-border bg-card flex flex-col transition-transform duration-200 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header de la Clínica */}
        <div className="h-16 border-b border-border px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`size-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0 ${
              isSuperAdmin ? 'bg-amber-500 text-white' : 'bg-primary text-primary-foreground'
            }`}>
              {isSuperAdmin ? <Globe2 className="size-5" /> : <Building2 className="size-5" />}
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
            className="lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Links de navegación */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? isSuperAdmin
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Tenant / Role Switcher (Demo bar) */}
        <div className="p-3 border-t border-border/80 bg-muted/30 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1">
              <UserCheck className="size-3 text-emerald-500" /> Switch Rol / Clínica (Demo)
            </span>
          </div>
          <div className="space-y-1">
            <Button
              variant={isSuperAdmin ? "default" : "outline"}
              size="sm"
              className={`w-full text-[11px] h-7 px-2 justify-start ${
                isSuperAdmin
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10'
              }`}
              onClick={() => quickLogin('superadmin')}
            >
              👑 <span className="ml-1.5 font-semibold">Tú (SuperAdmin SaaS)</span>
            </Button>
            <div className="grid grid-cols-2 gap-1">
              <Button
                variant={!isSuperAdmin && user?.consultorio?.nombre?.includes('Sol') ? "secondary" : "outline"}
                size="sm"
                className="text-[11px] h-7 px-1.5 justify-center"
                onClick={() => quickLogin('carlos')}
              >
                Del Sol (Cliente)
              </Button>
              <Button
                variant={!isSuperAdmin && user?.consultorio?.nombre?.includes('Rafael') ? "secondary" : "outline"}
                size="sm"
                className="text-[11px] h-7 px-1.5 justify-center"
                onClick={() => quickLogin('elena')}
              >
                San Rafael (Cliente)
              </Button>
            </div>
          </div>
        </div>

        {/* Footer del usuario en el sidebar */}
        <div className="p-3 border-t border-border flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="text-xs font-semibold truncate leading-tight">
              {user?.nombre} {user?.apellido || ''}
            </div>
            <div className="text-[10px] text-muted-foreground truncate">
              {user?.especialidad || user?.rolCodigo || 'Médico'}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            title="Cerrar Sesión"
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-card/60 backdrop-blur-xs px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            {isSuperAdmin ? (
              <Badge variant="outline" className="text-xs font-semibold border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                👑 SuperAdmin — Control Plataforma SaaS
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary">
                {clinicName}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4" />}
            </Button>
            <div className="hidden sm:block text-right text-xs">
              <span className="font-semibold text-foreground">
                {user?.nombre} {user?.apellido || ''}
              </span>
              <span className="block text-[10px] text-muted-foreground">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Dynamic View Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
