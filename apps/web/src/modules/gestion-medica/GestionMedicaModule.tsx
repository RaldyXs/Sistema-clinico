import * as React from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import type { ModuloId } from '@/views/ModuleLauncher';
import { DashboardView } from '@/views/DashboardView';
import { ConsultasView } from '@/views/ConsultasView';
import { RecetasView } from '@/views/RecetasView';
import { MonitorSalaHoy } from './MonitorSalaHoy';
import {
  LayoutDashboard,
  Stethoscope,
  FileText,
  Calendar,
} from 'lucide-react';

const TABS = [
  { id: 'hoy', label: 'Pacientes de Hoy', icon: <Calendar className="size-3.5" /> },
  { id: 'consultas', label: 'Consultas Médicas', icon: <Stethoscope className="size-3.5" /> },
  { id: 'recetas', label: 'Recetas y PDF', icon: <FileText className="size-3.5" /> },
  { id: 'dashboard', label: 'Resumen', icon: <LayoutDashboard className="size-3.5" /> },
];

interface Props {
  onVolverLauncher: () => void;
}

export function GestionMedicaModule({ onVolverLauncher }: Props) {
  const [tab, setTab] = React.useState(() => {
    return localStorage.getItem('tab_gestion') || 'hoy';
  });

  const cambiarTab = (t: string) => {
    setTab(t);
    localStorage.setItem('tab_gestion', t);
  };

  return (
    <ModuleShell
      moduloId={'gestion-medica' as ModuloId}
      moduloLabel="Gestión Médica"
      moduloIcon={<Stethoscope className="size-4" />}
      moduloColor="text-sky-600 dark:text-sky-400"
      tabs={TABS}
      currentTab={tab}
      onSelectTab={cambiarTab}
      onVolverLauncher={onVolverLauncher}
    >
      {tab === 'hoy' && (
        <MonitorSalaHoy
          onIniciarConsultaDirecta={() => cambiarTab('consultas')}
        />
      )}
      {tab === 'consultas' && <ConsultasView />}
      {tab === 'recetas' && <RecetasView />}
      {tab === 'dashboard' && <DashboardView onNavigate={(t) => cambiarTab(t)} />}
    </ModuleShell>
  );
}
