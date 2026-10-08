import * as React from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Banknote,
  CreditCard,
  Shield,
  Lock,
  Unlock,
  Printer,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  History,
  TrendingUp,
  Receipt,
  DollarSign,
} from 'lucide-react';

interface SesionActivaData {
  sesion: {
    id: string;
    usuarioId: string;
    estado: 'ABIERTA' | 'CERRADA';
    montoInicial: number;
    fechaApertura: string;
    observacionesApertura: string | null;
    usuario?: {
      nombre: string;
      apellido: string | null;
      email: string;
    };
  } | null;
  totales: {
    montoInicial: number;
    totalRecaudado: number;
    totalEfectivo: number;
    totalTarjetaDebito: number;
    totalTarjetaCredito: number;
    totalTarjetas: number;
    totalTransferencia: number;
    totalSeguro: number;
    totalCopagos: number;
    saldoEfectivoEsperado: number;
    cantidadPagos: number;
  } | null;
}

interface Props {
  onAbrirCajaExito?: () => void;
  onCerrarCajaExito?: () => void;
}

export function TurnoArqueoView({ onAbrirCajaExito, onCerrarCajaExito }: Props) {
  const { user } = useAuth();
  const [dataActiva, setDataActiva] = React.useState<SesionActivaData | null>(null);
  const [sesionesHistoricas, setSesionesHistoricas] = React.useState<any[]>([]);
  const [cargando, setCargando] = React.useState(true);

  // Modales
  const [showModalAbrir, setShowModalAbrir] = React.useState(false);
  const [showModalCerrar, setShowModalCerrar] = React.useState(false);
  const [comprobanteImprimir, setComprobanteImprimir] = React.useState<any | null>(null);

  // Formularios
  const [montoInicialForm, setMontoInicialForm] = React.useState<number>(1000);
  const [observacionesAbrir, setObservacionesAbrir] = React.useState('');

  const [montoRealForm, setMontoRealForm] = React.useState<number>(0);
  const [observacionesCerrar, setObservacionesCerrar] = React.useState('');

  const [guardando, setGuardando] = React.useState(false);
  const [mensajeError, setMensajeError] = React.useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = React.useState<string | null>(null);

  const cargarDatos = React.useCallback(async () => {
    setCargando(true);
    try {
      const [resActiva, resHistorial] = await Promise.allSettled([
        api.get('/caja/sesion-activa'),
        api.get('/caja/sesiones?limite=20'),
      ]);

      if (resActiva.status === 'fulfilled') {
        setDataActiva(resActiva.value);
        if (resActiva.value?.totales?.saldoEfectivoEsperado !== undefined) {
          setMontoRealForm(resActiva.value.totales.saldoEfectivoEsperado);
        }
      } else {
        setDataActiva(null);
      }

      if (resHistorial.status === 'fulfilled') {
        const h = resHistorial.value;
        const lista = Array.isArray(h) ? h : h?.datos || [];
        setSesionesHistoricas(lista);
      }
    } catch (err) {
      console.error('Error cargando datos de turno y arqueo:', err);
    } finally {
      setCargando(false);
    }
  }, []);

  React.useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const sesion = dataActiva?.sesion;
  const totales = dataActiva?.totales;
  const estaAbierta = sesion && sesion.estado === 'ABIERTA';

  // Manejar apertura
  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensajeError(null);
    try {
      await api.post('/caja/abrir', {
        montoInicial: Number(montoInicialForm) || 0,
        observacionesApertura: observacionesAbrir || undefined,
      });
      setShowModalAbrir(false);
      setMensajeExito('Turno de caja abierto satisfactoriamente.');
      await cargarDatos();
      if (onAbrirCajaExito) onAbrirCajaExito();
    } catch (err: any) {
      setMensajeError(err.message || 'Error al abrir turno de caja');
    } finally {
      setGuardando(false);
    }
  };

  // Manejar cierre / arqueo
  const handleCerrarCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensajeError(null);
    try {
      const sesionCerrada = await api.post('/caja/cerrar', {
        montoRealEfectivo: Number(montoRealForm) || 0,
        observacionesCierre: observacionesCerrar || undefined,
      });
      setShowModalCerrar(false);
      setMensajeExito('Turno de caja cerrado y arqueo registrado correctamente.');

      // Preparar comprobante para imprimir
      setComprobanteImprimir({
        sesion: sesionCerrada?.sesion || sesion,
        totales: totales,
        montoReal: Number(montoRealForm) || 0,
        diferencia: (Number(montoRealForm) || 0) - (totales?.saldoEfectivoEsperado || 0),
        observaciones: observacionesCerrar,
        fechaCierre: new Date().toISOString(),
      });

      await cargarDatos();
      if (onCerrarCajaExito) onCerrarCajaExito();
    } catch (err: any) {
      setMensajeError(err.message || 'Error al cerrar turno de caja');
    } finally {
      setGuardando(false);
    }
  };

  // Cálculo en vivo de descuadre en modal
  const diferenciaModal = React.useMemo(() => {
    const esperado = totales?.saldoEfectivoEsperado || 0;
    return (Number(montoRealForm) || 0) - esperado;
  }, [montoRealForm, totales]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Alertas de éxito o error */}
      {mensajeExito && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito(null)} className="hover:opacity-75">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {mensajeError && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{mensajeError}</span>
          </div>
          <button onClick={() => setMensajeError(null)} className="hover:opacity-75">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ── Encabezado y Estado de la Caja ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Banknote className="size-6 text-emerald-600 dark:text-emerald-400" />
            Turno y Control de Caja
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Apertura de turno, arqueo en tiempo real, cuadre de gaveta y cierre contable
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={cargarDatos}
            disabled={cargando}
            className="text-xs h-9 gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>

          {estaAbierta ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setMontoRealForm(totales?.saldoEfectivoEsperado || 0);
                setShowModalCerrar(true);
              }}
              className="text-xs h-9 gap-1.5 shadow-sm"
            >
              <Lock className="size-3.5" />
              Cerrar Turno y Cuadrar
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setShowModalAbrir(true)}
              className="text-xs h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <Unlock className="size-3.5" />
              Abrir Turno de Caja
            </Button>
          )}
        </div>
      </div>

      {/* ── Tarjeta de Estado Actual del Turno ── */}
      {estaAbierta ? (
        <Card className="border-emerald-500/30 bg-emerald-500/[0.03] shadow-xs">
          <CardHeader className="pb-3 pt-4 px-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="relative flex size-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-3 bg-emerald-500"></span>
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-semibold text-emerald-950 dark:text-emerald-200">
                      Turno Abierto y Operativo
                    </CardTitle>
                    <Badge variant="default" className="bg-emerald-600 text-white text-[10px] py-0 px-2">
                      En Curso
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-0.5">
                    Iniciado el{' '}
                    <strong className="text-foreground">
                      {new Date(sesion.fechaApertura).toLocaleDateString('es-DO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </strong>{' '}
                    por{' '}
                    <strong className="text-foreground">
                      {sesion.usuario?.nombre} {sesion.usuario?.apellido || ''}
                    </strong>
                  </CardDescription>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-[11px] text-muted-foreground uppercase font-medium">Fondo Inicial</div>
                <div className="text-base font-bold text-foreground">
                  RD$ {Number(sesion.montoInicial || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-5 pb-5 pt-0">
            {/* KPI Cards de Arqueo en Tiempo Real */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              <div className="p-3 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] font-medium">Efectivo Recaudado</span>
                  <Banknote className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-base font-bold text-foreground">
                  RD$ {Number(totales?.totalEfectivo || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Cobros en moneda física</div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] font-medium">Tarjetas & Bancos</span>
                  <CreditCard className="size-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-base font-bold text-foreground">
                  RD$ {Number((totales?.totalTarjetas || 0) + (totales?.totalTransferencia || 0)).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Débito, crédito y transf.
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] font-medium">Cobertura ARS</span>
                  <Shield className="size-3.5 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="text-base font-bold text-sky-700 dark:text-sky-300">
                  RD$ {Number(totales?.totalSeguro || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Reclamación a aseguradoras</div>
              </div>

              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 mb-1">
                  <span className="text-[11px] font-semibold">Efectivo Esperado</span>
                  <DollarSign className="size-3.5" />
                </div>
                <div className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                  RD$ {Number(totales?.saldoEfectivoEsperado || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-emerald-800/80 dark:text-emerald-400/80 mt-0.5">
                  Fondo inicial + Efectivo
                </div>
              </div>
            </div>

            {/* Resumen adicional */}
            <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>
                  Facturas emitidas hoy: <strong className="text-foreground">{totales?.cantidadPagos || 0}</strong>
                </span>
                <span>
                  Total copagos pacientes:{' '}
                  <strong className="text-foreground">
                    RD$ {Number(totales?.totalCopagos || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </strong>
                </span>
                <span>
                  Total bruto facturado:{' '}
                  <strong className="text-foreground">
                    RD$ {Number(totales?.totalRecaudado || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </strong>
                </span>
              </div>
              {sesion.observacionesApertura && (
                <div className="text-[11px] italic">
                  Nota apertura: &quot;{sesion.observacionesApertura}&quot;
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-500/30 bg-amber-500/[0.04]">
          <CardContent className="p-6 text-center">
            <div className="size-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Lock className="size-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Turno de Caja Cerrado</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-4">
              Para registrar cobros y cuadrar fondos en efectivo, abre un nuevo turno indicando el fondo inicial para cambio en gaveta.
            </p>
            <Button
              onClick={() => setShowModalAbrir(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
            >
              <Unlock className="size-3.5" />
              Abrir Turno de Caja con Fondo Inicial
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Histórico de Turnos Cerrados ── */}
      <Card className="border-border">
        <CardHeader className="p-4 sm:p-5 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="size-4 text-primary" />
                Histórico de Cierres de Caja y Arqueos
              </CardTitle>
              <CardDescription className="text-xs">
                Auditoría de turnos cerrados con balance esperado vs. real contado
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs shrink-0 self-start sm:self-auto">
              {sesionesHistoricas.length} turnos registrados
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {sesionesHistoricas.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No hay turnos cerrados previos registrados en el sistema.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-4 font-semibold">Fecha Apertura</th>
                    <th className="py-2.5 px-4 font-semibold">Fecha Cierre</th>
                    <th className="py-2.5 px-4 font-semibold">Cajero(a)</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Fondo Inicial</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Total Facturado</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Efectivo Real</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Cuadre / Dif.</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sesionesHistoricas.map((s) => {
                    const dif = Number(s.diferenciaEfectivo || 0);
                    const cuadrada = Math.abs(dif) < 0.01;
                    const sobrante = dif > 0.01;
                    const faltante = dif < -0.01;

                    return (
                      <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                          {new Date(s.fechaApertura).toLocaleDateString('es-DO', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                          {s.fechaCierre
                            ? new Date(s.fechaCierre).toLocaleDateString('es-DO', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'En curso'}
                        </td>
                        <td className="py-3 px-4 text-foreground whitespace-nowrap">
                          {s.usuario?.nombre} {s.usuario?.apellido || ''}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          RD$ {Number(s.montoInicial || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-foreground whitespace-nowrap">
                          RD$ {Number(s.totalRecaudado || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-foreground whitespace-nowrap">
                          RD$ {Number(s.montoRealEfectivo || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {cuadrada ? (
                            <Badge variant="default" className="bg-emerald-600 text-white text-[10px] py-0 px-2 font-medium">
                              Cuadrada (RD$ 0)
                            </Badge>
                          ) : sobrante ? (
                            <Badge variant="info" className="text-[10px] py-0 px-2 font-medium">
                              +RD$ {dif.toFixed(2)} (Sobrante)
                            </Badge>
                          ) : faltante ? (
                            <Badge variant="destructive" className="text-[10px] py-0 px-2 font-medium">
                              -RD$ {Math.abs(dif).toFixed(2)} (Faltante)
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              N/D
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-foreground"
                            title="Imprimir Comprobante de Arqueo"
                            onClick={() => {
                              setComprobanteImprimir({
                                sesion: s,
                                totales: {
                                  montoInicial: s.montoInicial,
                                  totalRecaudado: s.totalRecaudado,
                                  totalEfectivo: s.totalEfectivo,
                                  totalTarjetas: s.totalTarjetas,
                                  totalTransferencia: s.totalTransferencia,
                                  totalSeguro: s.totalSeguro,
                                  saldoEfectivoEsperado: s.saldoEfectivoEsperado,
                                },
                                montoReal: s.montoRealEfectivo,
                                diferencia: s.diferenciaEfectivo,
                                observaciones: s.observacionesCierre,
                                fechaCierre: s.fechaCierre,
                              });
                            }}
                          >
                            <Printer className="size-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── MODAL: APERTURA DE CAJA ── */}
      {showModalAbrir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Unlock className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Abrir Turno de Caja</h3>
                  <p className="text-xs text-muted-foreground">Fondo inicial de cambio en gaveta</p>
                </div>
              </div>
              <button
                onClick={() => setShowModalAbrir(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAbrirCaja} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Monto Inicial en Efectivo (RD$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">RD$</span>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    value={montoInicialForm}
                    onChange={(e) => setMontoInicialForm(Number(e.target.value))}
                    required
                    className="pl-12 text-sm font-semibold h-10"
                    placeholder="1000"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Fondo entregado al cajero para dar cambio / vueltos a los pacientes.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Observaciones de Apertura (Opcional)
                </label>
                <Input
                  type="text"
                  value={observacionesAbrir}
                  onChange={(e) => setObservacionesAbrir(e.target.value)}
                  className="text-xs h-9"
                  placeholder="Ej: Turno matutino, billetes de 100 y 200..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModalAbrir(false)}
                  disabled={guardando}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={guardando}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                >
                  {guardando ? (
                    <RefreshCw className="size-3.5 animate-spin" />
                  ) : (
                    <Unlock className="size-3.5" />
                  )}
                  Confirmar Apertura
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CIERRE DE CAJA Y ARQUEO ── */}
      {showModalCerrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                  <Lock className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Cierre de Caja y Arqueo</h3>
                  <p className="text-xs text-muted-foreground">Cuadre final de efectivo en gaveta</p>
                </div>
              </div>
              <button
                onClick={() => setShowModalCerrar(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Resumen de totales del sistema */}
            <div className="p-3.5 rounded-xl bg-muted/50 border border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fondo Inicial:</span>
                <span className="font-semibold text-foreground">
                  RD$ {Number(totales?.montoInicial || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">+ Efectivo Recaudado por Cobros:</span>
                <span className="font-semibold text-foreground">
                  RD$ {Number(totales?.totalEfectivo || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border">
                <span className="font-bold text-foreground">Saldo Esperado en Gaveta:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  RD$ {Number(totales?.saldoEfectivoEsperado || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <form onSubmit={handleCerrarCaja} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Efectivo Real Contado en Gaveta (RD$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">RD$</span>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={montoRealForm}
                    onChange={(e) => setMontoRealForm(Number(e.target.value))}
                    required
                    className="pl-12 text-sm font-bold h-10"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Cuenta físicamente todos los billetes y monedas que hay en la caja.
                </p>
              </div>

              {/* Indicador de Descuadre */}
              <div className="p-3 rounded-lg border text-xs">
                {Math.abs(diferenciaModal) < 0.01 ? (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>✓ Caja Cuadrada Perfecta (RD$ 0.00 de diferencia)</span>
                  </div>
                ) : diferenciaModal > 0.01 ? (
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                    <TrendingUp className="size-4 shrink-0" />
                    <span>
                      + Sobrante de Caja: RD$ {diferenciaModal.toFixed(2)} (Hay más dinero del registrado)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-destructive font-semibold">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>
                      - Faltante de Caja: RD$ {Math.abs(diferenciaModal).toFixed(2)} (Falta dinero según sistema)
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Observaciones de Cierre (Opcional)
                </label>
                <Input
                  type="text"
                  value={observacionesCerrar}
                  onChange={(e) => setObservacionesCerrar(e.target.value)}
                  className="text-xs h-9"
                  placeholder="Justificación de sobrante/faltante, entregado a..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModalCerrar(false)}
                  disabled={guardando}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={guardando}
                  className="text-xs gap-1.5"
                >
                  {guardando ? (
                    <RefreshCw className="size-3.5 animate-spin" />
                  ) : (
                    <Lock className="size-3.5" />
                  )}
                  Confirmar y Cerrar Turno
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: COMPROBANTE DE CIERRE Y ARQUEO IMPRIMIBLE ── */}
      {comprobanteImprimir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border flex items-center justify-between print:hidden">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Receipt className="size-4 text-primary" />
                Comprobante de Cierre de Caja
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => window.print()}
                  className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Printer className="size-3.5" />
                  Imprimir Comprobante
                </Button>
                <button
                  onClick={() => setComprobanteImprimir(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
              <div className="text-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="text-base font-bold tracking-tight">GESTIA CLÍNICA</div>
                <div className="text-[11px] text-zinc-500">COMPROBANTE DE ARQUEO Y CIERRE DE CAJA</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">República Dominicana</div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Cajero(a):</span>
                  <span className="font-semibold">
                    {user?.nombre} {user?.apellido || ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Fecha Cierre:</span>
                  <span>{new Date(comprobanteImprimir.fechaCierre).toLocaleString('es-DO')}</span>
                </div>
              </div>

              <div className="border-t border-b border-zinc-200 dark:border-zinc-800 py-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Fondo Inicial:</span>
                  <span>RD$ {Number(comprobanteImprimir.totales?.montoInicial || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Efectivo Recaudado:</span>
                  <span>RD$ {Number(comprobanteImprimir.totales?.totalEfectivo || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tarjetas Débito/Crédito:</span>
                  <span>RD$ {Number(comprobanteImprimir.totales?.totalTarjetas || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transferencias:</span>
                  <span>RD$ {Number(comprobanteImprimir.totales?.totalTransferencia || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reclamación ARS:</span>
                  <span>RD$ {Number(comprobanteImprimir.totales?.totalSeguro || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-zinc-200 dark:border-zinc-800">
                  <span>Total Bruto Facturado:</span>
                  <span>RD$ {Number(comprobanteImprimir.totales?.totalRecaudado || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between font-bold">
                  <span>Saldo Esperado Efectivo:</span>
                  <span>RD$ {Number(comprobanteImprimir.totales?.saldoEfectivoEsperado || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Efectivo Real Contado:</span>
                  <span>RD$ {Number(comprobanteImprimir.montoReal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Diferencia / Descuadre:</span>
                  <span className={comprobanteImprimir.diferencia < 0 ? 'text-red-500' : 'text-emerald-500'}>
                    RD$ {Number(comprobanteImprimir.diferencia || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {comprobanteImprimir.observaciones && (
                <div className="text-[10px] text-zinc-500 border-t border-zinc-200 dark:border-zinc-800 pt-2">
                  Observaciones: {comprobanteImprimir.observaciones}
                </div>
              )}

              <div className="pt-8 grid grid-cols-2 gap-4 text-center text-[10px] text-zinc-500">
                <div className="border-t border-zinc-400 pt-1">Firma Cajero(a)</div>
                <div className="border-t border-zinc-400 pt-1">Firma Supervisor</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
