import * as React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
} from 'lucide-react';
import type { ModuloId } from '@/views/ModuleLauncher';

export interface ModuleTab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface ModuleShellProps {
  moduloId: ModuloId;
  moduloLabel: string;
  moduloIcon: React.ReactNode;
  moduloColor: string; // Tailwind text color class for accent
  tabs: ModuleTab[];
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onVolverLauncher: () => void;
  children: React.ReactNode;
}

export function ModuleShell({
  moduloLabel,
  moduloIcon,
  moduloColor,
  tabs,
  currentTab,
  onSelectTab,
  onVolverLauncher,
  children,
}: ModuleShellProps) {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = React.useState(() => {
    try {
      const saved = localStorage.getItem('theme_clinico');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

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

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background text-foreground">
      {/* ── Topbar principal ── */}
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-xs px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 print:hidden">
        {/* Izquierda: botón volver + nombre del módulo */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground gap-1.5 px-2 text-xs shrink-0"
            onClick={onVolverLauncher}
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Módulos</span>
          </Button>
          <div className="h-4 w-px bg-border shrink-0" />
          <div className={`flex items-center gap-2 ${moduloColor} min-w-0`}>
            <span className="shrink-0">{moduloIcon}</span>
            <span className="font-semibold text-sm truncate">{moduloLabel}</span>
          </div>
        </div>

        {/* Derecha: usuario + tema + logout */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="icon" className="size-8" onClick={toggleTheme}>
            {isDark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4" />}
          </Button>
          <div className="hidden sm:block text-right text-xs">
            <span className="font-semibold text-foreground block leading-tight">
              {user?.nombre} {user?.apellido || ''}
            </span>
            <span className="text-[10px] text-muted-foreground">{user?.rolCodigo}</span>
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
          {/* Hamburguesa móvil para tabs */}
          {tabs.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 sm:hidden"
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              {mobileNavOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          )}
        </div>
      </header>

      {/* ── Tab bar horizontal ── */}
      {tabs.length > 1 && (
        <>
          {/* Desktop tabs */}
          <nav className="hidden sm:flex items-center gap-1 px-6 border-b border-border bg-card/60 print:hidden shrink-0 overflow-x-auto">
            {tabs.map((tab) => {
              const active = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap -mb-px ${
                    active
                      ? `border-primary ${moduloColor} font-semibold`
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Mobile dropdown nav */}
          {mobileNavOpen && (
            <nav className="sm:hidden flex flex-col border-b border-border bg-card shadow-md z-20 shrink-0">
              {tabs.map((tab) => {
                const active = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onSelectTab(tab.id);
                      setMobileNavOpen(false);
                    }}
                    className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                      active
                        ? `${moduloColor} bg-primary/5 font-semibold`
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          )}
        </>
      )}

      {/* ── Contenido del módulo ── */}
      <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden p-4 sm:p-5 lg:p-6">
        <div className="max-w-7xl w-full mx-auto pb-24">
          {children}
        </div>
      </main>
    </div>
  );
}
