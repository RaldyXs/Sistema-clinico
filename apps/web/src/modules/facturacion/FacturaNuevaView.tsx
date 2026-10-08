import * as React from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  AlertCircle,
  Shield,
  Stethoscope,
  Banknote,
  CreditCard,
  Building2,
  Receipt,
  User,
  RefreshCw,
  X,
} from 'lucide-react';
import { SERVICIOS_CLINICOS, type ServicioClinico } from '@/data/servicios-clinicos';
import { ARS_DOMINICANAS } from '@/data/ars-dominicanas';

export interface LineaFactura {
  id: string;
  servicioId?: string;
  codigo: string;
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  porcentajeArs: number;
  montoArs: number;
  copagoPaciente: number;
}

interface Props {
  pacientePreseleccionado?: any | null;
  medicoPreseleccionado?: any | null;
  citaPreseleccionada?: any | null;
  servicioAAgregar?: ServicioClinico | null;
  onFacturaEmitida?: (pago: any) => void;
  onIrAHistorial?: () => void;
}

export function FacturaNuevaView({
  pacientePreseleccionado,
  medicoPreseleccionado,
  citaPreseleccionada,
  servicioAAgregar,
  onFacturaEmitida,
  onIrAHistorial,
}: Props) {
  // Datos maestros
  const [pacientes, setPacientes] = React.useState<any[]>([]);
  const [medicos, setMedicos] = React.useState<any[]>([]);
  const [sesionActiva, setSesionActiva] = React.useState<any | null>(null);

  // Selección de paciente
  const [busquedaPac, setBusquedaPac] = React.useState('');
  const [paciente, setPaciente] = React.useState<any | null>(pacientePreseleccionado || null);
  const [dropdownPacAbierto, setDropdownPacAbierto] = React.useState(false);

  // Datos de ARS y Médico
  const [arsNombre, setArsNombre] = React.useState(pacientePreseleccionado?.ars || 'SeNaSa (Contributivo)');
  const [numeroPoliza, setNumeroPoliza] = React.useState(pacientePreseleccionado?.numeroPoliza || '');
  const [numeroAutorizacion, setNumeroAutorizacion] = React.useState('');
  const [medicoId, setMedicoId] = React.useState<string>(medicoPreseleccionado?.id || '');

  React.useEffect(() => {
    if (pacientePreseleccionado) {
      setPaciente(pacientePreseleccionado);
      if (pacientePreseleccionado.ars) setArsNombre(pacientePreseleccionado.ars);
      if (pacientePreseleccionado.numeroPoliza) setNumeroPoliza(pacientePreseleccionado.numeroPoliza);
    }
  }, [pacientePreseleccionado]);

  React.useEffect(() => {
    if (medicoPreseleccionado?.id) {
      setMedicoId(medicoPreseleccionado.id);
    }
  }, [medicoPreseleccionado]);

  // Grilla de servicios (Inicia con Consulta Ginecológica por defecto)
  const [lineas, setLineas] = React.useState<LineaFactura[]>([
    {
      id: 'lin-init-1',
      servicioId: 'srv-con-gin',
      codigo: 'CON-001',
      concepto: 'Consulta Ginecológica Especializada',
      cantidad: 1,
      precioUnitario: 2500,
      porcentajeArs: 80,
      montoArs: 2000,
      copagoPaciente: 500,
    },
  ]);

  // Selección rápida de servicio para agregar
  const [servicioSeleccionadoId, setServicioSeleccionadoId] = React.useState('');

  // Método de pago del copago
  const [metodoPago, setMetodoPago] = React.useState<'EFECTIVO' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'TRANSFERENCIA'>('EFECTIVO');
  const [montoRecibido, setMontoRecibido] = React.useState<number>(500);
  const [referenciaPago, setReferenciaPago] = React.useState('');
  const [notas, setNotas] = React.useState('');

  // Estados de proceso y feedback
  const [guardando, setGuardando] = React.useState(false);
  const [mensajeError, setMensajeError] = React.useState<string | null>(null);
  const [reciboGenerado, setReciboGenerado] = React.useState<any | null>(null);

  // Cargar datos al montar
  React.useEffect(() => {
    const cargarTodo = async () => {
      try {
        const [pacRes, medRes, sesRes] = await Promise.allSettled([
          api.get('/pacientes?limite=150'),
          api.get('/usuarios/medicos'),
          api.get('/caja/sesion-activa'),
        ]);

        if (pacRes.status === 'fulfilled') {
          const list = Array.isArray(pacRes.value) ? pacRes.value : pacRes.value?.datos || [];
          setPacientes(list);
          // Si había preseleccionado por ID
          if (pacientePreseleccionado && !paciente) {
            setPaciente(pacientePreseleccionado);
          }
        }
        if (medRes.status === 'fulfilled') {
          const listMed = Array.isArray(medRes.value) ? medRes.value : [];
          setMedicos(listMed);
          if (!medicoId && listMed.length > 0) {
            setMedicoId(listMed[0].id);
          }
        }
        if (sesRes.status === 'fulfilled') {
          setSesionActiva(sesRes.value);
        }
      } catch (err) {
        console.error('Error cargando datos de facturación:', err);
      }
    };

    cargarTodo();
  }, []);

  // Cuando cambia el paciente seleccionado, auto-llenar datos de seguro
  React.useEffect(() => {
    if (paciente) {
      if (paciente.ars) setArsNombre(paciente.ars);
      if (paciente.numeroPoliza) setNumeroPoliza(paciente.numeroPoliza);
      // Recalcular porcentajes según ARS del paciente
      const esParticular =
        !paciente.ars ||
        paciente.ars.toLowerCase().includes('particular') ||
        paciente.ars.toLowerCase().includes('sin seguro');

      setLineas((prev) =>
        prev.map((lin) => {
          const pct = esParticular ? 0 : lin.porcentajeArs || 80;
          const montoTotal = lin.cantidad * lin.precioUnitario;
          const montoArs = Math.round((montoTotal * pct) / 100);
          const copago = montoTotal - montoArs;
          return {
            ...lin,
            porcentajeArs: pct,
            montoArs,
            copagoPaciente: copago,
          };
        })
      );
    }
  }, [paciente]);

  // Lista de pacientes filtrados para el autocompletado
  const pacientesFiltrados = React.useMemo(() => {
    if (!busquedaPac.trim()) return pacientes.slice(0, 8);
    const q = busquedaPac.toLowerCase();
    return pacientes
      .filter((p) =>
        `${p.nombre} ${p.apellido || ''} ${p.documentoIdentidad || p.dni || ''} ${p.numeroPoliza || ''}`
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 10);
  }, [busquedaPac, pacientes]);

  // Totales de la factura
  const totales = React.useMemo(() => {
    const subtotal = lineas.reduce((acc, l) => acc + l.cantidad * l.precioUnitario, 0);
    const totalArs = lineas.reduce((acc, l) => acc + l.montoArs, 0);
    const totalCopago = lineas.reduce((acc, l) => acc + l.copagoPaciente, 0);
    return { subtotal, totalArs, totalCopago };
  }, [lineas]);

  // Mantener montoRecibido sincronizado con copago al cambiar totales si está en efectivo
  React.useEffect(() => {
    if (metodoPago === 'EFECTIVO' && montoRecibido < totales.totalCopago) {
      setMontoRecibido(totales.totalCopago);
    }
  }, [totales.totalCopago, metodoPago]);

  // Cálculo de cambio / vuelto
  const cambioDevuelto = React.useMemo(() => {
    if (metodoPago !== 'EFECTIVO') return 0;
    const diff = Number(montoRecibido) - totales.totalCopago;
    return diff > 0 ? diff : 0;
  }, [montoRecibido, totales.totalCopago, metodoPago]);

  // Handlers de la grilla de servicios
  const handleAgregarServicio = (servId: string) => {
    const srv = SERVICIOS_CLINICOS.find((s) => s.id === servId);
    if (!srv) return;

    const esParticular =
      !arsNombre ||
      arsNombre.toLowerCase().includes('particular') ||
      arsNombre.toLowerCase().includes('sin seguro');

    const pct = esParticular ? 0 : srv.coberturaSugeridaArs;
    const montoTotal = srv.precioBaseDop;
    const montoArs = Math.round((montoTotal * pct) / 100);
    const copago = montoTotal - montoArs;

    const nuevaLinea: LineaFactura = {
      id: `lin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      servicioId: srv.id,
      codigo: srv.codigo,
      concepto: srv.nombre,
      cantidad: 1,
      precioUnitario: srv.precioBaseDop,
      porcentajeArs: pct,
      montoArs,
      copagoPaciente: copago,
    };

    setLineas((prev) => [...prev, nuevaLinea]);
    setServicioSeleccionadoId('');
  };

  React.useEffect(() => {
    if (servicioAAgregar?.id) {
      handleAgregarServicio(servicioAAgregar.id);
    }
  }, [servicioAAgregar]);

  const handleActualizarLinea = (id: string, campo: keyof LineaFactura, valor: any) => {
    setLineas((prev) =>
      prev.map((lin) => {
        if (lin.id !== id) return lin;
        const actualizada = { ...lin, [campo]: valor };

        // Recalcular importes derivados
        const cant = Number(actualizada.cantidad) || 1;
        const precio = Number(actualizada.precioUnitario) || 0;
        const pct = Math.min(100, Math.max(0, Number(actualizada.porcentajeArs) || 0));
        const montoTotal = cant * precio;
        const montoArs = Math.round((montoTotal * pct) / 100);
        const copago = montoTotal - montoArs;

        return {
          ...actualizada,
          cantidad: cant,
          precioUnitario: precio,
          porcentajeArs: pct,
          montoArs,
          copagoPaciente: copago,
        };
      })
    );
  };

  const handleEliminarLinea = (id: string) => {
    if (lineas.length === 1) {
      alert('La factura debe tener al menos un servicio registrado.');
      return;
    }
    setLineas((prev) => prev.filter((l) => l.id !== id));
  };

  // Enviar cobro al backend
  const handleEmitirFactura = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeError(null);

    if (!paciente) {
      setMensajeError('Por favor selecciona el paciente a facturar.');
      return;
    }
    if (lineas.length === 0) {
      setMensajeError('Agrega al menos un servicio a la factura.');
      return;
    }
    if (metodoPago === 'EFECTIVO' && Number(montoRecibido) < totales.totalCopago) {
      setMensajeError(`El monto recibido en efectivo (RD$ ${montoRecibido}) no puede ser menor al copago (RD$ ${totales.totalCopago}).`);
      return;
    }

    setGuardando(true);
    try {
      // Concepto consolidado para el registro general de caja
      const conceptoResumen = lineas.map((l) => `${l.cantidad}x ${l.concepto}`).join(', ');

      const payload = {
        pacienteId: paciente.id,
        citaId: citaPreseleccionada?.id || undefined,
        concepto: conceptoResumen.slice(0, 250),
        montoTotal: totales.subtotal,
        metodoPago,
        montoRecibido: metodoPago === 'EFECTIVO' ? Number(montoRecibido) : totales.totalCopago,
        montoCopago: totales.totalCopago,
        coberturaSeguro: totales.totalArs,
        nombreAseguradora: arsNombre,
        numeroPoliza: numeroPoliza || undefined,
        numeroAutorizacion: numeroAutorizacion || undefined,
        referenciaTransaccion: referenciaPago || undefined,
        notas: notas || undefined,
      };

      const pagoCreado = await api.post('/caja/pagos', payload);

      setReciboGenerado({
        ...pagoCreado,
        paciente,
        lineas,
        cambioDevuelto,
      });

      if (onFacturaEmitida) {
        onFacturaEmitida(pagoCreado);
      }
    } catch (err: any) {
      setMensajeError(err.message || 'Error al procesar el cobro y registrar la factura.');
    } finally {
      setGuardando(false);
    }
  };

  const resetFormulario = () => {
    setReciboGenerado(null);
    setPaciente(null);
    setBusquedaPac('');
    setNumeroAutorizacion('');
    setNumeroPoliza('');
    setLineas([
      {
        id: `lin-${Date.now()}`,
        servicioId: 'srv-con-gin',
        codigo: 'CON-001',
        concepto: 'Consulta Ginecológica Especializada',
        cantidad: 1,
        precioUnitario: 2500,
        porcentajeArs: 80,
        montoArs: 2000,
        copagoPaciente: 500,
      },
    ]);
    setMontoRecibido(500);
    setReferenciaPago('');
    setNotas('');
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-12">
      {/* ── Banner Superior: Estado de Caja ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-card border border-border shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Receipt className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              Emisión de Factura y Cobro Clínico
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                RD$ (Pesos Dominicanos)
              </span>
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Desglose automático de Cobertura ARS vs Copago Paciente • Modelo ClinPaq
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sesionActiva?.sesion ? (
            <Badge variant="success" className="text-[11px] py-1 px-2.5 gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Caja Abierta (Fondo: RD$ {Number(sesionActiva.sesion.montoInicial).toLocaleString()})
            </Badge>
          ) : (
            <Badge variant="warning" className="text-[11px] py-1 px-2.5 gap-1.5">
              <AlertCircle className="size-3" />
              Turno de Caja no abierto
            </Badge>
          )}
        </div>
      </div>

      {mensajeError && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{mensajeError}</span>
          </div>
          <button type="button" onClick={() => setMensajeError(null)} className="cursor-pointer">
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleEmitirFactura} className="space-y-4">
        {/* ── SECCIÓN 1: PACIENTE & COBERTURA ARS ── */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="py-3 px-4 border-b border-border/60 bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="size-3.5 text-primary" />
                1. Paciente & Aseguradora de Salud (ARS)
              </CardTitle>
              {paciente && (
                <button
                  type="button"
                  onClick={() => setPaciente(null)}
                  className="text-[11px] text-primary hover:underline cursor-pointer"
                >
                  Cambiar Paciente
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {!paciente ? (
              /* Buscador de paciente */
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                    <Input
                      className="pl-8 text-xs h-9 bg-background"
                      placeholder="Escribe el nombre, apellido, cédula o teléfono del paciente..."
                      value={busquedaPac}
                      onChange={(e) => {
                        setBusquedaPac(e.target.value);
                        setDropdownPacAbierto(true);
                      }}
                      onFocus={() => setDropdownPacAbierto(true)}
                    />
                  </div>
                </div>

                {/* Dropdown flotante con resultados */}
                {dropdownPacAbierto && (
                  <div className="absolute top-10 left-0 right-0 z-40 bg-card border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto divide-y divide-border">
                    {pacientesFiltrados.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        No se encontró ningún paciente con "{busquedaPac}"
                      </div>
                    ) : (
                      pacientesFiltrados.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setPaciente(p);
                            setDropdownPacAbierto(false);
                            setBusquedaPac('');
                          }}
                          className="p-2.5 hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                              {p.nombre[0]}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">
                                {p.nombre} {p.apellido || ''}
                              </div>
                              <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                                <span>Céd: {p.documentoIdentidad || p.dni || 'S/D'}</span>
                                <span>•</span>
                                <span>ARS: {p.ars || 'Particular'}</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            Seleccionar
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Tarjeta del paciente seleccionado */
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 rounded-lg bg-muted/30 border border-border/70 text-xs">
                <div className="md:col-span-1 space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Paciente Titular</span>
                  <div className="font-bold text-foreground text-sm">
                    {paciente.nombre} {paciente.apellido || ''}
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground">
                    Cédula: {paciente.documentoIdentidad || paciente.dni || 'S/D'}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase block">
                    ARS (Aseguradora)
                  </label>
                  <select
                    className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs outline-none focus:border-primary font-medium"
                    value={arsNombre}
                    onChange={(e) => setArsNombre(e.target.value)}
                  >
                    {ARS_DOMINICANAS.map((a) => (
                      <option key={a.id} value={a.nombre}>
                        {a.nombre}
                      </option>
                    ))}
                    <option value="Privado / Sin Seguro (Particular)">Particular (Sin Cobertura)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase block">
                    No. de Póliza / Afiliado
                  </label>
                  <Input
                    className="h-8 text-xs font-mono bg-background"
                    placeholder="Ej. 10928374-1"
                    value={numeroPoliza}
                    onChange={(e) => setNumeroPoliza(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-primary font-bold uppercase flex items-center gap-1">
                    <Shield className="size-3" /> No. de Autorización ARS *
                  </label>
                  <Input
                    className="h-8 text-xs font-mono font-bold border-primary/40 focus:border-primary bg-background shadow-xs"
                    placeholder="Código web ARS (ej. AUT-8841)"
                    value={numeroAutorizacion}
                    onChange={(e) => setNumeroAutorizacion(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Asignación de Médico Tratante (Honorarios) */}
            <div className="pt-1 flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 shrink-0">
                <Stethoscope className="size-3.5 text-primary" />
                Médico Tratante (Liquidación de Honorarios):
              </label>
              <select
                className="flex-1 h-8 px-2.5 rounded-md border border-input bg-background text-xs outline-none focus:border-primary font-medium"
                value={medicoId}
                onChange={(e) => setMedicoId(e.target.value)}
              >
                <option value="">Selecciona el médico que atendió el caso...</option>
                {medicos.map((m) => (
                  <option key={m.id} value={m.id}>
                    Dr(a). {m.nombre} {m.apellido || ''} {m.especialidad ? `— ${m.especialidad}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* ── SECCIÓN 2: GRILLA DE CARGOS POR SERVICIOS (ClinPaq) ── */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="py-3 px-4 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-xs uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Receipt className="size-3.5 text-primary" />
              2. Cargos por Servicios & Liquidación
            </CardTitle>

            {/* Selector rápido para añadir servicios */}
            <div className="flex items-center gap-1.5">
              <select
                className="h-8 px-2.5 rounded-md border border-input bg-background text-xs outline-none focus:border-primary max-w-[280px]"
                value={servicioSeleccionadoId}
                onChange={(e) => {
                  setServicioSeleccionadoId(e.target.value);
                  if (e.target.value) handleAgregarServicio(e.target.value);
                }}
              >
                <option value="">+ Añadir servicio del tarifario...</option>
                {SERVICIOS_CLINICOS.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.codigo}] {s.nombre} (RD$ {s.precioBaseDop.toLocaleString()})
                  </option>
                ))}
              </select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 cursor-pointer"
                onClick={() => {
                  // Agregar línea manual vacía
                  const manual: LineaFactura = {
                    id: `lin-manual-${Date.now()}`,
                    codigo: 'MAN-999',
                    concepto: 'Servicio / Procedimiento Clínico',
                    cantidad: 1,
                    precioUnitario: 1000,
                    porcentajeArs: 80,
                    montoArs: 800,
                    copagoPaciente: 200,
                  };
                  setLineas((prev) => [...prev, manual]);
                }}
              >
                <Plus className="size-3" /> Fila Manual
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase bg-muted/40 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-3.5 py-2 font-semibold">Código & Servicio</th>
                    <th className="px-2 py-2 font-semibold text-center w-16">Cant.</th>
                    <th className="px-2.5 py-2 font-semibold text-right w-28">Precio Base (RD$)</th>
                    <th className="px-2 py-2 font-semibold text-center w-20">% ARS</th>
                    <th className="px-2.5 py-2 font-semibold text-right w-28 text-blue-600 dark:text-blue-400">
                      Cobertura ARS
                    </th>
                    <th className="px-3 py-2 font-semibold text-right w-32 text-emerald-600 dark:text-emerald-400">
                      Copago Paciente
                    </th>
                    <th className="px-2 py-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lineas.map((lin) => (
                    <tr key={lin.id} className="hover:bg-muted/20 transition-colors">
                      {/* Concepto / Servicio */}
                      <td className="px-3.5 py-2">
                        <Input
                          className="h-7 text-xs bg-transparent border-transparent hover:border-input focus:border-primary font-medium"
                          value={lin.concepto}
                          onChange={(e) => handleActualizarLinea(lin.id, 'concepto', e.target.value)}
                        />
                      </td>

                      {/* Cantidad */}
                      <td className="px-2 py-2 text-center">
                        <Input
                          type="number"
                          min={1}
                          className="h-7 text-xs text-center p-1 bg-background"
                          value={lin.cantidad}
                          onChange={(e) => handleActualizarLinea(lin.id, 'cantidad', e.target.value)}
                        />
                      </td>

                      {/* Precio Unitario */}
                      <td className="px-2.5 py-2 text-right">
                        <Input
                          type="number"
                          min={0}
                          step={50}
                          className="h-7 text-xs text-right p-1 font-mono bg-background"
                          value={lin.precioUnitario}
                          onChange={(e) => handleActualizarLinea(lin.id, 'precioUnitario', e.target.value)}
                        />
                      </td>

                      {/* % Cobertura ARS */}
                      <td className="px-2 py-2 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            className="h-7 w-12 text-xs text-center p-0.5 font-bold bg-background text-blue-600 dark:text-blue-400"
                            value={lin.porcentajeArs}
                            onChange={(e) => handleActualizarLinea(lin.id, 'porcentajeArs', e.target.value)}
                          />
                          <span className="text-[10px] text-muted-foreground">%</span>
                        </div>
                      </td>

                      {/* Monto ARS */}
                      <td className="px-2.5 py-2 text-right font-mono font-semibold text-blue-600 dark:text-blue-400">
                        RD$ {lin.montoArs.toLocaleString()}
                      </td>

                      {/* Copago Paciente */}
                      <td className="px-3 py-2 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs">
                        RD$ {lin.copagoPaciente.toLocaleString()}
                      </td>

                      {/* Eliminar Fila */}
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleEliminarLinea(lin.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded cursor-pointer"
                          title="Eliminar línea de cobro"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Accesos rápidos frecuentes de servicios ginecológicos */}
            <div className="p-2.5 bg-muted/10 border-t border-border flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground mr-1">Frecuentes:</span>
              {[
                { id: 'srv-con-gin', label: '+ Consulta Ginecológica' },
                { id: 'srv-prc-pap-c', label: '+ Papanicolaou (PAP)' },
                { id: 'srv-img-eco-pelv', label: '+ Sonografía Pélvica' },
                { id: 'srv-img-eco-tv', label: '+ Sonografía Transvaginal' },
                { id: 'srv-lab-hemo', label: '+ Hemograma' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleAgregarServicio(item.id)}
                  className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer border border-border/50 text-[10px]"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── SECCIÓN 3: TOTALIZACIÓN & COBRO DEL COPAGO ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Tarjeta de Totales */}
          <Card className="lg:col-span-5 border-border/80 shadow-xs flex flex-col justify-between">
            <CardHeader className="py-3 px-4 border-b border-border/60 bg-muted/20">
              <CardTitle className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                3. Liquidación Económica
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5 text-xs flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Subtotal Servicios:</span>
                <span className="font-mono font-semibold text-foreground text-sm">
                  RD$ {totales.subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-dashed border-border text-blue-600 dark:text-blue-400">
                <span className="flex items-center gap-1">
                  <Shield className="size-3.5" /> Reclamación a ARS:
                </span>
                <span className="font-mono font-bold text-sm">
                  - RD$ {totales.totalArs.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                <div>
                  <span className="font-bold text-xs uppercase block">Copago a Cobrar:</span>
                  <span className="text-[10px] text-muted-foreground">Monto neto del paciente</span>
                </div>
                <div className="font-mono font-black text-xl">
                  RD$ {totales.totalCopago.toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta de Forma de Pago y Emisión */}
          <Card className="lg:col-span-7 border-border/80 shadow-xs">
            <CardHeader className="py-3 px-4 border-b border-border/60 bg-muted/20">
              <CardTitle className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
                4. Método de Pago del Paciente
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 space-y-3.5">
              {/* Selector de Método de Pago */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'EFECTIVO', label: 'Efectivo', icon: <Banknote className="size-3.5" /> },
                  { id: 'TARJETA_DEBITO', label: 'T. Débito', icon: <CreditCard className="size-3.5" /> },
                  { id: 'TARJETA_CREDITO', label: 'T. Crédito', icon: <CreditCard className="size-3.5" /> },
                  { id: 'TRANSFERENCIA', label: 'Transferencia', icon: <Building2 className="size-3.5" /> },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMetodoPago(item.id as any)}
                    className={`py-2 px-1 rounded-lg text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                      metodoPago === item.id
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Parámetros según método de pago */}
              {metodoPago === 'EFECTIVO' ? (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/20 border border-border">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Efectivo Recibido (RD$)</label>
                    <Input
                      type="number"
                      step={50}
                      className="h-8 text-xs font-mono font-bold bg-background"
                      value={montoRecibido}
                      onChange={(e) => setMontoRecibido(Number(e.target.value) || 0)}
                    />
                    <div className="flex items-center gap-1 pt-0.5">
                      {[totales.totalCopago, totales.totalCopago + 500, totales.totalCopago + 1000].map((quick, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setMontoRecibido(quick)}
                          className="text-[9px] px-1.5 py-0.2 rounded bg-muted hover:bg-muted/80 text-foreground cursor-pointer font-mono"
                        >
                          RD$ {quick}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-center items-end text-right">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">Cambio / Vuelto:</span>
                    <span className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400">
                      RD$ {cambioDevuelto.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    No. de Autorización / Referencia / Voucher del POS o Transferencia
                  </label>
                  <Input
                    className="h-8 text-xs font-mono bg-background"
                    placeholder="Ej. REF-983142, Aprobación 441029"
                    value={referenciaPago}
                    onChange={(e) => setReferenciaPago(e.target.value)}
                  />
                </div>
              )}

              {/* Botón Principal de Emisión */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={guardando}
                  className="w-full h-10 text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer"
                >
                  {guardando ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  Emitir Factura y Registrar Cobro (RD$ {totales.totalCopago.toLocaleString()})
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* ── MODAL RECIBO DE PAGO OFICIAL IMPRIMIBLE ── */}
      {reciboGenerado && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 print:p-0 print:m-0 print:static print:bg-transparent print:backdrop-blur-none">
          <Card className="max-w-md w-full shadow-2xl border-border bg-card print:border-none print:shadow-none print:bg-transparent print:max-w-none print:p-0 print:m-0 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-3.5 border-b border-border flex items-center justify-between no-print print:hidden">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-xs">Comprobante Oficial Emitido</h3>
                  <p className="text-[10px] text-muted-foreground">Factura guardada con éxito en caja</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="size-7 cursor-pointer" onClick={() => resetFormulario()}>
                <X className="size-4" />
              </Button>
            </div>

            {/* Formato de Ticket / Factura Limpia */}
            <div id="comprobante-clinico" className="p-5 space-y-3.5 text-xs bg-white text-slate-900 print:p-2">
              <div className="text-center pb-2.5 border-b border-slate-200 print:border-black space-y-0.5">
                <h1 className="text-sm font-black tracking-wider uppercase text-slate-900">
                  Centro Médico Clínico Gestia
                </h1>
                <p className="text-[10px] text-slate-500 print:text-black">Santo Domingo, República Dominicana</p>
                <div className="pt-1">
                  <h2 className="text-[11px] font-black tracking-widest uppercase text-emerald-700 print:text-black">
                    RECIBO OFICIAL DE COBRO
                  </h2>
                  <div className="text-xs font-mono font-bold text-slate-900">
                    {reciboGenerado.numeroRecibo}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(reciboGenerado.creadoEn || Date.now()).toLocaleString('es-DO')}
                  </div>
                </div>
              </div>

              {/* Paciente y ARS */}
              <div className="space-y-1 bg-slate-50 p-2 rounded border border-slate-200 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Paciente:</span>
                  <strong className="text-slate-900 font-bold">
                    {reciboGenerado.paciente?.nombre} {reciboGenerado.paciente?.apellido || ''}
                  </strong>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Documento:</span>
                  <span className="font-mono">{reciboGenerado.paciente?.documentoIdentidad || 'S/D'}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">ARS / Seguro:</span>
                  <span className="font-semibold text-slate-800">{reciboGenerado.nombreAseguradora || 'Particular'}</span>
                </div>
                {reciboGenerado.numeroAutorizacion && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">No. Autorización:</span>
                    <span className="font-mono font-bold text-slate-900">{reciboGenerado.numeroAutorizacion}</span>
                  </div>
                )}
              </div>

              {/* Detalle de Conceptos */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold border-b border-slate-300 pb-1 text-slate-900 uppercase text-[10px]">
                  <span>Servicio / Detalle</span>
                  <span>Importe</span>
                </div>
                <div className="py-1 text-slate-700 text-[11px]">
                  {reciboGenerado.concepto}
                </div>
                <div className="flex justify-between text-slate-600 text-[10px] pt-1">
                  <span>Subtotal bruto:</span>
                  <span className="font-mono">RD$ {Number(reciboGenerado.montoTotal).toLocaleString()}</span>
                </div>
                {reciboGenerado.coberturaSeguro > 0 && (
                  <div className="flex justify-between text-blue-700 text-[10px]">
                    <span>Cobertura ARS acreditada:</span>
                    <span className="font-mono">- RD$ {Number(reciboGenerado.coberturaSeguro).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Total y Pago */}
              <div className="border-t-2 border-slate-900 pt-2 space-y-1">
                <div className="flex justify-between font-black text-sm text-slate-900">
                  <span>COPAGO ABONADO:</span>
                  <span className="font-mono text-base text-emerald-700 print:text-black">
                    RD$ {Number(reciboGenerado.montoCopago || reciboGenerado.montoTotal).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span>Método de Pago:</span>
                  <span className="font-bold text-slate-900">{reciboGenerado.metodoPago}</span>
                </div>
                {reciboGenerado.cambioDevuelto > 0 && (
                  <div className="flex justify-between text-slate-600 text-[10px]">
                    <span>Cambio Entregado:</span>
                    <span className="font-mono font-bold text-emerald-700">RD$ {Number(reciboGenerado.cambioDevuelto).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Pie */}
              <div className="pt-4 border-t border-slate-200 text-center space-y-1 text-[9px] text-slate-500">
                <p>Comprobante válido como constancia de cobro ambulatorio.</p>
                <p className="font-semibold text-emerald-800">¡Gracias por su visita!</p>
              </div>
            </div>

            <div className="p-3 border-t border-border flex items-center justify-between no-print print:hidden bg-muted/20">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 gap-1.5 cursor-pointer"
                onClick={() => window.print()}
              >
                <Printer className="size-3.5" /> Imprimir Comprobante
              </Button>

              <div className="flex items-center gap-1.5">
                {onIrAHistorial && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 cursor-pointer"
                    onClick={() => {
                      resetFormulario();
                      onIrAHistorial();
                    }}
                  >
                    Ver en Historial
                  </Button>
                )}
                <Button
                  size="sm"
                  className="text-xs h-7 cursor-pointer bg-primary"
                  onClick={() => resetFormulario()}
                >
                  Nueva Factura
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
