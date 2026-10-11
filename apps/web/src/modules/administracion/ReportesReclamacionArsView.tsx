import * as React from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ARS_DOMINICANAS } from '@/data/ars-dominicanas';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Copy,
  Check,
  DollarSign,
  RefreshCw,
  Eye,
  FileCheck2,
  Receipt,
  Layers,
} from 'lucide-react';

interface ReclamacionItem {
  id: string;
  numeroRecibo: string;
  concepto: string;
  montoTotal: number;
  montoCopago: number;
  coberturaSeguro: number;
  nombreAseguradora: string | null;
  numeroPoliza: string | null;
  numeroAutorizacion: string | null;
  metodoPago: string;
  estado: string;
  creadoEn: string;
  paciente?: {
    id: string;
    nombre: string;
    apellido?: string;
    documentoIdentidad?: string;
    telefono?: string;
    numeroSeguro?: string;
    seguroMedico?: string;
  };
  cita?: {
    id: string;
    fechaHoraInicio?: string;
    profesional?: {
      id: string;
      nombre: string;
      apellido?: string;
      especialidad?: string;
      matriculaProfesional?: string;
    };
  };
  registradoPor?: {
    nombre: string;
    apellido?: string;
  };
}

export function ReportesReclamacionArsView() {
  const { user } = useAuth();

  // Filtros de fecha
  const [fechaDesde, setFechaDesde] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(1); // Primer día del mes corriente
    return d.toISOString().slice(0, 10);
  });
  const [fechaHasta, setFechaHasta] = React.useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [presetFecha, setPresetFecha] = React.useState<string>('mes');

  // Filtros de selección
  const [filtroArs, setFiltroArs] = React.useState<string>('TODAS');
  const [filtroMedico, setFiltroMedico] = React.useState<string>('');
  const [filtroEstado, setFiltroEstado] = React.useState<string>('');
  const [busqueda, setBusqueda] = React.useState<string>('');

  // Datos
  const [reclamaciones, setReclamaciones] = React.useState<ReclamacionItem[]>([]);
  const [resumen, setResumen] = React.useState<{
    totalReclamaciones: number;
    totalMontoReclamado: number;
    totalCopagoRecaudado: number;
    totalMontoBruto: number;
  }>({
    totalReclamaciones: 0,
    totalMontoReclamado: 0,
    totalCopagoRecaudado: 0,
    totalMontoBruto: 0,
  });
  const [desgloseArs, setDesgloseArs] = React.useState<
    Array<{ ars: string; cantidad: number; montoReclamado: number; copago: number }>
  >([]);
  const [medicos, setMedicos] = React.useState<any[]>([]);

  // Estados de carga y modales
  const [cargando, setCargando] = React.useState<boolean>(true);
  const [exportando, setExportando] = React.useState<boolean>(false);
  const [copiadoId, setCopiadoId] = React.useState<string | null>(null);
  const [itemSeleccionado, setItemSeleccionado] = React.useState<ReclamacionItem | null>(null);
  const [mostrarModalImpresion, setMostrarModalImpresion] = React.useState<boolean>(false);

  // Configuración del consultorio
  const [consultorioConfig, setConsultorioConfig] = React.useState<any>(null);

  // Cargar lista de médicos y configuración de la clínica
  React.useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [medRes, cfgRes] = await Promise.allSettled([
          api.get('/usuarios/medicos'),
          api.get('/consultorios/configuracion'),
        ]);
        if (medRes.status === 'fulfilled') {
          setMedicos(Array.isArray(medRes.value) ? medRes.value : []);
        }
        if (cfgRes.status === 'fulfilled') {
          setConsultorioConfig(cfgRes.value);
        }
      } catch (e) {
        console.error('Error cargando catálogos:', e);
      }
    };
    cargarCatalogos();
  }, []);

  // Cargar datos de reclamaciones desde el backend
  const cargarReclamaciones = React.useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (fechaDesde) params.append('desde', fechaDesde);
      if (fechaHasta) params.append('hasta', fechaHasta);
      if (filtroArs && filtroArs !== 'TODAS') params.append('ars', filtroArs);
      if (filtroMedico) params.append('profesionalId', filtroMedico);
      if (filtroEstado) params.append('estado', filtroEstado);
      params.append('limite', '150');

      const res = await api.get(`/caja/reclamaciones-ars?${params.toString()}`);

      if (res && res.datos) {
        setReclamaciones(res.datos || []);
        setResumen(
          res.resumen || {
            totalReclamaciones: 0,
            totalMontoReclamado: 0,
            totalCopagoRecaudado: 0,
            totalMontoBruto: 0,
          }
        );
        setDesgloseArs(res.desgloseArs || []);
      } else if (Array.isArray(res)) {
        // Fallback si retorna arreglo directo
        setReclamaciones(res);
      }
    } catch (err: any) {
      console.error('Error al cargar reclamaciones:', err);
    } finally {
      setCargando(false);
    }
  }, [fechaDesde, fechaHasta, filtroArs, filtroMedico, filtroEstado]);

  React.useEffect(() => {
    cargarReclamaciones();
  }, [cargarReclamaciones]);

  // Manejo de presets de fechas
  const aplicarPresetFecha = (preset: 'mes' | 'quincena' | 'mes_anterior' | '30dias' | 'todo') => {
    setPresetFecha(preset);
    const ahora = new Date();
    const hoyStr = ahora.toISOString().slice(0, 10);

    if (preset === 'mes') {
      const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().slice(0, 10);
      setFechaDesde(inicio);
      setFechaHasta(hoyStr);
    } else if (preset === 'quincena') {
      const dia = ahora.getDate();
      const inicio =
        dia <= 15
          ? new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().slice(0, 10)
          : new Date(ahora.getFullYear(), ahora.getMonth(), 16).toISOString().slice(0, 10);
      setFechaDesde(inicio);
      setFechaHasta(hoyStr);
    } else if (preset === 'mes_anterior') {
      const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1).toISOString().slice(0, 10);
      const fin = new Date(ahora.getFullYear(), ahora.getMonth(), 0).toISOString().slice(0, 10);
      setFechaDesde(inicio);
      setFechaHasta(fin);
    } else if (preset === '30dias') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setFechaDesde(d.toISOString().slice(0, 10));
      setFechaHasta(hoyStr);
    } else if (preset === 'todo') {
      setFechaDesde('');
      setFechaHasta('');
    }
  };

  // Filtrado local por término de búsqueda (paciente, cédula, código autorización, recibo)
  const reclamacionesFiltradas = React.useMemo(() => {
    if (!busqueda.trim()) return reclamaciones;
    const term = busqueda.toLowerCase().trim();
    return reclamaciones.filter((item) => {
      const pacNombre = `${item.paciente?.nombre || ''} ${item.paciente?.apellido || ''}`.toLowerCase();
      const pacCed = (item.paciente?.documentoIdentidad || '').toLowerCase();
      const autorizacion = (item.numeroAutorizacion || '').toLowerCase();
      const poliza = (item.numeroPoliza || '').toLowerCase();
      const recibo = (item.numeroRecibo || '').toLowerCase();
      const concepto = (item.concepto || '').toLowerCase();
      return (
        pacNombre.includes(term) ||
        pacCed.includes(term) ||
        autorizacion.includes(term) ||
        poliza.includes(term) ||
        recibo.includes(term) ||
        concepto.includes(term)
      );
    });
  }, [reclamaciones, busqueda]);

  // Copiar código al portapapeles
  const copiarTexto = (texto: string, id: string) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 1800);
  };

  // Descargar archivo CSV
  const descargarCsv = async () => {
    setExportando(true);
    try {
      const params = new URLSearchParams();
      if (fechaDesde) params.append('desde', fechaDesde);
      if (fechaHasta) params.append('hasta', fechaHasta);
      if (filtroArs && filtroArs !== 'TODAS') params.append('ars', filtroArs);
      if (filtroMedico) params.append('profesionalId', filtroMedico);
      if (filtroEstado) params.append('estado', filtroEstado);

      const qs = params.toString() ? `?${params.toString()}` : '';
      await api.downloadBlob(
        `/caja/reclamaciones-ars/exportar-csv${qs}`,
        `Reclamaciones_ARS_${filtroArs !== 'TODAS' ? filtroArs.replace(/\s+/g, '_') : 'General'}_${fechaDesde || 'inicio'}_${fechaHasta || 'fin'}.csv`
      );
    } catch (err: any) {
      alert(err.message || 'Error al exportar CSV de reclamaciones');
    } finally {
      setExportando(false);
    }
  };

  // Nombre de la clínica y datos de prestador
  const nombreClinica =
    consultorioConfig?.nombre || user?.consultorio?.nombre || 'Gestia Centro Médico Especializado';
  const rncClinica = consultorioConfig?.rnc || '1-31-98472-1';
  const telefonoClinica = consultorioConfig?.telefono || user?.consultorio?.telefono || '809-555-0199';
  const direccionClinica =
    consultorioConfig?.direccion || user?.consultorio?.direccion || 'Av. Abraham Lincoln #1052, Santo Domingo, R.D.';
  const codigoPrestador = consultorioConfig?.codigoPrestador || 'PSS-RD-88419';

  // Helper para badge de ARS con colores institucionales
  const getBadgeArs = (nombre?: string | null) => {
    if (!nombre || nombre === 'Privado / Sin Seguro (Particular)') {
      return <Badge variant="outline">Particular</Badge>;
    }
    const lower = nombre.toLowerCase();
    if (lower.includes('senasa')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
          {nombre}
        </span>
      );
    }
    if (lower.includes('humano')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/25">
          {nombre}
        </span>
      );
    }
    if (lower.includes('mapfre')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/25">
          {nombre}
        </span>
      );
    }
    if (lower.includes('universal')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25">
          {nombre}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
        {nombre}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-emerald-600 dark:text-emerald-400" />
            Liquidación y Reclamaciones ARS
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestión de expedientes de seguros médicos dominicanos, códigos de autorización y reportes oficiales para auditoría médica.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={descargarCsv}
            disabled={exportando || reclamaciones.length === 0}
            className="h-8 text-xs font-medium"
          >
            <Download className="size-3.5 mr-1.5" />
            {exportando ? 'Exportando...' : 'Exportar CSV'}
          </Button>

          <Button
            size="sm"
            onClick={() => setMostrarModalImpresion(true)}
            disabled={reclamaciones.length === 0}
            className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Printer className="size-3.5 mr-1.5" />
            Imprimir Estado Oficial
          </Button>
        </div>
      </div>

      {/* BARRA DE PRESETS Y FILTROS TEMPORALES */}
      <Card className="border border-border/80 shadow-xs">
        <CardContent className="p-3 space-y-3 text-xs">
          {/* Fila 1: Botones rápidos de rango de fechas */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-semibold flex items-center gap-1 mr-1">
                <Calendar className="size-3.5" /> Período:
              </span>
              <Button
                variant={presetFecha === 'mes' ? 'default' : 'outline'}
                size="sm"
                onClick={() => aplicarPresetFecha('mes')}
                className="h-6 text-[11px] px-2.5"
              >
                Este Mes
              </Button>
              <Button
                variant={presetFecha === 'quincena' ? 'default' : 'outline'}
                size="sm"
                onClick={() => aplicarPresetFecha('quincena')}
                className="h-6 text-[11px] px-2.5"
              >
                Quincena Actual
              </Button>
              <Button
                variant={presetFecha === 'mes_anterior' ? 'default' : 'outline'}
                size="sm"
                onClick={() => aplicarPresetFecha('mes_anterior')}
                className="h-6 text-[11px] px-2.5"
              >
                Mes Anterior
              </Button>
              <Button
                variant={presetFecha === '30dias' ? 'default' : 'outline'}
                size="sm"
                onClick={() => aplicarPresetFecha('30dias')}
                className="h-6 text-[11px] px-2.5"
              >
                Últimos 30 días
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-[11px]">Personalizado:</span>
              <input
                type="date"
                className="h-7 rounded border border-input bg-background px-2 text-[11px]"
                value={fechaDesde}
                onChange={(e) => {
                  setFechaDesde(e.target.value);
                  setPresetFecha('custom');
                }}
              />
              <span className="text-muted-foreground">a</span>
              <input
                type="date"
                className="h-7 rounded border border-input bg-background px-2 text-[11px]"
                value={fechaHasta}
                onChange={(e) => {
                  setFechaHasta(e.target.value);
                  setPresetFecha('custom');
                }}
              />
            </div>
          </div>

          {/* Fila 2: Filtros de ARS, Médico, Estado y Buscador */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Filtro ARS */}
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                Aseguradora (ARS):
              </label>
              <select
                className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                value={filtroArs}
                onChange={(e) => setFiltroArs(e.target.value)}
              >
                <option value="TODAS">Todas las Aseguradoras (ARS)</option>
                {ARS_DOMINICANAS.filter((a) => a.id !== 'particular').map((ars) => (
                  <option key={ars.id} value={ars.nombre}>
                    {ars.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Médico */}
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                Médico Tratante:
              </label>
              <select
                className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                value={filtroMedico}
                onChange={(e) => setFiltroMedico(e.target.value)}
              >
                <option value="">Todos los Médicos</option>
                {medicos.map((m) => (
                  <option key={m.id} value={m.id}>
                    Dr(a). {m.nombre} {m.apellido || ''} {m.especialidad ? `(${m.especialidad})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Estado */}
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                Estado del Cobro:
              </label>
              <select
                className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="">Todos los Estados</option>
                <option value="COBRADO">Aprobadas / Cobradas</option>
                <option value="ANULADO">Anuladas / Rechazadas</option>
              </select>
            </div>

            {/* Buscador de texto */}
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                Buscar por Paciente o Autorización:
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Cédula, nombre o AUT-..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIS PRINCIPALES DE LIQUIDACIÓN ARS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Total Reclamado a ARS */}
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3 px-3.5">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Total Reclamado a ARS
            </CardTitle>
            <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent className="px-3.5 pb-3">
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              RD$ {resumen.totalMontoReclamado.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Monto a liquidar y cobrar a las aseguradoras
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Copago Recaudado de Pacientes */}
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3 px-3.5">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-blue-800 dark:text-blue-300">
              Copagos Recaudados
            </CardTitle>
            <DollarSign className="size-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent className="px-3.5 pb-3">
            <div className="text-xl sm:text-2xl font-bold font-mono text-blue-700 dark:text-blue-400">
              RD$ {resumen.totalCopagoRecaudado.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Cobrado en efectivo o tarjeta a pacientes
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Facturación Bruta Total */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3 px-3.5">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Facturación Bruta Total
            </CardTitle>
            <Layers className="size-4 text-primary" />
          </CardHeader>
          <CardContent className="px-3.5 pb-3">
            <div className="text-xl sm:text-2xl font-bold font-mono">
              RD$ {resumen.totalMontoBruto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Valor bruto de servicios ambulatorios
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Expedientes / Reclamaciones */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3 px-3.5">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Reclamaciones
            </CardTitle>
            <FileCheck2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="px-3.5 pb-3">
            <div className="text-xl sm:text-2xl font-bold font-mono">
              {resumen.totalReclamaciones}{' '}
              <span className="text-xs font-normal text-muted-foreground font-sans">expedientes</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="size-3 text-emerald-500" />
              {reclamacionesFiltradas.length} visibles en la tabla
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MINI CARDS DE DESGLOSE POR ARS (Clickables para filtrar) */}
      {desgloseArs.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Distribución de Reclamación por ARS (Haz clic para filtrar):</span>
            {filtroArs !== 'TODAS' && (
              <button
                onClick={() => setFiltroArs('TODAS')}
                className="text-xs text-primary hover:underline font-normal capitalize flex items-center gap-1"
              >
                Limpiar filtro de ARS
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {desgloseArs.map((d) => {
              const activa = filtroArs.toLowerCase() === d.ars.toLowerCase();
              return (
                <button
                  key={d.ars}
                  onClick={() => setFiltroArs(activa ? 'TODAS' : d.ars)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    activa
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-xs'
                      : 'border-border bg-card hover:border-emerald-500/40 hover:bg-muted/40'
                  }`}
                >
                  <div className="text-[11px] font-bold truncate text-foreground" title={d.ars}>
                    {d.ars}
                  </div>
                  <div className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                    RD$ {d.montoReclamado.toLocaleString('es-DO')}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 flex justify-between">
                    <span>{d.cantidad} exp.</span>
                    <span>Copago: RD$ {d.copago.toLocaleString('es-DO')}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TABLA PRINCIPAL DE RECLAMACIONES */}
      <Card className="border border-border">
        <CardHeader className="p-3.5 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
              Detalle Itemizado de Reclamaciones Autorizadas
            </CardTitle>
            <CardDescription className="text-[11px]">
              Expedientes con cobertura de aseguradora y comprobantes oficiales
            </CardDescription>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={cargarReclamaciones}
            className="h-7 text-xs"
            disabled={cargando}
          >
            <RefreshCw className={`size-3.5 mr-1 ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 uppercase tracking-wider text-[10px] text-muted-foreground border-b font-semibold">
                <tr>
                  <th className="px-3.5 py-2.5">Recibo / Fecha</th>
                  <th className="px-3.5 py-2.5">Paciente & Cédula</th>
                  <th className="px-3.5 py-2.5">Aseguradora (ARS) & Póliza</th>
                  <th className="px-3.5 py-2.5">No. Autorización ARS</th>
                  <th className="px-3.5 py-2.5">Médico Tratante</th>
                  <th className="px-3.5 py-2.5">Servicio / Concepto</th>
                  <th className="px-3.5 py-2.5 text-right">Copago (RD$)</th>
                  <th className="px-3.5 py-2.5 text-right font-bold text-emerald-700 dark:text-emerald-400">
                    Reclamado ARS
                  </th>
                  <th className="px-3.5 py-2.5 text-center">Estado</th>
                  <th className="px-3.5 py-2.5 text-center">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {cargando ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground text-xs">
                      <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-primary" />
                      Cargando reclamaciones y liquidaciones ARS...
                    </td>
                  </tr>
                ) : reclamacionesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground text-xs">
                      <AlertCircle className="size-6 mx-auto mb-2 text-amber-500" />
                      No se encontraron reclamaciones para los filtros y fechas seleccionados.
                    </td>
                  </tr>
                ) : (
                  reclamacionesFiltradas.map((r) => {
                    const pacNombre = r.paciente
                      ? `${r.paciente.nombre} ${r.paciente.apellido || ''}`.trim()
                      : 'Paciente sin registrar';
                    const pacCed = r.paciente?.documentoIdentidad || 'S/D';
                    const fechaStr = r.creadoEn
                      ? new Date(r.creadoEn).toLocaleDateString('es-DO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—';
                    const medicoNombre = r.cita?.profesional
                      ? `Dr(a). ${r.cita.profesional.nombre} ${r.cita.profesional.apellido || ''}`.trim()
                      : 'General';

                    return (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        {/* Recibo y Fecha */}
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <span className="font-mono font-semibold text-foreground block">
                            {r.numeroRecibo}
                          </span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="size-3 text-muted-foreground" />
                            {fechaStr}
                          </span>
                        </td>

                        {/* Paciente y Cédula */}
                        <td className="px-3.5 py-3">
                          <span className="font-semibold text-foreground block">{pacNombre}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[11px] text-muted-foreground">{pacCed}</span>
                            {pacCed !== 'S/D' && (
                              <button
                                onClick={() => copiarTexto(pacCed, `ced-${r.id}`)}
                                title="Copiar cédula"
                                className="text-muted-foreground hover:text-foreground"
                              >
                                {copiadoId === `ced-${r.id}` ? (
                                  <Check className="size-3 text-emerald-500" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* ARS y Póliza */}
                        <td className="px-3.5 py-3">
                          {getBadgeArs(r.nombreAseguradora)}
                          {r.numeroPoliza && (
                            <span className="block text-[10px] text-muted-foreground font-mono mt-1">
                              Afiliado: {r.numeroPoliza}
                            </span>
                          )}
                        </td>

                        {/* No. Autorización ARS */}
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          {r.numeroAutorizacion ? (
                            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                              <span>{r.numeroAutorizacion}</span>
                              <button
                                onClick={() => copiarTexto(r.numeroAutorizacion!, `aut-${r.id}`)}
                                title="Copiar código de autorización"
                                className="text-emerald-600 dark:text-emerald-400 hover:opacity-75"
                              >
                                {copiadoId === `aut-${r.id}` ? (
                                  <Check className="size-3 text-emerald-600" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                              Pendiente / S/A
                            </span>
                          )}
                        </td>

                        {/* Médico Tratante */}
                        <td className="px-3.5 py-3">
                          <span className="text-foreground block">{medicoNombre}</span>
                          {r.cita?.profesional?.especialidad && (
                            <span className="text-[10px] text-muted-foreground block">
                              {r.cita.profesional.especialidad}
                            </span>
                          )}
                        </td>

                        {/* Concepto / Procedimiento */}
                        <td className="px-3.5 py-3 max-w-[200px]">
                          <span className="line-clamp-2 text-[11px] text-foreground" title={r.concepto}>
                            {r.concepto}
                          </span>
                        </td>

                        {/* Copago */}
                        <td className="px-3.5 py-3 text-right font-mono whitespace-nowrap">
                          RD$ {Number(r.montoCopago || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Reclamado ARS */}
                        <td className="px-3.5 py-3 text-right font-mono font-bold whitespace-nowrap text-emerald-700 dark:text-emerald-400">
                          RD${' '}
                          {Number(r.coberturaSeguro || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Estado */}
                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                          {r.estado === 'COBRADO' ? (
                            <Badge variant="success" className="text-[10px] py-0">
                              Aprobada
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px] py-0">
                              Anulada
                            </Badge>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setItemSeleccionado(r)}
                            className="h-7 w-7 p-0"
                            title="Ver detalle del expediente"
                          >
                            <Eye className="size-3.5 text-primary" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL 1: DETALLE INDIVIDUAL DE RECLAMACIÓN / VOLANTE */}
      {itemSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border rounded-xl max-w-lg w-full shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Receipt className="size-4 text-emerald-600 dark:text-emerald-400" />
                  Expediente de Reclamación ARS
                </h3>
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  Comprobante: {itemSeleccionado.numeroRecibo}
                </p>
              </div>
              <button
                onClick={() => setItemSeleccionado(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Paciente y Aseguradora */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Paciente</span>
                  <span className="font-bold text-foreground">
                    {itemSeleccionado.paciente?.nombre} {itemSeleccionado.paciente?.apellido || ''}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono block mt-0.5">
                    Cédula: {itemSeleccionado.paciente?.documentoIdentidad || 'Sin cédula'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Aseguradora</span>
                  <div className="mt-0.5">{getBadgeArs(itemSeleccionado.nombreAseguradora)}</div>
                  {itemSeleccionado.numeroPoliza && (
                    <span className="text-[11px] text-muted-foreground font-mono block mt-1">
                      No. Póliza: {itemSeleccionado.numeroPoliza}
                    </span>
                  )}
                </div>
              </div>

              {/* Autorización y Médico */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                    No. Autorización ARS
                  </span>
                  {itemSeleccionado.numeroAutorizacion ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {itemSeleccionado.numeroAutorizacion}
                      </span>
                      <button
                        onClick={() =>
                          copiarTexto(itemSeleccionado.numeroAutorizacion!, 'mod-aut')
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {copiadoId === 'mod-aut' ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-amber-600 italic">No asignado</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                    Médico Tratante
                  </span>
                  <span className="font-semibold text-foreground block mt-1">
                    {itemSeleccionado.cita?.profesional
                      ? `Dr(a). ${itemSeleccionado.cita.profesional.nombre} ${itemSeleccionado.cita.profesional.apellido || ''}`
                      : 'No especificado'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {itemSeleccionado.cita?.profesional?.especialidad || 'Consulta Externa'}
                  </span>
                </div>
              </div>

              {/* Concepto y Servicios */}
              <div className="p-3 rounded-lg bg-muted/20 border border-border">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                  Concepto / Procedimiento Facturado
                </span>
                <p className="text-xs text-foreground leading-relaxed">{itemSeleccionado.concepto}</p>
              </div>

              {/* Desglose Económico */}
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1.5 font-mono">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Factura:</span>
                  <span className="font-bold">
                    RD$ {Number(itemSeleccionado.montoTotal || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Copago Pagado por Paciente:</span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    RD$ {Number(itemSeleccionado.montoCopago || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-emerald-500/30 pt-1 text-emerald-700 dark:text-emerald-400">
                  <span>Monto a Reclamar a la ARS:</span>
                  <span>
                    RD$ {Number(itemSeleccionado.coberturaSeguro || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setItemSeleccionado(null)} className="h-8 text-xs">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ESTADO OFICIAL DE LIQUIDACIÓN Y RECLAMACIONES ARS (FORMATO PARA IMPRESIÓN Y AUDITORÍA) */}
      {mostrarModalImpresion && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-card text-card-foreground border border-border rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera del modal (no se imprime) */}
            <div className="p-3 border-b flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-bold">
                  Vista Previa del Estado de Liquidación ARS para Impresión / PDF
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => window.print()}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  <Printer className="size-3.5 mr-1.5" />
                  Imprimir / Guardar como PDF
                </Button>
                <button
                  onClick={() => setMostrarModalImpresion(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-md"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* DOCUMENTO FORMAL IMPRIMIBLE */}
            <div
              id="hoja-liquidacion-imprimible"
              className="p-8 overflow-y-auto space-y-6 text-black bg-white dark:bg-white dark:text-black min-h-[500px]"
            >
              {/* Membrete Oficial */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-wide text-slate-900">
                    {nombreClinica}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">{direccionClinica}</p>
                  <p className="text-xs text-slate-600">Tel: {telefonoClinica} | RNC: {rncClinica}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 text-xs font-mono font-bold rounded">
                    Código PSS: {codigoPrestador}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Fecha Emisión: {new Date().toLocaleDateString('es-DO')}
                  </p>
                </div>
              </div>

              {/* Título del Documento */}
              <div className="text-center space-y-1">
                <h3 className="text-base font-extrabold uppercase tracking-wider text-slate-900 underline decoration-2">
                  ESTADO DE RECLAMACIÓN Y LIQUIDACIÓN A ASEGURADORA (ARS)
                </h3>
                <p className="text-xs text-slate-700">
                  Aseguradora:{' '}
                  <span className="font-bold text-slate-900">
                    {filtroArs === 'TODAS' ? 'CONSOLIDADO MULTI-ARS' : filtroArs}
                  </span>{' '}
                  | Período: Del{' '}
                  <span className="font-semibold">{fechaDesde || 'Inicio'}</span> al{' '}
                  <span className="font-semibold">{fechaHasta || 'Actualidad'}</span>
                </p>
              </div>

              {/* Cuadro Resumen Ejecutivo */}
              <div className="grid grid-cols-4 gap-3 bg-slate-50 border border-slate-300 rounded p-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">
                    Expedientes Reclamados
                  </span>
                  <span className="text-lg font-bold font-mono text-slate-900">
                    {reclamacionesFiltradas.length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">
                    Monto Bruto Facturado
                  </span>
                  <span className="text-sm font-bold font-mono text-slate-900">
                    RD${' '}
                    {reclamacionesFiltradas
                      .reduce((acc, curr) => acc + (Number(curr.montoTotal) || 0), 0)
                      .toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold block">
                    Copagos Recaudados
                  </span>
                  <span className="text-sm font-bold font-mono text-slate-700">
                    RD${' '}
                    {reclamacionesFiltradas
                      .reduce((acc, curr) => acc + (Number(curr.montoCopago) || 0), 0)
                      .toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-l-2 border-emerald-600 pl-3">
                  <span className="text-[10px] uppercase text-emerald-800 font-bold block">
                    TOTAL A LIQUIDAR (ARS)
                  </span>
                  <span className="text-base font-extrabold font-mono text-emerald-700">
                    RD${' '}
                    {reclamacionesFiltradas
                      .reduce((acc, curr) => acc + (Number(curr.coberturaSeguro) || 0), 0)
                      .toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Tabla Detallada para Auditoría Médica */}
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left border-collapse border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 uppercase text-[9px] font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-1.5 border border-slate-300">No. Recibo</th>
                      <th className="p-1.5 border border-slate-300">Fecha</th>
                      <th className="p-1.5 border border-slate-300">Paciente</th>
                      <th className="p-1.5 border border-slate-300">Cédula</th>
                      <th className="p-1.5 border border-slate-300">ARS / Póliza</th>
                      <th className="p-1.5 border border-slate-300">No. Autorización</th>
                      <th className="p-1.5 border border-slate-300">Médico</th>
                      <th className="p-1.5 border border-slate-300">Servicio</th>
                      <th className="p-1.5 border border-slate-300 text-right">Copago</th>
                      <th className="p-1.5 border border-slate-300 text-right font-bold">
                        Reclamado ARS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {reclamacionesFiltradas.map((item) => (
                      <tr key={item.id} className="text-slate-800">
                        <td className="p-1.5 border border-slate-300 font-mono font-semibold">
                          {item.numeroRecibo}
                        </td>
                        <td className="p-1.5 border border-slate-300 whitespace-nowrap">
                          {item.creadoEn ? new Date(item.creadoEn).toISOString().slice(0, 10) : ''}
                        </td>
                        <td className="p-1.5 border border-slate-300 font-medium">
                          {item.paciente?.nombre} {item.paciente?.apellido || ''}
                        </td>
                        <td className="p-1.5 border border-slate-300 font-mono">
                          {item.paciente?.documentoIdentidad || 'S/D'}
                        </td>
                        <td className="p-1.5 border border-slate-300">
                          {item.nombreAseguradora || 'ARS'}
                          {item.numeroPoliza && <span className="block text-[9px] font-mono">Pol: {item.numeroPoliza}</span>}
                        </td>
                        <td className="p-1.5 border border-slate-300 font-mono font-bold text-slate-900">
                          {item.numeroAutorizacion || 'S/A'}
                        </td>
                        <td className="p-1.5 border border-slate-300">
                          {item.cita?.profesional
                            ? `Dr(a). ${item.cita.profesional.nombre}`
                            : 'General'}
                        </td>
                        <td className="p-1.5 border border-slate-300 max-w-[120px] truncate" title={item.concepto}>
                          {item.concepto}
                        </td>
                        <td className="p-1.5 border border-slate-300 text-right font-mono">
                          {Number(item.montoCopago || 0).toFixed(2)}
                        </td>
                        <td className="p-1.5 border border-slate-300 text-right font-mono font-bold text-slate-900">
                          {Number(item.coberturaSeguro || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                      <td colSpan={8} className="p-2 border border-slate-300 text-right uppercase text-[10px]">
                        Totales Liquidados (RD$):
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-mono">
                        {reclamacionesFiltradas
                          .reduce((acc, curr) => acc + (Number(curr.montoCopago) || 0), 0)
                          .toFixed(2)}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-mono font-extrabold text-emerald-800">
                        {reclamacionesFiltradas
                          .reduce((acc, curr) => acc + (Number(curr.coberturaSeguro) || 0), 0)
                          .toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Texto de Certificación de la Ley 87-01 */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-600 leading-relaxed">
                Certificamos que los servicios médicos y procedimientos relacionados en la presente relación fueron debidamente
                autorizados por la aseguradora y prestados a los afiliados conforme a las normativas del Sistema Dominicano de
                Seguridad Social (Ley 87-01) y los acuerdos vigentes entre las partes.
              </div>

              {/* Firmas y Sellos Institucionales */}
              <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs">
                <div className="border-t border-slate-400 pt-2">
                  <span className="font-bold text-slate-800 block">Auditoría Médica y Facturación</span>
                  <span className="text-[10px] text-slate-500">Firma y Sello Responsable</span>
                </div>

                <div className="border-t border-slate-400 pt-2">
                  <span className="font-bold text-slate-800 block">Dirección / Administración Clínica</span>
                  <span className="text-[10px] text-slate-500">Firma Autorizada</span>
                </div>

                <div className="border-t border-slate-400 pt-2">
                  <span className="font-bold text-slate-800 block">Recibido Conforme ARS</span>
                  <span className="text-[10px] text-slate-500">Firma, Fecha y Sello Recepción</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
