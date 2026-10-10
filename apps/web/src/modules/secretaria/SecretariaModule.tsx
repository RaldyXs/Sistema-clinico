import * as React from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import type { ModuloId } from '@/views/ModuleLauncher';
import { CitasView } from '@/views/CitasView';
import { PacientesView } from '@/views/PacientesView';
import { ResultadosEstudiosView } from './ResultadosEstudiosView';
import {
  CalendarDays,
  Users,
  Upload,
} from 'lucide-react';

const TABS = [
  { id: 'agenda', label: 'Agenda de Citas', icon: <CalendarDays className="size-3.5" /> },
  { id: 'pacientes', label: 'Datos de Pacientes', icon: <Users className="size-3.5" /> },
  { id: 'resultados', label: 'Resultados y Estudios', icon: <Upload className="size-3.5" /> },
];

interface Props {
  onVolverLauncher: () => void;
}

export function SecretariaModule({ onVolverLauncher }: Props) {
  const [tab, setTab] = React.useState(() => {
    return localStorage.getItem('tab_secretaria') || 'agenda';
  });

  const cambiarTab = (t: string) => {
    setTab(t);
    localStorage.setItem('tab_secretaria', t);
  };

  return (
    <ModuleShell
      moduloId={'secretaria' as ModuloId}
      moduloLabel="Secretaría"
      moduloIcon={<CalendarDays className="size-4" />}
      moduloColor="text-violet-600 dark:text-violet-400"
      tabs={TABS}
      currentTab={tab}
      onSelectTab={cambiarTab}
      onVolverLauncher={onVolverLauncher}
    >
      {tab === 'agenda' && <CitasView />}
      {tab === 'pacientes' && <PacientesView />}
      {tab === 'resultados' && <ResultadosEstudiosView />}
    </ModuleShell>
  );
}
