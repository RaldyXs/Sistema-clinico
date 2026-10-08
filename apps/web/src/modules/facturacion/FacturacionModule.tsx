import * as React from 'react';
import { api } from '@/lib/api';
import { ModuleShell, type ModuleTab } from '@/components/layout/ModuleShell';
import type { ModuloId } from '@/views/ModuleLauncher';
import { Receipt, ListOrdered, Clock, BookOpen, Banknote } from 'lucide-react';
import { FacturaNuevaView } from './FacturaNuevaView';
import { FacturasHistorialView } from './FacturasHistorialView';
import { FacturasPendientesView } from './FacturasPendientesView';
import { TarifarioServiciosView } from './TarifarioServiciosView';
import { TurnoArqueoView } from './TurnoArqueoView';
import type { ServicioClinico } from '@/data/servicios-clinicos';

interface Props {
  onVolverLauncher: () => void;
}

export function FacturacionModule({ onVolverLauncher }: Props) {
  const [tab, setTab] = React.useState(() => {
    return localStorage.getItem('tab_facturacion') || 'nueva';
  });

  // Estado compartido entre pestañas
  const [pacienteSeleccionado, setPacienteSeleccionado] = React.useState<any | null>(null);
  const [medicoSeleccionado, setMedicoSeleccionado] = React.useState<any | null>(null);
  const [citaSeleccionada, setCitaSeleccionada] = React.useState<any | null>(null);
  const [servicioAAgregar, setServicioAAgregar] = React.useState<ServicioClinico | null>(null);

  // Estado del turno de caja
  const [sesionActiva, setSesionActiva] = React.useState<any | null>(null);
  const [conteoPendientes, setConteoPendientes] = React.useState<number>(0);

  const cargarEstadoCaja = React.useCallback(async () => {
    try {
      const hoyStr = new Date().toISOString().slice(0, 10);
      const [sesRes, citasRes, pagosRes] = await Promise.allSettled([
        api.get('/caja/sesion-activa'),
        api.get(`/citas?fecha=${hoyStr}&limite=100`),
        api.get('/caja/pagos?limite=100'),
      ]);

      if (sesRes.status === 'fulfilled') {
        setSesionActiva(sesRes.value);
      } else {
        setSesionActiva(null);
      }

      if (citasRes.status === 'fulfilled' && pagosRes.status === 'fulfilled') {
        const citas = Array.isArray(citasRes.value) ? citasRes.value : citasRes.value?.datos || [];
        const pagos = Array.isArray(pagosRes.value) ? pagosRes.value : pagosRes.value?.datos || [];
        const citasCobradasIds = new Set(
          pagos.filter((p: any) => p.cita?.id && p.estado !== 'ANULADO').map((p: any) => p.cita.id)
        );
        const pend = citas.filter((c: any) => {
          const terminada = ['COMPLETADA', 'ATENDIDA', 'FINALIZADA', 'EN_CONSULTA'].includes(c.estado);
          return terminada && !citasCobradasIds.has(c.id);
        }).length;
        setConteoPendientes(pend);
      }
    } catch {
      // Silenciar errores de sondeo inicial
    }
  }, []);

  React.useEffect(() => {
    cargarEstadoCaja();
  }, [cargarEstadoCaja]);

  const cambiarTab = (t: string) => {
    setTab(t);
    localStorage.setItem('tab_facturacion', t);
  };

  // Callback al seleccionar paciente pendiente desde la cola
  const handleCargarPacienteDeCola = (paciente: any, medico?: any, cita?: any) => {
    setPacienteSeleccionado(paciente);
    setMedicoSeleccionado(medico || null);
    setCitaSeleccionada(cita || null);
    cambiarTab('nueva');
  };

  // Callback al seleccionar servicio desde el tarifario
  const handleFacturarServicio = (servicio: ServicioClinico) => {
    setServicioAAgregar(servicio);
    cambiarTab('nueva');
  };

  const cajaAbierta = sesionActiva?.sesion && sesionActiva.sesion.estado === 'ABIERTA';

  const tabs: ModuleTab[] = [
    {
      id: 'nueva',
      label: 'Nueva Factura',
      icon: <Receipt className="size-3.5" />,
    },
    {
      id: 'pendientes',
      label: 'Pendientes',
      icon: <Clock className="size-3.5" />,
      badge:
        conteoPendientes > 0 ? (
          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {conteoPendientes}
          </span>
        ) : undefined,
    },
    {
      id: 'historial',
      label: 'Historial',
      icon: <ListOrdered className="size-3.5" />,
    },
    {
      id: 'tarifario',
      label: 'Tarifario',
      icon: <BookOpen className="size-3.5" />,
    },
    {
      id: 'turno',
      label: 'Turno y Arqueo',
      icon: <Banknote className="size-3.5" />,
      badge: cajaAbierta ? (
        <span
          className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse"
          title="Caja abierta y operativa"
        />
      ) : (
        <span
          className="inline-block size-2 rounded-full bg-amber-500"
          title="Caja cerrada"
        />
      ),
    },
  ];

  return (
    <ModuleShell
      moduloId={'facturacion' as ModuloId}
      moduloLabel="Facturación y Caja"
      moduloIcon={<Receipt className="size-4" />}
      moduloColor="text-emerald-600 dark:text-emerald-400"
      tabs={tabs}
      currentTab={tab}
      onSelectTab={cambiarTab}
      onVolverLauncher={onVolverLauncher}
    >
      {tab === 'nueva' && (
        <FacturaNuevaView
          pacientePreseleccionado={pacienteSeleccionado}
          medicoPreseleccionado={medicoSeleccionado}
          citaPreseleccionada={citaSeleccionada}
          servicioAAgregar={servicioAAgregar}
          onFacturaEmitida={() => {
            cargarEstadoCaja();
            setServicioAAgregar(null);
          }}
          onIrAHistorial={() => cambiarTab('historial')}
        />
      )}

      {tab === 'pendientes' && (
        <FacturasPendientesView onCargarAFactura={handleCargarPacienteDeCola} />
      )}

      {tab === 'historial' && (
        <FacturasHistorialView onNuevaFactura={() => cambiarTab('nueva')} />
      )}

      {tab === 'tarifario' && (
        <TarifarioServiciosView onFacturarServicio={handleFacturarServicio} />
      )}

      {tab === 'turno' && (
        <TurnoArqueoView
          onAbrirCajaExito={cargarEstadoCaja}
          onCerrarCajaExito={cargarEstadoCaja}
        />
      )}
    </ModuleShell>
  );
}
