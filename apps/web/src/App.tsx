import * as React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppLayout, type NavTab } from '@/components/layout/AppLayout';
import { LoginView } from '@/views/LoginView';
import { AdminLoginView } from '@/views/AdminLoginView';
import { DashboardView } from '@/views/DashboardView';
import { PacientesView } from '@/views/PacientesView';
import { CitasView } from '@/views/CitasView';
import { ConsultasView } from '@/views/ConsultasView';
import { RecetasView } from '@/views/RecetasView';
import { ReportesView } from '@/views/ReportesView';
import { ConfiguracionView } from '@/views/ConfiguracionView';
import { SeguridadView } from '@/views/SeguridadView';
import { SaasAdminView } from '@/views/SaasAdminView';
import { CajaView } from '@/views/CajaView';
import { RefreshCw } from 'lucide-react';

function MainRouter() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const isAdminRoute = window.location.pathname.startsWith('/admin');
  const [currentTab, setCurrentTab] = React.useState<NavTab>(() => {
    try {
      const saved = localStorage.getItem('tab_clinica');
      return (saved as NavTab) || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  const cambiarTab = React.useCallback((tab: NavTab) => {
    setCurrentTab(tab);
    try {
      localStorage.setItem('tab_clinica', tab);
    } catch {}
  }, []);

  const isSuperAdmin = user?.rolCodigo === 'SUPERADMIN';
  const isAdmin = user?.rolCodigo === 'ADMIN' || isSuperAdmin;
  const isMedico = user?.rolCodigo === 'MEDICO';
  const isRecepcion = user?.rolCodigo === 'RECEPCION';

  React.useEffect(() => {
    if (isSuperAdmin) {
      if (currentTab !== 'saas' && currentTab !== 'seguridad') {
        cambiarTab('saas');
      }
    } else if (isRecepcion) {
      // Recepción / Secretaría tiene acceso a 'citas', 'pacientes' y 'caja'
      if (currentTab !== 'citas' && currentTab !== 'pacientes' && currentTab !== 'caja') {
        cambiarTab('citas');
      }
    } else if (isMedico) {
      if (currentTab === 'configuracion' || currentTab === 'seguridad' || currentTab === 'saas' || currentTab === 'reportes' || currentTab === 'caja' || currentTab === 'ginecologia') {
        cambiarTab('consultas');
      }
    } else if (isAdmin) {
      if (currentTab === 'saas' || currentTab === 'ginecologia') {
        cambiarTab('dashboard');
      }
    }
  }, [isSuperAdmin, isAdmin, isMedico, isRecepcion, currentTab, cambiarTab]);

  React.useEffect(() => {
    if (isAuthenticated && !isSuperAdmin && window.location.pathname.startsWith('/admin')) {
      window.history.replaceState({}, '', '/');
    }
  }, [isAuthenticated, isSuperAdmin]);

  if (isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <RefreshCw className="size-8 animate-spin text-primary mr-3" />
        <span className="text-lg font-medium">Iniciando plataforma médica...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (isAdminRoute) {
      return <AdminLoginView />;
    }
    return <LoginView />;
  }

  return (
    <AppLayout currentTab={currentTab} onSelectTab={cambiarTab}>
      {currentTab === 'dashboard' && !isRecepcion && <DashboardView onNavigate={(tab) => cambiarTab(tab as NavTab)} />}
      {currentTab === 'pacientes' && <PacientesView />}
      {currentTab === 'citas' && <CitasView />}
      {currentTab === 'caja' && (isRecepcion || isAdmin) && <CajaView />}
      {currentTab === 'consultas' && !isRecepcion && <ConsultasView />}
      {currentTab === 'recetas' && !isRecepcion && <RecetasView />}
      {currentTab === 'reportes' && !isSuperAdmin && isAdmin && <ReportesView />}
      {currentTab === 'seguridad' && (isAdmin || isSuperAdmin) && <SeguridadView />}
      {currentTab === 'saas' && isSuperAdmin && <SaasAdminView />}
      {currentTab === 'configuracion' && isAdmin && <ConfiguracionView />}
    </AppLayout>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}

export default App;