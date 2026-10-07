import * as React from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import type { ModuloId } from '@/views/ModuleLauncher';
import { CajaView } from '@/views/CajaView';
import { Receipt, ListOrdered, Clock } from 'lucide-react';

const TABS = [
  { id: 'nueva', label: 'Nueva Factura', icon: <Receipt className="size-3.5" /> },
  { id: 'historial', label: 'Historial', icon: <ListOrdered className="size-3.5" /> },
  { id: 'pendientes', label: 'Pendientes', icon: <Clock className="size-3.5" /> },
];

interface Props {
  onVolverLauncher: () => void;
}

export function FacturacionModule({ onVolverLauncher }: Props) {
  const [tab, setTab] = React.useState(() => {
    return localStorage.getItem('tab_facturacion') || 'nueva';
  });

  const cambiarTab = (t: string) => {
    setTab(t);
    localStorage.setItem('tab_facturacion', t);
  };

  return (
    <ModuleShell
      moduloId={'facturacion' as ModuloId}
      moduloLabel="Facturación"
      moduloIcon={<Receipt className="size-4" />}
      moduloColor="text-emerald-600 dark:text-emerald-400"
      tabs={TABS}
      currentTab={tab}
      onSelectTab={cambiarTab}
      onVolverLauncher={onVolverLauncher}
    >
      {/* CajaView actúa como base — se dividirá en sub-vistas en Fase 3 */}
      <CajaView />
    </ModuleShell>
  );
}
