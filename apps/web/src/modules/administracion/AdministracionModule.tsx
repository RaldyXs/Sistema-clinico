import * as React from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import type { ModuloId } from '@/views/ModuleLauncher';
import { DashboardView } from '@/views/DashboardView';
import { ReportesView } from '@/views/ReportesView';
import { SeguridadView } from '@/views/SeguridadView';
import { ConfiguracionView } from '@/views/ConfiguracionView';
import {
  LayoutDashboard,
  BarChart3,
  ShieldCheck,
  Settings,
} from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-3.5" /> },
  { id: 'reportes', label: 'Reportes & Métricas', icon: <BarChart3 className="size-3.5" /> },
  { id: 'seguridad', label: 'Seguridad & Backups', icon: <ShieldCheck className="size-3.5" /> },
  { id: 'configuracion', label: 'Configuración & Plan', icon: <Settings className="size-3.5" /> },
];

interface Props {
  onVolverLauncher: () => void;
}

export function AdministracionModule({ onVolverLauncher }: Props) {
  const [tab, setTab] = React.useState(() => {
    return localStorage.getItem('tab_admin') || 'dashboard';
  });

  const cambiarTab = (t: string) => {
    setTab(t);
    localStorage.setItem('tab_admin', t);
  };

  return (
    <ModuleShell
      moduloId={'administracion' as ModuloId}
      moduloLabel="Administración"
      moduloIcon={<Settings className="size-4" />}
      moduloColor="text-rose-600 dark:text-rose-400"
      tabs={TABS}
      currentTab={tab}
      onSelectTab={cambiarTab}
      onVolverLauncher={onVolverLauncher}
    >
      {tab === 'dashboard' && <DashboardView onNavigate={(t) => cambiarTab(t)} />}
      {tab === 'reportes' && <ReportesView />}
      {tab === 'seguridad' && <SeguridadView />}
      {tab === 'configuracion' && <ConfiguracionView />}
    </ModuleShell>
  );
}
