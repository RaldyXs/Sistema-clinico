import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Banknote,
  CreditCard,
  Building2,
  ShieldCheck,
  PlusCircle,
  Lock,
  Unlock,
  Printer,
  Ban,
  Search,
  AlertCircle,
  CheckCircle2,
  X,
  History,
  Receipt,
  FileText,
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

interface PagoItem {
  id: string;
  numeroRecibo: string;
  concepto: string;
  montoTotal: number;
  metodoPago: string;
  montoRecibido: number | null;
  cambioDevuelto: number | null;
  montoCopago: number | null;
  coberturaSeguro: number | null;
  nombreAseguradora: string | null;
  numeroPoliza: string | null;
  numeroAutorizacion: string | null;
  referenciaTransaccion: string | null;
  estado: 'COBRADO' | 'ANULADO';
  motivoAnulacion: string | null;
  creadoEn: string;
  paciente?: {
    id: string;
    nombre: string;
    apellido: string | null;
    documentoIdentidad: string | null;
    telefono: string | null;
  };
  registradoPor?: {
    nombre: string;
    apellido: string | null;
  };
  cita?: {
    id: string;
    fechaHoraInicio: string;
    profesional?: {
      nombre: string;
      apellido: string | null;
    };
  };
}

interface PacienteSimple {
  id: string;
  nombre: string;
  apellido: string | null;
  documentoIdentidad: string | null;
  dni?: string;
  telefono: string | null;
}

