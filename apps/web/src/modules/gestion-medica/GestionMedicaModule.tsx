import * as React from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import type { ModuloId } from '@/views/ModuleLauncher';
import { DashboardView } from '@/views/DashboardView';
import { ConsultasView } from '@/views/ConsultasView';
import { RecetasView } from '@/views/RecetasView';
import { CitasView } from '@/views/CitasView';
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
      {tab === 'hoy' && <PacientesDelDia />}
      {tab === 'consultas' && <ConsultasView />}
      {tab === 'recetas' && <RecetasView />}
      {tab === 'dashboard' && <DashboardView onNavigate={(t) => cambiarTab(t)} />}
    </ModuleShell>
  );
}

// ── Pacientes del Día (placeholder — se ampliará en Fase 3) ──
function PacientesDelDia() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Pacientes de Hoy</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Lista de citas del día con estado de asistencia.
        </p>
      </div>
      {/* Redirige a la vista de citas filtrada por hoy */}
      <CitasView />
    </div>
  );
}
