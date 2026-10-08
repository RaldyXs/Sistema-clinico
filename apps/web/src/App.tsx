import * as React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LoginView } from '@/views/LoginView';
import { AdminLoginView } from '@/views/AdminLoginView';
import { ModuleLauncher, type ModuloId } from '@/views/ModuleLauncher';
import { SaasAdminView } from '@/views/SaasAdminView';
import { GestionMedicaModule } from '@/modules/gestion-medica/GestionMedicaModule';
import { FacturacionModule } from '@/modules/facturacion/FacturacionModule';
import { SecretariaModule } from '@/modules/secretaria/SecretariaModule';
import { BaseDatosModule } from '@/modules/base-datos/BaseDatosModule';
import { AdministracionModule } from '@/modules/administracion/AdministracionModule';
import { RefreshCw, LogOut } from 'lucide-react';

// Roles y qué módulos pueden ver
const ACCESO_POR_ROL: Record<string, ModuloId[]> = {
  SUPERADMIN: ['saas'],
  ADMIN: ['gestion-medica', 'facturacion', 'secretaria', 'base-datos', 'administracion'],
  MEDICO: ['gestion-medica', 'base-datos'],
  RECEPCION: ['secretaria', 'base-datos'],
  FACTURADOR: ['facturacion'],
};

function getModuloInicial(rolCodigo: string): ModuloId | null {
  const acceso = ACCESO_POR_ROL[rolCodigo] ?? [];
  if (acceso.length === 1) return acceso[0]; // Ruta directa si solo tiene un módulo
  return null; // Mostrar launcher
}

function MainRouter() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  // null = mostrar launcher; string = módulo activo
  const [moduloActivo, setModuloActivo] = React.useState<ModuloId | null>(null);

  const rolCodigo = user?.rolCodigo ?? '';
  const isSuperAdmin = rolCodigo === 'SUPERADMIN';

  // Al autenticarse: ir al módulo inicial (o launcher si tiene más de uno)
  const prevAuthRef = React.useRef(isAuthenticated);
  React.useEffect(() => {
    if (isAuthenticated && !prevAuthRef.current && user) {
      // Limpiar módulo previo
      try { localStorage.removeItem('modulo_activo'); } catch {}
      const inicial = getModuloInicial(user.rolCodigo ?? '');
      setModuloActivo(inicial); // null → launcher; directo → módulo
    } else if (!isAuthenticated) {
      setModuloActivo(null);
      try { localStorage.removeItem('modulo_activo'); } catch {}
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, user]);

  // Guardar módulo activo en localStorage para persistencia en reload
  React.useEffect(() => {
    if (!isAuthenticated) return;
    if (moduloActivo) {
      try { localStorage.setItem('modulo_activo', moduloActivo); } catch {}
    } else {
      try { localStorage.removeItem('modulo_activo'); } catch {}
    }
  }, [moduloActivo, isAuthenticated]);

  // Restaurar módulo al recargar página (si el usuario ya estaba autenticado)
  const restoredRef = React.useRef(false);
  React.useEffect(() => {
    if (isAuthenticated && !restoredRef.current && !isLoading) {
      restoredRef.current = true;
      try {
        const saved = localStorage.getItem('modulo_activo') as ModuloId | null;
        const acceso = ACCESO_POR_ROL[rolCodigo] ?? [];
        if (saved && acceso.includes(saved)) {
          setModuloActivo(saved);
        } else {
          const inicial = getModuloInicial(rolCodigo);
          setModuloActivo(inicial);
        }
      } catch {
        setModuloActivo(null);
      }
    }
  }, [isAuthenticated, isLoading, rolCodigo]);

  const seleccionarModulo = (modulo: ModuloId) => {
    const acceso = ACCESO_POR_ROL[rolCodigo] ?? [];
    if (!acceso.includes(modulo)) return; // seguridad: no dar acceso si el rol no lo tiene
    setModuloActivo(modulo);
  };

  const volverLauncher = () => {
    setModuloActivo(null);
    try { localStorage.removeItem('modulo_activo'); } catch {}
  };

  // ── Loading inicial ──
  if (isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <RefreshCw className="size-8 animate-spin text-primary mr-3" />
        <span className="text-lg font-medium">Iniciando Gestia...</span>
      </div>
    );
  }

  // ── Sin sesión ──
  if (!isAuthenticated) {
    if (isAdminRoute) return <AdminLoginView />;
    return <LoginView />;
  }

  // ── Launcher (selección de módulo) ──
  if (moduloActivo === null) {
    return <ModuleLauncher onSelectModulo={seleccionarModulo} />;
  }

  // ── Módulos por rol ──
  if (moduloActivo === 'saas' && isSuperAdmin) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-background text-foreground">
        <header className="h-14 border-b border-border bg-card/90 backdrop-blur-xs px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-sm tracking-tight text-foreground">Gestia</span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-xs font-semibold text-primary">Plataforma SaaS</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 border border-destructive/20 transition-colors cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <SaasAdminView />
        </main>
      </div>
    );
  }

  if (moduloActivo === 'gestion-medica') {
    return <GestionMedicaModule onVolverLauncher={volverLauncher} />;
  }

  if (moduloActivo === 'facturacion') {
    return <FacturacionModule onVolverLauncher={volverLauncher} />;
  }

  if (moduloActivo === 'secretaria') {
    return <SecretariaModule onVolverLauncher={volverLauncher} />;
  }

  if (moduloActivo === 'base-datos') {
    return <BaseDatosModule onVolverLauncher={volverLauncher} />;
  }

  if (moduloActivo === 'administracion') {
    return <AdministracionModule onVolverLauncher={volverLauncher} />;
  }

  // Fallback: volver al launcher
  return <ModuleLauncher onSelectModulo={seleccionarModulo} />;
}

export function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}

export default App;