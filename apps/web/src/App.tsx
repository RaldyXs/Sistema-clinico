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
import { ConfiguracionView } from '@/views/ConfiguracionView';
import { RefreshCw } from 'lucide-react';

function MainRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = React.useState<NavTab>('dashboard');

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
    <AppLayout currentTab={currentTab} onSelectTab={setCurrentTab}>
      {currentTab === 'dashboard' && <DashboardView onNavigate={(tab) => setCurrentTab(tab as NavTab)} />}
      {currentTab === 'pacientes' && <PacientesView />}
      {currentTab === 'citas' && <CitasView />}
      {currentTab === 'consultas' && <ConsultasView />}
      {currentTab === 'recetas' && <RecetasView />}
      {currentTab === 'ginecologia' && <GinecologiaView />}
      {currentTab === 'configuracion' && <ConfiguracionView />}
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