export function CajaView() {
  const [dataActiva, setDataActiva] = useState<SesionActivaData | null>(null);
  const [pagos, setPagos] = useState<PagoItem[]>([]);
  const [pacientes, setPacientes] = useState<PacienteSimple[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pestanaActual, setPestanaActual] = useState<'turno' | 'historico'>('turno');
  const [sesionesHistoricas, setSesionesHistoricas] = useState<any[]>([]);

  // Filtros
  const [filtroMetodo, setFiltroMetodo] = useState<string>('');
  const [filtroBusqueda, setFiltroBusqueda] = useState<string>('');

  // Modales
  const [showModalAbrir, setShowModalAbrir] = useState(false);
  const [showModalCerrar, setShowModalCerrar] = useState(false);
  const [showModalCobro, setShowModalCobro] = useState(false);
  const [showModalRecibo, setShowModalRecibo] = useState(false);
  const [showModalAnular, setShowModalAnular] = useState(false);

  // Formularios
  const [formAbrir, setFormAbrir] = useState({ montoInicial: 1000, observaciones: '' });
  const [formCerrar, setFormCerrar] = useState({ montoReal: 0, observaciones: '' });
  const [formCobro, setFormCobro] = useState({
    pacienteId: '',
    concepto: 'Consulta Médica General',
    montoTotal: 2000,
    metodoPago: 'EFECTIVO',
    montoRecibido: 2000,
    montoCopago: 500,
    coberturaSeguro: 1500,
    nombreAseguradora: 'ARS Primera',
    numeroPoliza: '',
    numeroAutorizacion: '',
    referenciaTransaccion: '',
    notas: '',
  });

  const [pagoAAnular, setPagoAAnular] = useState<PagoItem | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [reciboActual, setReciboActual] = useState<PagoItem | null>(null);

  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resActiva, resPagos, resPacientes] = await Promise.all([
        api.get('/caja/sesion-activa').catch(() => null),
        api.get('/caja/pagos?limite=50').catch(() => ({ datos: [] })),
        api.get('/pacientes?limite=100').catch(() => ({ datos: [] })),
      ]);

      setDataActiva(resActiva);
      setPagos(resPagos?.datos || resPagos || []);
      const pacs = resPacientes?.datos || resPacientes?.data || (Array.isArray(resPacientes) ? resPacientes : []);
      setPacientes(pacs);
    } catch (err: any) {
      console.error('Error cargando caja:', err);
    } finally {
      setCargando(false);
    }
  };

  const cargarHistorico = async () => {
    try {
      const res = await api.get('/caja/sesiones?limite=20');
      setSesionesHistoricas(res?.datos || []);
    } catch (err) {
      console.error('Error cargando histórico:', err);
    }
  };

  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensajeError(null);
    try {
      await api.post('/caja/abrir', {
        montoInicial: Number(formAbrir.montoInicial) || 0,
        observacionesApertura: formAbrir.observaciones,
      });
      setShowModalAbrir(false);
      setMensajeExito('Turno de caja abierto satisfactoriamente.');
      await cargarDatos();
    } catch (err: any) {
      setMensajeError(err.message || 'Error al abrir caja');
    } finally {
      setGuardando(false);
    }
  };

  const handleCerrarCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensajeError(null);
    try {
      await api.post('/caja/cerrar', {
        montoRealEfectivo: Number(formCerrar.montoReal) || 0,
        observacionesCierre: formCerrar.observaciones,
      });
      setShowModalCerrar(false);
      setMensajeExito('Turno de caja cerrado y arqueo registrado.');
      await cargarDatos();
    } catch (err: any) {
      setMensajeError(err.message || 'Error al cerrar caja');
    } finally {
      setGuardando(false);
    }
  };

  const handleRegistrarCobro = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensajeError(null);
    try {
      const payload: any = {
        pacienteId: formCobro.pacienteId,
        concepto: formCobro.concepto,
        montoTotal: Number(formCobro.montoTotal),
        metodoPago: formCobro.metodoPago,
        notas: formCobro.notas,
      };

      if (formCobro.metodoPago === 'EFECTIVO') {
        payload.montoRecibido = Number(formCobro.montoRecibido);
      } else if (formCobro.metodoPago === 'SEGURO_MEDICO') {
        payload.montoCopago = Number(formCobro.montoCopago);
        payload.coberturaSeguro = Number(formCobro.coberturaSeguro);
        payload.nombreAseguradora = formCobro.nombreAseguradora;
        payload.numeroPoliza = formCobro.numeroPoliza;
        payload.numeroAutorizacion = formCobro.numeroAutorizacion;
      } else {
        payload.referenciaTransaccion = formCobro.referenciaTransaccion;
      }

      const nuevoPago = await api.post('/caja/pagos', payload);
      setShowModalCobro(false);
      setMensajeExito(`Cobro registrado con éxito. Folio: ${nuevoPago.numeroRecibo}`);
      setReciboActual(nuevoPago);
      setShowModalRecibo(true);
      await cargarDatos();
    } catch (err: any) {
      setMensajeError(err.message || 'Error al registrar cobro');
    } finally {
      setGuardando(false);
    }
  };

  const handleAnularPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pagoAAnular) return;
    setGuardando(true);
    setMensajeError(null);
    try {
      await api.patch(`/caja/pagos/${pagoAAnular.id}/anular`, {
        motivoAnulacion,
      });
      setShowModalAnular(false);
      setPagoAAnular(null);
      setMotivoAnulacion('');
      setMensajeExito('El cobro ha sido anulado y registrado en auditoría.');
      await cargarDatos();
    } catch (err: any) {
      setMensajeError(err.message || 'Error al anular cobro');
    } finally {
      setGuardando(false);
    }
  };

  const sesionAbierta = dataActiva?.sesion && dataActiva.sesion.estado === 'ABIERTA';
  const totales = dataActiva?.totales;

  const pagosFiltrados = pagos.filter((p) => {
    if (filtroMetodo && p.metodoPago !== filtroMetodo) return false;
    if (filtroBusqueda) {
      const q = filtroBusqueda.toLowerCase();
      const pacienteNom = `${p.paciente?.nombre || ''} ${p.paciente?.apellido || ''}`.toLowerCase();
      const recibo = p.numeroRecibo.toLowerCase();
      const conc = p.concepto.toLowerCase();
      if (!pacienteNom.includes(q) && !recibo.includes(q) && !conc.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {mensajeExito && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMensajeExito(null)} className="h-6 w-6">
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {mensajeError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-lg text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{mensajeError}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMensajeError(null)} className="h-6 w-6">
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Cabecera y Estado de Caja */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Banknote className="size-7 text-primary" />
            Caja Diaria & Cobros de Recepción
          </h1>
          <p className="text-sm text-muted-foreground">
            Control de turnos de recepción, arqueo en tiempo real y emisión de comprobantes
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {sesionAbierta ? (
            <>
              <Button
                variant="outline"
                className="border-rose-500/40 text-rose-600 hover:bg-rose-500/10"
                onClick={() => {
                  setFormCerrar({
                    montoReal: totales?.saldoEfectivoEsperado || 0,
                    observaciones: '',
                  });
                  setShowModalCerrar(true);
                }}
              >
                <Lock className="size-4 mr-1.5" />
                Cerrar Turno / Arqueo
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                onClick={() => {
                  setFormCobro({
                    pacienteId: pacientes[0]?.id || '',
                    concepto: 'Consulta Médica General',
                    montoTotal: 2000,
                    metodoPago: 'EFECTIVO',
                    montoRecibido: 2000,
                    montoCopago: 500,
                    coberturaSeguro: 1500,
                    nombreAseguradora: 'ARS Primera',
                    numeroPoliza: '',
                    numeroAutorizacion: '',
                    referenciaTransaccion: '',
                    notas: '',
                  });
                  setShowModalCobro(true);
                }}
              >
                <PlusCircle className="size-4 mr-1.5" />
                Registrar Cobro
              </Button>
            </>
          ) : (
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              onClick={() => setShowModalAbrir(true)}
            >
              <Unlock className="size-4 mr-1.5" />
              Abrir Turno de Caja
            </Button>
          )}
        </div>
      </div>

      {/* Banner de Turno Activo */}
      {sesionAbierta ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-600">
              <Unlock className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-sm">Turno de Caja Activo</span>
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 text-[11px]">
                  ABIERTO
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cajero: <strong className="text-foreground">{dataActiva?.sesion?.usuario?.nombre} {dataActiva?.sesion?.usuario?.apellido || ''}</strong> • Apertura: {dataActiva?.sesion?.fechaApertura ? new Date(dataActiva.sesion.fechaApertura).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'Hoy'} • Fondo inicial: <strong className="text-foreground">${Number(dataActiva?.sesion?.montoInicial || 0).toLocaleString()}</strong>
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Efectivo Físico Esperado en Cajón</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ${Number(totales?.saldoEfectivoEsperado || 0).toLocaleString()}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-muted/40 border border-border rounded-xl p-6 text-center space-y-3">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Lock className="size-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">La caja se encuentra cerrada</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
              Para comenzar a cobrar consultas, emitir recibos y registrar copagos de pacientes, inicia un turno ingresando el monto inicial de fondo.
            </p>
          </div>
          <Button onClick={() => setShowModalAbrir(true)} className="bg-primary hover:bg-primary/90">
            <Unlock className="size-4 mr-1.5" />
            Iniciar Apertura de Caja
          </Button>
        </div>
      )}

      {/* Tarjetas de Arqueo en Tiempo Real */}
      {sesionAbierta && totales && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Total Recaudado</span>
                <Receipt className="size-4 text-primary" />
              </div>
              <div className="text-xl font-bold text-foreground mt-2">
                ${totales.totalRecaudado.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {totales.cantidadPagos} cobro{totales.cantidadPagos !== 1 ? 's' : ''} registrado{totales.cantidadPagos !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Efectivo en Caja</span>
                <Banknote className="size-4 text-emerald-500" />
              </div>
              <div className="text-xl font-bold text-foreground mt-2">
                ${totales.totalEfectivo.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Incluye cobros directos y copagos
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Tarjetas (POS)</span>
                <CreditCard className="size-4 text-sky-500" />
              </div>
              <div className="text-xl font-bold text-foreground mt-2">
                ${totales.totalTarjetas.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Débito: ${totales.totalTarjetaDebito.toLocaleString()} | Crédito: ${totales.totalTarjetaCredito.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Transferencias</span>
                <Building2 className="size-4 text-indigo-500" />
              </div>
              <div className="text-xl font-bold text-foreground mt-2">
                ${totales.totalTransferencia.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Cuentas bancarias verificadas
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Seguros / ARS</span>
                <ShieldCheck className="size-4 text-purple-500" />
              </div>
              <div className="text-xl font-bold text-foreground mt-2">
                ${totales.totalSeguro.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Reclamable a aseguradoras
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pestañas de Vista */}
      <div className="flex border-b border-border gap-4">
        <button
          onClick={() => setPestanaActual('turno')}
          className={`pb-2.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            pestanaActual === 'turno'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="size-4" />
          Movimientos del Turno ({pagos.length})
        </button>
        <button
          onClick={() => {
            setPestanaActual('historico');
            cargarHistorico();
          }}
          className={`pb-2.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            pestanaActual === 'historico'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="size-4" />
          Histórico de Cierres y Turnos
        </button>
      </div>

      {pestanaActual === 'turno' ? (
        <Card className="border-border">
          <CardContent className="p-4 space-y-4">
            {/* Filtros rápidos */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por paciente, folio..."
                  value={filtroBusqueda}
                  onChange={(e) => setFiltroBusqueda(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={filtroMetodo}
                  onChange={(e) => setFiltroMetodo(e.target.value)}
                  className="h-9 px-3 text-xs rounded-md border border-input bg-background"
                >
                  <option value="">Todos los Métodos</option>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA_DEBITO">Tarjeta Débito</option>
                  <option value="TARJETA_CREDITO">Tarjeta Crédito</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="SEGURO_MEDICO">Seguro Médico</option>
                </select>
              </div>
            </div>

            {/* Tabla de Pagos */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Folio / Hora</th>
                    <th className="px-4 py-3">Paciente</th>
                    <th className="px-4 py-3">Concepto</th>
                    <th className="px-4 py-3">Método de Pago</th>
                    <th className="px-4 py-3 text-right">Monto Total</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-center">Comprobante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cargando ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        Cargando movimientos de caja...
                      </td>
                    </tr>
                  ) : pagosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        No se encontraron cobros registrados en este turno.
                      </td>
                    </tr>
                  ) : (
                    pagosFiltrados.map((pago) => (
                      <tr key={pago.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-foreground">{pago.numeroRecibo}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {new Date(pago.creadoEn).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">
                            {pago.paciente?.nombre} {pago.paciente?.apellido || ''}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Doc: {pago.paciente?.documentoIdentidad || 'S/D'}
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate">
                          <div>{pago.concepto}</div>
                          {pago.nombreAseguradora && (
                            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                              {pago.nombreAseguradora} (Pol: {pago.numeroPoliza || 'S/N'})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[11px] font-normal">
                            {pago.metodoPago.replace('_', ' ')}
                          </Badge>
                          {pago.cambioDevuelto && pago.cambioDevuelto > 0 && (
                            <div className="text-[10px] text-emerald-600 mt-0.5">
                              Cambio: ${Number(pago.cambioDevuelto).toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-bold text-sm text-foreground">
                            ${Number(pago.montoTotal).toLocaleString()}
                          </div>
                          {pago.montoCopago && (
                            <div className="text-[10px] text-muted-foreground">
                              Copago: ${Number(pago.montoCopago).toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={pago.estado === 'COBRADO' ? 'default' : 'destructive'} className="text-[10px]">
                            {pago.estado}
                          </Badge>
                          {pago.estado === 'ANULADO' && (
                            <div className="text-[10px] text-destructive truncate max-w-[120px] mx-auto mt-0.5" title={pago.motivoAnulacion || ''}>
                              {pago.motivoAnulacion}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Imprimir Recibo"
                              className="size-7 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => {
                                setReciboActual(pago);
                                setShowModalRecibo(true);
                              }}
                            >
                              <Printer className="size-3.5" />
                            </Button>
                            {pago.estado === 'COBRADO' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Anular Cobro"
                                className="size-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                                onClick={() => {
                                  setPagoAAnular(pago);
                                  setMotivoAnulacion('');
                                  setShowModalAnular(true);
                                }}
                              >
                                <Ban className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Histórico de Sesiones de Caja */
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Fecha Apertura</th>
                    <th className="px-4 py-3">Fecha Cierre</th>
                    <th className="px-4 py-3">Cajero / Operador</th>
                    <th className="px-4 py-3 text-right">Fondo Inicial</th>
                    <th className="px-4 py-3 text-right">Efectivo Esperado</th>
                    <th className="px-4 py-3 text-right">Efectivo Real</th>
                    <th className="px-4 py-3 text-center">Diferencia</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sesionesHistoricas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                        No hay cierres históricos de turnos registrados.
                      </td>
                    </tr>
                  ) : (
                    sesionesHistoricas.map((ses) => (
                      <tr key={ses.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          {new Date(ses.fechaApertura).toLocaleDateString('es-ES')} {new Date(ses.fechaApertura).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          {ses.fechaCierre
                            ? `${new Date(ses.fechaCierre).toLocaleDateString('es-ES')} ${new Date(ses.fechaCierre).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                            : 'En curso'}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {ses.usuario?.nombre} {ses.usuario?.apellido || ''}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          ${Number(ses.montoInicial).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          ${ses.montoEsperadoEfectivo ? Number(ses.montoEsperadoEfectivo).toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold">
                          ${ses.montoRealEfectivo ? Number(ses.montoRealEfectivo).toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {ses.diferencia !== null && ses.diferencia !== undefined ? (
                            <Badge
                              variant="outline"
                              className={
                                Number(ses.diferencia) === 0
                                  ? 'text-emerald-600 border-emerald-500/40 bg-emerald-500/10'
                                  : Number(ses.diferencia) > 0
                                  ? 'text-sky-600 border-sky-500/40 bg-sky-500/10'
                                  : 'text-rose-600 border-rose-500/40 bg-rose-500/10'
                              }
                            >
                              {Number(ses.diferencia) > 0 ? `+$${ses.diferencia}` : `$${ses.diferencia}`}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={ses.estado === 'ABIERTA' ? 'default' : 'secondary'}>
                            {ses.estado}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODAL 1: ABRIR CAJA */}
      {showModalAbrir && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-2xl border-border">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Unlock className="size-5 text-primary" />
                <h3 className="font-semibold text-foreground text-base">Apertura de Turno de Caja</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowModalAbrir(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <form onSubmit={handleAbrirCaja} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Fondo Inicial en Efectivo *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    required
                    className="pl-7 text-sm font-semibold font-mono"
                    placeholder="Ej. 1000"
                    value={formAbrir.montoInicial}
                    onChange={(e) => setFormAbrir({ ...formAbrir, montoInicial: Number(e.target.value) })}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Cantidad en monedas y billetes entregada para cambio inicial.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Observaciones (Opcional)</label>
                <Input
                  placeholder="Ej. Turno matutino, billetes chicos"
                  value={formAbrir.observaciones}
                  onChange={(e) => setFormAbrir({ ...formAbrir, observaciones: e.target.value })}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowModalAbrir(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardando}>
                  {guardando ? 'Abriendo...' : 'Confirmar Apertura'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 2: CERRAR CAJA / ARQUEO */}
      {showModalCerrar && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-2xl border-border">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="size-5 text-rose-500" />
                <h3 className="font-semibold text-foreground text-base">Cierre de Turno y Arqueo</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowModalCerrar(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <form onSubmit={handleCerrarCaja} className="p-5 space-y-4">
              <div className="p-3 bg-muted/40 rounded-lg space-y-1 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Fondo Inicial:</span>
                  <span className="font-mono font-semibold">${Number(totales?.montoInicial || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Ingresos Efectivo Turno:</span>
                  <span className="font-mono font-semibold">+${Number(totales?.totalEfectivo || 0).toLocaleString()}</span>
                </div>
                <div className="border-t border-border pt-1 flex justify-between font-bold text-foreground">
                  <span>Total Efectivo Esperado:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    ${Number(totales?.saldoEfectivoEsperado || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Efectivo Físico Contado en Cajón *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    required
                    className="pl-7 text-sm font-semibold font-mono"
                    value={formCerrar.montoReal}
                    onChange={(e) => setFormCerrar({ ...formCerrar, montoReal: Number(e.target.value) })}
                  />
                </div>
                {/* Indicador de Diferencia */}
                {totales && (
                  <div className="text-xs mt-1">
                    {Number(formCerrar.montoReal) - Number(totales.saldoEfectivoEsperado) === 0 ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="size-3.5" /> Arqueo exacto (sin discrepancias)
                      </span>
                    ) : Number(formCerrar.montoReal) - Number(totales.saldoEfectivoEsperado) > 0 ? (
                      <span className="text-sky-600 font-semibold">
                        Sobrante de caja: +${(Number(formCerrar.montoReal) - Number(totales.saldoEfectivoEsperado)).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-rose-600 font-semibold">
                        Faltante de caja: ${(Number(formCerrar.montoReal) - Number(totales.saldoEfectivoEsperado)).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Observaciones de Cierre</label>
                <Input
                  placeholder="Justificación si hubo diferencia o notas de entrega"
                  value={formCerrar.observaciones}
                  onChange={(e) => setFormCerrar({ ...formCerrar, observaciones: e.target.value })}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowModalCerrar(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="destructive" disabled={guardando}>
                  {guardando ? 'Cerrando...' : 'Finalizar y Cerrar Turno'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 3: REGISTRAR COBRO */}
      {showModalCobro && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-lg w-full shadow-2xl border-border max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="size-5 text-primary" />
                <h3 className="font-semibold text-foreground text-base">Registrar Cobro de Paciente</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowModalCobro(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <form onSubmit={handleRegistrarCobro} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Paciente *</label>
                <select
                  required
                  value={formCobro.pacienteId}
                  onChange={(e) => setFormCobro({ ...formCobro, pacienteId: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus:border-primary"
                >
                  <option value="">Seleccione el paciente...</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.apellido || ''} (Doc: {p.documentoIdentidad || p.dni || 'S/D'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Concepto *</label>
                  <Input
                    required
                    placeholder="Ej. Consulta Médica, Ecografía"
                    value={formCobro.concepto}
                    onChange={(e) => setFormCobro({ ...formCobro, concepto: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Monto Total *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      required
                      className="pl-7 font-mono font-bold"
                      value={formCobro.montoTotal}
                      onChange={(e) => {
                        const m = Number(e.target.value);
                        setFormCobro({
                          ...formCobro,
                          montoTotal: m,
                          montoRecibido: m,
                        });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Método de Pago *</label>
                <select
                  value={formCobro.metodoPago}
                  onChange={(e) => setFormCobro({ ...formCobro, metodoPago: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus:border-primary font-medium"
                >
                  <option value="EFECTIVO">💵 Efectivo</option>
                  <option value="TARJETA_DEBITO">💳 Tarjeta de Débito</option>
                  <option value="TARJETA_CREDITO">💳 Tarjeta de Crédito</option>
                  <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                  <option value="SEGURO_MEDICO">🛡️ Seguro Médico / ARS</option>
                </select>
              </div>

              {/* Campos condicionales por método de pago */}
              {formCobro.metodoPago === 'EFECTIVO' && (
                <div className="p-3 bg-muted/40 rounded-lg space-y-2 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Efectivo Recibido del Paciente</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min={formCobro.montoTotal}
                        className="pl-7 font-mono text-sm"
                        value={formCobro.montoRecibido}
                        onChange={(e) => setFormCobro({ ...formCobro, montoRecibido: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  {Number(formCobro.montoRecibido) >= Number(formCobro.montoTotal) && (
                    <div className="flex justify-between items-center pt-1 font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      <span>Cambio / Vuelto a entregar:</span>
                      <span className="font-mono">
                        ${(Number(formCobro.montoRecibido) - Number(formCobro.montoTotal)).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {formCobro.metodoPago === 'SEGURO_MEDICO' && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-foreground">Aseguradora (ARS)</label>
                      <Input
                        placeholder="Ej. ARS Primera, Senasa"
                        value={formCobro.nombreAseguradora}
                        onChange={(e) => setFormCobro({ ...formCobro, nombreAseguradora: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-foreground">N° Autorización</label>
                      <Input
                        placeholder="Ej. AUT-88992"
                        value={formCobro.numeroAutorizacion}
                        onChange={(e) => setFormCobro({ ...formCobro, numeroAutorizacion: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-foreground">Copago Paciente ($)</label>
                      <Input
                        type="number"
                        value={formCobro.montoCopago}
                        onChange={(e) => {
                          const cp = Number(e.target.value);
                          setFormCobro({
                            ...formCobro,
                            montoCopago: cp,
                            coberturaSeguro: formCobro.montoTotal - cp,
                          });
                        }}
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-foreground">Cobertura Seguro ($)</label>
                      <Input
                        type="number"
                        value={formCobro.coberturaSeguro}
                        onChange={(e) => setFormCobro({ ...formCobro, coberturaSeguro: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {(formCobro.metodoPago === 'TARJETA_DEBITO' ||
                formCobro.metodoPago === 'TARJETA_CREDITO' ||
                formCobro.metodoPago === 'TRANSFERENCIA') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    N° de Referencia / Voucher / Comprobante
                  </label>
                  <Input
                    placeholder="Ej. REF-449922, Transf. Banco Popular"
                    value={formCobro.referenciaTransaccion}
                    onChange={(e) => setFormCobro({ ...formCobro, referenciaTransaccion: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Notas Adicionales</label>
                <Input
                  placeholder="Detalles contables o administrativos"
                  value={formCobro.notas}
                  onChange={(e) => setFormCobro({ ...formCobro, notas: e.target.value })}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowModalCobro(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardando} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {guardando ? 'Guardando...' : 'Confirmar Cobro e Imprimir'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 4: RECIBO OFICIAL IMPRIMIBLE */}
      {showModalRecibo && reciboActual && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-2xl border-border bg-card">
            <div className="p-4 border-b border-border flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Printer className="size-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Recibo Oficial de Pago</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowModalRecibo(false)}>
                <X className="size-4" />
              </Button>
            </div>

            <div id="recibo-imprimible" className="p-6 space-y-4 text-xs">
              {/* Membrete del Recibo */}
              <div className="text-center pb-3 border-b border-border space-y-1">
                <h2 className="text-base font-bold text-primary tracking-wide uppercase">
                  COMPROBANTE OFICIAL DE PAGO
                </h2>
                <div className="text-sm font-mono font-bold text-foreground">
                  {reciboActual.numeroRecibo}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Fecha: {new Date(reciboActual.creadoEn).toLocaleDateString('es-ES')} • {new Date(reciboActual.creadoEn).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Datos del Paciente */}
              <div className="space-y-1 bg-muted/30 p-2.5 rounded-md">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paciente:</span>
                  <strong className="text-foreground">{reciboActual.paciente?.nombre} {reciboActual.paciente?.apellido || ''}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Documento:</span>
                  <span>{reciboActual.paciente?.documentoIdentidad || 'S/D'}</span>
                </div>
              </div>

              {/* Detalle del Cobro */}
              <div className="space-y-2">
                <div className="flex justify-between font-semibold border-b border-border pb-1">
                  <span>Concepto</span>
                  <span>Importe</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{reciboActual.concepto}</span>
                  <span className="font-mono font-semibold text-foreground">${Number(reciboActual.montoTotal).toLocaleString()}</span>
                </div>
                {reciboActual.montoCopago && (
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>Copago cubierto por paciente:</span>
                    <span className="font-mono">${Number(reciboActual.montoCopago).toLocaleString()}</span>
                  </div>
                )}
                {reciboActual.coberturaSeguro && (
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>Cobertura Aseguradora ({reciboActual.nombreAseguradora || 'Seguro'}):</span>
                    <span className="font-mono">${Number(reciboActual.coberturaSeguro).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Total y Método */}
              <div className="border-t-2 border-primary/30 pt-2 space-y-1">
                <div className="flex justify-between font-bold text-sm text-foreground">
                  <span>TOTAL PAGADO:</span>
                  <span className="font-mono text-primary text-base">${Number(reciboActual.montoTotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-[11px]">
                  <span>Método de Pago:</span>
                  <span className="font-medium text-foreground">{reciboActual.metodoPago.replace('_', ' ')}</span>
                </div>
                {reciboActual.cambioDevuelto && Number(reciboActual.cambioDevuelto) > 0 && (
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>Cambio Entregado:</span>
                    <span className="font-mono text-emerald-600">${Number(reciboActual.cambioDevuelto).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Pie de Recibo */}
              <div className="pt-4 border-t border-border text-center space-y-1 text-[10px] text-muted-foreground">
                <p>Atendido por: {reciboActual.registradoPor?.nombre || 'Recepción'}</p>
                <p>¡Gracias por confiar en nuestro servicio médico!</p>
              </div>
            </div>

            <div className="p-4 border-t border-border flex items-center justify-end gap-2 no-print">
              <Button variant="outline" size="sm" onClick={() => setShowModalRecibo(false)}>
                Cerrar
              </Button>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => window.print()}
              >
                <Printer className="size-4 mr-1.5" />
                Imprimir Recibo
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL 5: ANULAR COBRO */}
      {showModalAnular && pagoAAnular && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-2xl border-border">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ban className="size-5 text-rose-500" />
                <h3 className="font-semibold text-foreground text-base">Anulación Justificada de Cobro</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowModalAnular(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <form onSubmit={handleAnularPago} className="p-5 space-y-4">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs space-y-1">
                <div>Folio a anular: <strong>{pagoAAnular.numeroRecibo}</strong></div>
                <div>Monto: <strong>${Number(pagoAAnular.montoTotal).toLocaleString()}</strong> ({pagoAAnular.concepto})</div>
                <p className="text-rose-600 dark:text-rose-400 text-[11px] pt-1">
                  Esta acción no se puede deshacer y quedará asentada en la auditoría inmutable de la clínica.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Motivo Médico o Administrativo de Anulación *
                </label>
                <textarea
                  required
                  rows={3}
                  className="w-full rounded-md border border-input bg-background p-2 text-xs shadow-xs outline-none focus:border-rose-500"
                  placeholder="Ej. Paciente no pudo ser atendido, error de digitación en el importe..."
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowModalAnular(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="destructive" disabled={guardando || motivoAnulacion.trim().length < 5}>
                  {guardando ? 'Anulando...' : 'Confirmar Anulación'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
