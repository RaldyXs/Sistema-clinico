import * as React from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Printer,
  Ban,
  RefreshCw,
  Shield,
  CreditCard,
  Banknote,
  Building2,
  X,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { ARS_DOMINICANAS } from '@/data/ars-dominicanas';

interface Props {
  onNuevaFactura?: () => void;
}

export function FacturasHistorialView({ onNuevaFactura }: Props) {
  const [pagos, setPagos] = React.useState<any[]>([]);
  const [cargando, setCargando] = React.useState(true);

  // Filtros
  const [busqueda, setBusqueda] = React.useState('');
  const [filtroArs, setFiltroArs] = React.useState('TODAS');
  const [filtroMetodo, setFiltroMetodo] = React.useState('TODOS');
  const [filtroEstado, setFiltroEstado] = React.useState<'TODOS' | 'COBRADO' | 'ANULADO'>('TODOS');

  // Modales
  const [reciboVisualizar, setReciboVisualizar] = React.useState<any | null>(null);
  const [pagoAAnular, setPagoAAnular] = React.useState<any | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = React.useState('');
  const [anulando, setAnulando] = React.useState(false);
  const [errorAnulacion, setErrorAnulacion] = React.useState<string | null>(null);

  const cargarPagos = React.useCallback(async () => {
    setCargando(true);
    try {
      const res = await api.get('/caja/pagos?limite=150');
      const lista = Array.isArray(res) ? res : res?.datos || [];
      setPagos(lista);
    } catch (err) {
      console.error('Error cargando historial de facturas:', err);
    } finally {
      setCargando(false);
    }
  }, []);

  React.useEffect(() => {
    cargarPagos();
  }, [cargarPagos]);

  // Filtrado reactivo en cliente
  const pagosFiltrados = React.useMemo(() => {
    return pagos.filter((p) => {
      // Búsqueda libre
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const pacNombre = `${p.paciente?.nombre || ''} ${p.paciente?.apellido || ''}`.toLowerCase();
        const pacDoc = (p.paciente?.documentoIdentidad || p.paciente?.dni || '').toLowerCase();
        const recibo = (p.numeroRecibo || '').toLowerCase();
        const auth = (p.numeroAutorizacion || '').toLowerCase();
        const conc = (p.concepto || '').toLowerCase();

        if (
          !pacNombre.includes(q) &&
          !pacDoc.includes(q) &&
          !recibo.includes(q) &&
          !auth.includes(q) &&
          !conc.includes(q)
        ) {
          return false;
        }
      }

      // Filtro ARS
      if (filtroArs !== 'TODAS') {
        const arsVal = p.nombreAseguradora || 'Particular';
        if (filtroArs === 'Particular') {
          if (!arsVal.toLowerCase().includes('particular') && !arsVal.toLowerCase().includes('privado')) return false;
        } else if (!arsVal.toLowerCase().includes(filtroArs.toLowerCase())) {
          return false;
        }
      }

      // Filtro Método de pago
      if (filtroMetodo !== 'TODOS') {
        if (p.metodoPago !== filtroMetodo) return false;
      }

      // Filtro Estado
      if (filtroEstado !== 'TODOS') {
        if (p.estado !== filtroEstado) return false;
      }

      return true;
    });
  }, [pagos, busqueda, filtroArs, filtroMetodo, filtroEstado]);

  // Resumen de métricas del historial
  const metricas = React.useMemo(() => {
    const cobrados = pagosFiltrados.filter((p) => p.estado === 'COBRADO');
    const totalRecaudadoCopagos = cobrados.reduce((acc, p) => acc + (Number(p.montoCopago) || Number(p.montoTotal) || 0), 0);
    const totalReclamadoArs = cobrados.reduce((acc, p) => acc + (Number(p.coberturaSeguro) || 0), 0);
    const totalBruto = cobrados.reduce((acc, p) => acc + (Number(p.montoTotal) || 0), 0);
    const cantidadAnulados = pagosFiltrados.filter((p) => p.estado === 'ANULADO').length;

    return {
      totalRecaudadoCopagos,
      totalReclamadoArs,
      totalBruto,
      cantidadCobrados: cobrados.length,
      cantidadAnulados,
    };
  }, [pagosFiltrados]);

  // Ejecutar anulación justificada
  const handleConfirmarAnulacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pagoAAnular) return;
    if (!motivoAnulacion.trim()) {
      setErrorAnulacion('Por favor ingresa el motivo justificativo de la anulación.');
      return;
    }

    setAnulando(true);
    setErrorAnulacion(null);
    try {
      await api.patch(`/caja/pagos/${pagoAAnular.id}/anular`, {
        motivoAnulacion: motivoAnulacion.trim(),
      });
      setPagoAAnular(null);
      setMotivoAnulacion('');
      await cargarPagos();
    } catch (err: any) {
      setErrorAnulacion(err.message || 'Error al anular la factura.');
    } finally {
      setAnulando(false);
    }
  };

  const getBadgeMetodo = (metodo: string) => {
    switch (metodo) {
      case 'EFECTIVO':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <Banknote className="size-3" /> Efectivo
          </span>
        );
      case 'TARJETA_DEBITO':
      case 'TARJETA_CREDITO':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
            <CreditCard className="size-3" /> Tarjeta
          </span>
        );
      case 'TRANSFERENCIA':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
            <Building2 className="size-3" /> Transf.
          </span>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{metodo}</Badge>;
    }
  };

  return (
    <div className="space-y-3.5 max-w-6xl mx-auto pb-12">
      {/* ── KPIs Ejecutivos de Facturación ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <Card className="border-border/80 shadow-2xs">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Copagos Recaudados</p>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                RD$ {metricas.totalRecaudadoCopagos.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Efectivo / Tarjeta en caja</p>
            </div>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <DollarSign className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Por Cobrar a ARS</p>
              <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">
                RD$ {metricas.totalReclamadoArs.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Reclamaciones autorizadas</p>
            </div>
            <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Shield className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Total Bruto Facturado</p>
              <p className="text-lg font-black text-foreground mt-0.5">
                RD$ {metricas.totalBruto.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{metricas.cantidadCobrados} facturas emitidas</p>
            </div>
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <TrendingUp className="size-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Facturas Anuladas</p>
              <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">
                {metricas.cantidadAnulados}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Reversiones justificadas</p>
            </div>
            <div className="size-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <Ban className="size-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Barra de Filtros ── */}
      <Card className="border-border/80 shadow-2xs bg-muted/20">
        <CardContent className="p-3 space-y-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                className="pl-8 text-xs h-8 bg-background"
                placeholder="Buscar por paciente, cédula, No. recibo, autorización o concepto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Filtro ARS */}
              <select
                className="h-8 px-2 rounded-md border border-input bg-background text-xs outline-none focus:border-primary"
                value={filtroArs}
                onChange={(e) => setFiltroArs(e.target.value)}
              >
                <option value="TODAS">Todas las ARS</option>
                {ARS_DOMINICANAS.map((a) => (
                  <option key={a.id} value={a.nombre}>
                    {a.nombre}
                  </option>
                ))}
                <option value="Particular">Particular / Privado</option>
              </select>

              {/* Filtro Método */}
              <select
                className="h-8 px-2 rounded-md border border-input bg-background text-xs outline-none focus:border-primary"
                value={filtroMetodo}
                onChange={(e) => setFiltroMetodo(e.target.value)}
              >
                <option value="TODOS">Todos los Métodos</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA_DEBITO">Tarjeta Débito</option>
                <option value="TARJETA_CREDITO">Tarjeta Crédito</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>

              {/* Filtro Estado */}
              <select
                className="h-8 px-2 rounded-md border border-input bg-background text-xs outline-none focus:border-primary"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as any)}
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="COBRADO">Solo Cobrados</option>
                <option value="ANULADO">Solo Anulados</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 cursor-pointer"
                onClick={cargarPagos}
                title="Refrescar lista"
              >
                <RefreshCw className={`size-3.5 ${cargando ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
            <span>
              Mostrando <strong className="text-foreground">{pagosFiltrados.length}</strong> de{' '}
              <strong className="text-foreground">{pagos.length}</strong> registros
            </span>
            {(busqueda || filtroArs !== 'TODAS' || filtroMetodo !== 'TODOS' || filtroEstado !== 'TODOS') && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda('');
                  setFiltroArs('TODAS');
                  setFiltroMetodo('TODOS');
                  setFiltroEstado('TODOS');
                }}
                className="text-primary hover:underline cursor-pointer font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Tabla de Facturas Emitidas ── */}
      <Card className="border-border/80 shadow-2xs">
        <CardContent className="p-0">
          {cargando && pagos.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-xs">
              <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-primary" />
              Cargando historial de facturas y cobros...
            </div>
          ) : pagosFiltrados.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-xs space-y-2">
              <p>No se encontraron comprobantes con los filtros seleccionados.</p>
              {onNuevaFactura && (
                <Button size="sm" onClick={onNuevaFactura} className="text-xs h-7">
                  Crear Nueva Factura
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase bg-muted/40 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-3 py-2 font-semibold">No. Recibo</th>
                    <th className="px-3 py-2 font-semibold">Fecha & Hora</th>
                    <th className="px-3 py-2 font-semibold">Paciente</th>
                    <th className="px-3 py-2 font-semibold">ARS & Autorización</th>
                    <th className="px-3 py-2 font-semibold">Concepto / Servicio</th>
                    <th className="px-3 py-2 font-semibold text-right">Copago Cobrado</th>
                    <th className="px-3 py-2 font-semibold">Método</th>
                    <th className="px-3 py-2 font-semibold text-center">Estado</th>
                    <th className="px-3 py-2 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pagosFiltrados.map((p) => {
                    const esAnulado = p.estado === 'ANULADO';
                    const fechaObj = new Date(p.creadoEn);

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-muted/30 transition-colors ${
                          esAnulado ? 'opacity-60 bg-muted/10' : ''
                        }`}
                      >
                        {/* No. Recibo */}
                        <td className="px-3 py-2.5 font-mono font-bold text-foreground">
                          {p.numeroRecibo}
                        </td>

                        {/* Fecha */}
                        <td className="px-3 py-2.5 text-[11px] text-muted-foreground whitespace-nowrap">
                          <div>{fechaObj.toLocaleDateString('es-DO')}</div>
                          <div className="text-[10px]">{fechaObj.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>

                        {/* Paciente */}
                        <td className="px-3 py-2.5">
                          <div className="font-semibold text-foreground">
                            {p.paciente?.nombre} {p.paciente?.apellido || ''}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground">
                            Céd: {p.paciente?.documentoIdentidad || p.paciente?.dni || 'S/D'}
                          </div>
                        </td>

                        {/* ARS y Autorización */}
                        <td className="px-3 py-2.5 space-y-0.5">
                          <div className="text-[11px] font-medium text-foreground">
                            {p.nombreAseguradora || 'Particular'}
                          </div>
                          {p.numeroAutorizacion ? (
                            <div className="text-[10px] font-mono text-primary font-semibold">
                              Aut: {p.numeroAutorizacion}
                            </div>
                          ) : (
                            <div className="text-[10px] text-muted-foreground italic">Sin autoriz.</div>
                          )}
                        </td>

                        {/* Concepto */}
                        <td className="px-3 py-2.5 max-w-[200px] truncate text-[11px]" title={p.concepto}>
                          {p.concepto}
                        </td>

                        {/* Copago Cobrado */}
                        <td className="px-3 py-2.5 text-right font-mono font-black text-xs text-foreground whitespace-nowrap">
                          RD$ {Number(p.montoCopago || p.montoTotal).toLocaleString()}
                        </td>

                        {/* Método */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {getBadgeMetodo(p.metodoPago)}
                        </td>

                        {/* Estado */}
                        <td className="px-3 py-2.5 text-center">
                          <Badge
                            variant={esAnulado ? 'destructive' : 'success'}
                            className="text-[10px] py-0 px-1.5"
                          >
                            {p.estado}
                          </Badge>
                        </td>

                        {/* Acciones */}
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-[11px] gap-1 cursor-pointer"
                              onClick={() => setReciboVisualizar(p)}
                              title="Reimprimir o ver recibo"
                            >
                              <Printer className="size-3" />
                              <span className="hidden sm:inline">Ver</span>
                            </Button>

                            {!esAnulado && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1.5 text-[11px] text-destructive hover:bg-destructive/10 cursor-pointer"
                                onClick={() => {
                                  setPagoAAnular(p);
                                  setMotivoAnulacion('');
                                  setErrorAnulacion(null);
                                }}
                                title="Anular comprobante"
                              >
                                <Ban className="size-3" />
                              </Button>
                            )}
                          </div>
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

      {/* ── MODAL VER / REIMPRIMIR COMPROBANTE ── */}
      {reciboVisualizar && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 print:p-0 print:m-0 print:static print:bg-transparent">
          <Card className="max-w-md w-full shadow-2xl border-border bg-card print:border-none print:shadow-none print:p-0">
            <div className="p-3 border-b border-border flex items-center justify-between no-print print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="size-4 text-primary" />
                <h3 className="font-semibold text-xs text-foreground">Comprobante de Caja</h3>
              </div>
              <Button variant="ghost" size="icon" className="size-6 cursor-pointer" onClick={() => setReciboVisualizar(null)}>
                <X className="size-3.5" />
              </Button>
            </div>

            <div className="p-5 space-y-3.5 text-xs bg-white text-slate-900 print:p-2">
              <div className="text-center pb-2 border-b border-slate-200 space-y-0.5">
                <h1 className="text-sm font-black uppercase">Centro Médico Clínico Gestia</h1>
                <p className="text-[10px] text-slate-500">República Dominicana</p>
                <div className="text-xs font-mono font-bold mt-1 text-emerald-800">
                  {reciboVisualizar.numeroRecibo}
                </div>
                <div className="text-[10px] text-slate-500">
                  {new Date(reciboVisualizar.creadoEn).toLocaleString('es-DO')}
                </div>
              </div>

              <div className="space-y-1 bg-slate-50 p-2 rounded border border-slate-200 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Paciente:</span>
                  <strong>{reciboVisualizar.paciente?.nombre} {reciboVisualizar.paciente?.apellido || ''}</strong>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Cédula:</span>
                  <span className="font-mono">{reciboVisualizar.paciente?.documentoIdentidad || 'S/D'}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">ARS:</span>
                  <span>{reciboVisualizar.nombreAseguradora || 'Particular'}</span>
                </div>
                {reciboVisualizar.numeroAutorizacion && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Autorización:</span>
                    <span className="font-mono font-bold">{reciboVisualizar.numeroAutorizacion}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1 border-t border-slate-200 pt-2">
                <div className="text-slate-700">{reciboVisualizar.concepto}</div>
                <div className="flex justify-between pt-1">
                  <span>Importe total servicio:</span>
                  <span className="font-mono">RD$ {Number(reciboVisualizar.montoTotal).toLocaleString()}</span>
                </div>
                {reciboVisualizar.coberturaSeguro && (
                  <div className="flex justify-between text-blue-700 text-[10px]">
                    <span>Cobertura ARS:</span>
                    <span className="font-mono">- RD$ {Number(reciboVisualizar.coberturaSeguro).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="border-t-2 border-slate-900 pt-2 space-y-1">
                <div className="flex justify-between font-black text-sm">
                  <span>COPAGO ABONADO:</span>
                  <span className="font-mono text-emerald-700">
                    RD$ {Number(reciboVisualizar.montoCopago || reciboVisualizar.montoTotal).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Método de pago:</span>
                  <span className="font-bold">{reciboVisualizar.metodoPago}</span>
                </div>
                {reciboVisualizar.estado === 'ANULADO' && (
                  <div className="p-2 rounded bg-red-100 text-red-800 text-[10px] font-bold mt-2">
                    COMPROBANTE ANULADO: {reciboVisualizar.motivoAnulacion || 'Sin motivo'}
                  </div>
                )}
              </div>
            </div>

            <div className="p-2.5 border-t border-border flex items-center justify-between no-print print:hidden bg-muted/20">
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 cursor-pointer" onClick={() => window.print()}>
                <Printer className="size-3" /> Imprimir
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs cursor-pointer" onClick={() => setReciboVisualizar(null)}>
                Cerrar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── MODAL ANULAR COMPROBANTE ── */}
      {pagoAAnular && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-2xl border-border bg-card">
            <CardHeader className="py-3 px-4 border-b border-border">
              <div className="flex items-center gap-2 text-destructive">
                <Ban className="size-4" />
                <CardTitle className="text-sm">Anulación de Comprobante</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Se revertirá el cobro del recibo <strong>{pagoAAnular.numeroRecibo}</strong>
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleConfirmarAnulacion}>
              <CardContent className="p-4 space-y-3">
                {errorAnulacion && (
                  <div className="p-2.5 rounded bg-destructive/10 text-destructive text-xs">
                    {errorAnulacion}
                  </div>
                )}

                <div className="p-2.5 rounded bg-muted/30 border border-border text-xs space-y-1">
                  <div>Paciente: <strong>{pagoAAnular.paciente?.nombre} {pagoAAnular.paciente?.apellido}</strong></div>
                  <div>Monto Copago: <strong>RD$ {Number(pagoAAnular.montoCopago || pagoAAnular.montoTotal).toLocaleString()}</strong></div>
                  <div>Método: <strong>{pagoAAnular.metodoPago}</strong></div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Motivo obligatorio de anulación *
                  </label>
                  <textarea
                    required
                    rows={3}
                    className="w-full rounded-md border border-input bg-background p-2 text-xs outline-none focus:border-destructive resize-none"
                    placeholder="Ej. Error en selección de seguro, paciente solicita cambio de procedimiento..."
                    value={motivoAnulacion}
                    onChange={(e) => setMotivoAnulacion(e.target.value)}
                  />
                </div>
              </CardContent>

              <div className="p-3 border-t border-border flex justify-end gap-2 bg-muted/10">
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPagoAAnular(null)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="destructive" size="sm" disabled={anulando} className="h-7 text-xs">
                  {anulando ? 'Anulando...' : 'Confirmar Anulación'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
