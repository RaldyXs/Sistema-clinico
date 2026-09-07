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
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'pacientes'
  | 'citas'
  | 'consultas'
  | 'recetas'
  | 'ginecologia'
  | 'reportes'
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

  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-4" /> },
    { id: 'pacientes', label: 'Pacientes', icon: <Users className="size-4" /> },
    { id: 'citas', label: 'Agenda de Citas', icon: <Calendar className="size-4" /> },
    { id: 'consultas', label: 'Consultas Médicas', icon: <Stethoscope className="size-4" /> },
    { id: 'recetas', label: 'Recetas y PDF', icon: <FileText className="size-4" /> },
    { id: 'ginecologia', label: 'Ginecología & Obs.', icon: <Baby className="size-4" /> },
    { id: 'reportes', label: 'Reportes & Métricas', icon: <BarChart3 className="size-4" /> },
    { id: 'configuracion', label: 'Configuración', icon: <Settings className="size-4" /> },
  ];

  const clinicName = user?.consultorio?.nombre || 'Mi Consultorio';

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
            <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Building2 className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate leading-tight">{clinicName}</div>
              <div className="text-[11px] text-muted-foreground truncate">Multi-Tenant SaaS</div>
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
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Tenant Switcher (Demo bar) */}
        <div className="p-3 border-t border-border/80 bg-muted/30 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <UserCheck className="size-3 text-emerald-500" /> Switch Clínica (Demo)
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="text-[11px] h-7 px-1.5 justify-center"
              onClick={() => quickLogin('carlos')}
            >
              Del Sol
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-[11px] h-7 px-1.5 justify-center"
              onClick={() => quickLogin('elena')}
            >
              San Rafael
            </Button>
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
            <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary">
              {clinicName}
            </Badge>
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
