import * as React from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import type { ModuloId } from '@/views/ModuleLauncher';
import { CitasView } from '@/views/CitasView';
import { PacientesView } from '@/views/PacientesView';
import {
  CalendarDays,
  Users,
  Upload,
} from 'lucide-react';

const TABS = [
  { id: 'agenda', label: 'Agenda de Citas', icon: <CalendarDays className="size-3.5" /> },
  { id: 'pacientes', label: 'Datos de Pacientes', icon: <Users className="size-3.5" /> },
  { id: 'resultados', label: 'Subir Resultados', icon: <Upload className="size-3.5" /> },
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
      {tab === 'resultados' && <SubirResultados />}
    </ModuleShell>
  );
}

// ── Subir Resultados (placeholder — se ampliará en Fase 3) ──
function SubirResultados() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Subir Resultados</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Adjunta laboratorios, imágenes u otros documentos al expediente del paciente.
        </p>
      </div>
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 flex flex-col items-center gap-3 text-center">
        <Upload className="size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Esta sección estará disponible en la próxima actualización.
        </p>
      </div>
    </div>
  );
}
