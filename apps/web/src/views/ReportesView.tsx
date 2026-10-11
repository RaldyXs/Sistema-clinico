import * as React from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Users,
  Clock,
  Activity,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Baby,
  FileSpreadsheet,
} from 'lucide-react';

interface Props {
  onIrAReclamaciones?: () => void;
}

export function ReportesView({ onIrAReclamaciones }: Props = {}) {
  const [reporteOperativo, setReporteOperativo] = React.useState<any | null>(null);
  const [reporteMedicos, setReporteMedicos] = React.useState<any[]>([]);
  const [reporteEpidemio, setReporteEpidemio] = React.useState<any | null>(null);
  const [medicos, setMedicos] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filtros
  const [fechaInicio, setFechaInicio] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [fechaFin, setFechaFin] = React.useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [profesionalId, setProfesionalId] = React.useState<string>('');
  const [exportando, setExportando] = React.useState(false);

  const cargarDatos = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);
      if (profesionalId) params.append('profesionalId', profesionalId);

      const qs = params.toString() ? `?${params.toString()}` : '';

      const [op, med, epi, medList] = await Promise.all([
        api.get(`/reportes/operativo${qs}`),
        api.get(`/reportes/medicos${qs}`),
        api.get(`/reportes/epidemiologico${qs}`),
        api.get('/usuarios/medicos').catch(() => []),
      ]);

      setReporteOperativo(op);
      setReporteMedicos(Array.isArray(med) ? med : []);
      setReporteEpidemio(epi);
      setMedicos(Array.isArray(medList) ? medList : []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin, profesionalId]);

  React.useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const descargarCsv = async () => {
    setExportando(true);
    try {
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);
      if (profesionalId) params.append('profesionalId', profesionalId);

      const qs = params.toString() ? `?${params.toString()}` : '';
      await api.downloadBlob(`/reportes/exportar/citas-csv${qs}`, `Reporte_Citas_${fechaInicio}_${fechaFin}.csv`);
    } catch (err: any) {
      alert(err.message || 'Error al exportar CSV');
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Cabecera y botón exportar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-1.5">
            <BarChart3 className="size-4 text-primary" />
            Reportes Clínicos y Estadísticas
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Productividad médica, ausentismo de citas, horas pico y epidemiología
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onIrAReclamaciones && (
            <Button
              onClick={onIrAReclamaciones}
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
            >
              <FileSpreadsheet className="size-3.5 mr-1" />
              Reclamaciones ARS & Seguros
            </Button>
          )}
          <Button onClick={descargarCsv} disabled={exportando} variant="outline" size="sm" className="h-7 text-xs px-2.5">
            <Download className="size-3.5 mr-1" />
            {exportando ? 'Generando...' : 'Exportar CSV'}
          </Button>
        </div>
      </div>

      {/* Barra de Filtros Temporales y de Profesional */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-semibold flex items-center gap-1">
              <Calendar className="size-3.5" /> Desde:
            </span>
            <input
              type="date"
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-semibold flex items-center gap-1">
              <Calendar className="size-3.5" /> Hasta:
            </span>
            <input
              type="date"
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-semibold flex items-center gap-1">
              <Users className="size-3.5" /> Médico:
            </span>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              value={profesionalId}
              onChange={(e) => setProfesionalId(e.target.value)}
            >
              <option value="">Todos los profesionales</option>
              {medicos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre} {m.apellido || ''}
                </option>
              ))}
            </select>
          </div>

          <Button variant="ghost" size="sm" onClick={cargarDatos} className="ml-auto text-xs h-8">
            <RefreshCw className={`size-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Aplicar Filtros
          </Button>
        </CardContent>
      </Card>

      {/* KPIS OPERATIVOS DE CITAS Y AUSENTISMO */}
      {reporteOperativo && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Citas Agendadas
              </CardTitle>
              <Calendar className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reporteOperativo.citas.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {reporteOperativo.citas.pendientes} turnos por atender
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tasa de Efectividad
              </CardTitle>
              <TrendingUp className="size-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {reporteOperativo.citas.tasaEfectividadPct}%
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <CheckCircle2 className="size-3 text-emerald-500" />
                {reporteOperativo.citas.atendidas} consultas concretadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ausentismo / No-Show
              </CardTitle>
              <TrendingDown className="size-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {reporteOperativo.citas.tasaAusentismoPct}%
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <XCircle className="size-3 text-destructive" />
                {reporteOperativo.citas.canceladas + reporteOperativo.citas.noAsistio} turnos perdidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Actos Médicos
              </CardTitle>
              <Activity className="size-4 text-sky-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reporteEpidemio?.totalConsultas ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Historias clínicas completadas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* FRANJAS HORARIAS Y CARGA POR DÍA */}
      {reporteOperativo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                Distribución por Franjas Horarias (Horas Pico)
              </CardTitle>
              <CardDescription>Volumen de concurrencia de pacientes a la clínica</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Mañana (08:00 - 12:00)', count: reporteOperativo.franjasHorarias.manana, color: 'bg-amber-500' },
                { label: 'Mediodía (12:00 - 16:00)', count: reporteOperativo.franjasHorarias.mediodia, color: 'bg-sky-500' },
                { label: 'Tarde (16:00 - 20:00)', count: reporteOperativo.franjasHorarias.tarde, color: 'bg-primary' },
                { label: 'Noche (20:00+)', count: reporteOperativo.franjasHorarias.noche, color: 'bg-purple-500' },
              ].map((f, i) => {
                const total = reporteOperativo.citas.total || 1;
                const pct = Math.round((f.count / total) * 100);
                return (
                  <div key={i} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{f.label}</span>
                      <span className="text-muted-foreground font-mono">
                        {f.count} citas ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full ${f.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="size-4 text-emerald-500" />
                Citas por Día de la Semana
              </CardTitle>
              <CardDescription>Carga operativa según el día del turno</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(reporteOperativo.distribucionSemanal).map(([dia, cant]: any, i) => {
                const total = reporteOperativo.citas.total || 1;
                const pct = Math.round((cant / total) * 100);
                return (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-medium w-24">{dia}</span>
                    <div className="flex-1 mx-3 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="font-mono w-12 text-right text-muted-foreground">{cant}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* PRODUCTIVIDAD POR PROFESIONAL MÉDICO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4 text-primary" />
            Productividad y Carga de Trabajo por Médico
          </CardTitle>
          <CardDescription>Rendimiento asistencial individual en el período</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-3 font-semibold">Médico</th>
                  <th className="px-6 py-3 font-semibold">Especialidad</th>
                  <th className="px-6 py-3 font-semibold">Citas Agendadas</th>
                  <th className="px-6 py-3 font-semibold">Atendidas</th>
                  <th className="px-6 py-3 font-semibold">Canceladas</th>
                  <th className="px-6 py-3 font-semibold">Cumplimiento %</th>
                  <th className="px-6 py-3 font-semibold">Recetas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reporteMedicos.map((m) => (
                  <tr key={m.medicoId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {m.nombreCompleto}
                      {m.matricula && (
                        <span className="block text-xs font-normal text-muted-foreground font-mono">
                          {m.matricula}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {m.especialidad || 'General'}
                    </td>
                    <td className="px-6 py-4 font-bold">{m.totalCitas}</td>
                    <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-bold">
                      {m.citasAtendidas}
                    </td>
                    <td className="px-6 py-4 text-destructive">{m.citasCanceladas}</td>
                    <td className="px-6 py-4">
                      <Badge variant={m.tasaCumplimientoPct >= 80 ? 'success' : 'warning'}>
                        {m.tasaCumplimientoPct}%
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{m.recetasEmitidas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* PERFIL EPIDEMIOLÓGICO Y MATERNO */}
      {reporteEpidemio && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top CIE-10 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="size-4 text-emerald-500" />
                Perfil Epidemiológico (CIE-10 Prevalente)
              </CardTitle>
              <CardDescription>Patologías más consultadas en el período</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {reporteEpidemio.topDiagnosticos.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  Sin diagnósticos registrados en el rango de fechas seleccionado.
                </div>
              ) : (
                reporteEpidemio.topDiagnosticos.map((d: any, i: number) => (
                  <div key={i} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {d.diagnostico}{' '}
                        {d.codigoCie10 && <span className="font-mono text-primary font-bold">[{d.codigoCie10}]</span>}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        {d.total} casos ({d.porcentaje}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${d.porcentaje}%` }} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Salud Materna y Obstétrica */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Baby className="size-4 text-pink-500" />
                Métricas Obstétricas y Perinatales
              </CardTitle>
              <CardDescription>Seguimiento de gestantes y estudios ecográficos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 text-center">
                  <span className="text-xs text-muted-foreground block">Controles Prenatales</span>
                  <span className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                    {reporteEpidemio.metricasObstetricas?.controlesPrenatales ?? 0}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center">
                  <span className="text-xs text-muted-foreground block">Ecografías Fetal/Pélvica</span>
                  <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                    {reporteEpidemio.metricasObstetricas?.ecografiasRealizadas ?? 0}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground leading-relaxed">
                Los datos integran atenciones seriadas de control prenatal y mediciones biométricas Hadlock
                efectuadas para el consultorio autenticado.
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
