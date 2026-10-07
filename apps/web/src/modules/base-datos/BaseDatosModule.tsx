import * as React from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import type { ModuloId } from '@/views/ModuleLauncher';
import { PacientesView } from '@/views/PacientesView';
import { Database } from 'lucide-react';

const TABS = [
  { id: 'lista', label: 'Expedientes', icon: <Database className="size-3.5" /> },
];

interface Props {
  onVolverLauncher: () => void;
}

export function BaseDatosModule({ onVolverLauncher }: Props) {
  const [tab, setTab] = React.useState('lista');

  return (
    <ModuleShell
      moduloId={'base-datos' as ModuloId}
      moduloLabel="Base de Datos de Pacientes"
      moduloIcon={<Database className="size-4" />}
      moduloColor="text-amber-600 dark:text-amber-400"
      tabs={TABS}
      currentTab={tab}
      onSelectTab={setTab}
      onVolverLauncher={onVolverLauncher}
    >
      {tab === 'lista' && <PacientesView />}
    </ModuleShell>
  );
}
