import * as React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppLayout, type NavTab } from '@/components/layout/AppLayout';
import { LoginView } from '@/views/LoginView';
import { DashboardView } from '@/views/DashboardView';
import { PacientesView } from '@/views/PacientesView';
import { CitasView } from '@/views/CitasView';
import { ConsultasView } from '@/views/ConsultasView';
import { RecetasView } from '@/views/RecetasView';
import { GinecologiaView } from '@/views/GinecologiaView';
import { ReportesView } from '@/views/ReportesView';
import { ConfiguracionView } from '@/views/ConfiguracionView';
import { SeguridadView } from '@/views/SeguridadView';
import { SaasAdminView } from '@/views/SaasAdminView';
import { RefreshCw } from 'lucide-react';

function MainRouter() {
  const { isAuthenticated, isLoading, user } = useAuth();
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
      if (currentTab !== 'saas' && currentTab !== 'reportes' && currentTab !== 'seguridad') {
        cambiarTab('saas');
      }
    } else if (isRecepcion) {
      // Recepción / Secretaría SOLO tiene acceso a 'citas' y 'pacientes'
      if (currentTab !== 'citas' && currentTab !== 'pacientes') {
        cambiarTab('citas');
      }
    } else if (isMedico) {
      // Médico asistencial: dashboard, pacientes, citas, consultas, recetas, ginecologia
      // NO tiene acceso a configuración, seguridad, saas ni reportes contables
      if (currentTab === 'configuracion' || currentTab === 'seguridad' || currentTab === 'saas' || currentTab === 'reportes') {
        cambiarTab('dashboard');
      }
    } else if (isAdmin) {
      // Admin de clínica tiene acceso total a su consultorio excepto el portal saas global
      if (currentTab === 'saas') {
        cambiarTab('dashboard');
      }
    }
  }, [isSuperAdmin, isAdmin, isMedico, isRecepcion, currentTab, cambiarTab]);

  if (isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <RefreshCw className="size-8 animate-spin text-primary mr-3" />
        <span className="text-lg font-medium">Iniciando plataforma médica...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <AppLayout currentTab={currentTab} onSelectTab={cambiarTab}>
      {currentTab === 'dashboard' && !isRecepcion && <DashboardView onNavigate={(tab) => cambiarTab(tab as NavTab)} />}
      {currentTab === 'pacientes' && <PacientesView />}
      {currentTab === 'citas' && <CitasView />}
      {currentTab === 'consultas' && !isRecepcion && <ConsultasView />}
      {currentTab === 'recetas' && !isRecepcion && <RecetasView />}
      {currentTab === 'ginecologia' && !isRecepcion && <GinecologiaView />}
      {currentTab === 'reportes' && isAdmin && <ReportesView />}
      {currentTab === 'seguridad' && isAdmin && <SeguridadView />}
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