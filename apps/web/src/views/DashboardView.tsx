import * as React from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Calendar,
  Stethoscope,
  FileText,
  Baby,
  RefreshCw,
  Clock,
  Activity,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export function DashboardView({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [resumen, setResumen] = React.useState<any>(null);
  const [actividad, setActividad] = React.useState<any[]>([]);
  const [topDiagnosticos, setTopDiagnosticos] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const cargarDatos = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resumenData, actividadData, diagData] = await Promise.all([
        api.get('/dashboard/resumen'),
        api.get('/dashboard/actividad'),
        api.get('/dashboard/top-diagnosticos'),
      ]);
      setResumen(resumenData);
      setActividad(actividadData);
      setTopDiagnosticos(diagData);
    } catch (err: any) {
      if (err?.statusCode === 401) {
        // La sesión expiró o es inválida; el interceptor y AuthContext limpian y redirigen
        return;
      }
      setError(err.message || 'Error al cargar métricas del dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const formatearHora = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  const formatearFechaRelativa = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  const getBadgeEstadoCita = (estado: string) => {
    switch (estado) {
      case 'PROGRAMADA':
        return <Badge variant="secondary">Programada</Badge>;
      case 'CONFIRMADA':
        return <Badge variant="info">Confirmada</Badge>;
      case 'EN_ESPERA':
        return <Badge variant="warning">En Espera</Badge>;
      case 'EN_CONSULTA':
        return <Badge variant="default">En Consulta</Badge>;
      case 'ATENDIDA':
        return <Badge variant="success">Atendida</Badge>;
      case 'CANCELADA':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  if (loading && !resumen) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        <RefreshCw className="size-6 animate-spin mr-2 text-primary" />
        <span>Cargando métricas en tiempo real...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full min-h-full flex flex-col space-y-4 sm:space-y-5">
      {/* Cabecera con botón de refrescar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel de Control Clínico</h1>
          <p className="text-sm text-muted-foreground">
            Métricas operativas consolidadas en tiempo real para tu consultorio
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={cargarDatos} disabled={loading} className="gap-2 shrink-0">
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar Datos
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm shrink-0">
          {error}
        </div>
      )}

      {/* Grid de 5 KPIs principales */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 shrink-0">
        {/* Pacientes Activos */}
        <Card className="hover:border-primary/40 transition-colors shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pacientes Activos
            </CardTitle>
            <Users className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen?.pacientes?.totalActivos ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="size-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">+{resumen?.pacientes?.nuevosMes ?? 0}</span> este mes
            </p>
          </CardContent>
        </Card>

        {/* Citas de Hoy */}
        <Card className="hover:border-sky-500/40 transition-colors shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Citas Hoy
            </CardTitle>
            <Calendar className="size-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen?.citasHoy?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {resumen?.citasHoy?.porEstado?.ATENDIDA ?? 0} atendidas • {resumen?.citasHoy?.porEstado?.EN_ESPERA ?? 0} en espera
            </p>
          </CardContent>
        </Card>

        {/* Consultas del Mes */}
        <Card className="hover:border-emerald-500/40 transition-colors shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Consultas Mes
            </CardTitle>
            <Stethoscope className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen?.consultasMes?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {resumen?.consultasMes?.firmadas ?? 0} firmadas y cerradas
            </p>
          </CardContent>
        </Card>

        {/* Recetas Emitidas */}
        <Card className="hover:border-amber-500/40 transition-colors shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recetas Emitidas
            </CardTitle>
            <FileText className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen?.recetasMes?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Prescripciones oficiales este mes</p>
          </CardContent>
        </Card>

        {/* Embarazos Activos */}
        <Card className="hover:border-pink-500/40 transition-colors shadow-xs col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Embarazos Activos
            </CardTitle>
            <Baby className="size-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumen?.embarazosActivos ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">En control obstétrico regular</p>
          </CardContent>
        </Card>
      </div>

      {/* Fila intermedia: Próximas Citas (2 columnas) y Top Diagnósticos (1 columna) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 shrink-0">
        {/* Próximas Citas de Hoy (2 columnas) */}
        <Card className="lg:col-span-2 shadow-xs flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <span>Próximas Citas Inmediatas de Hoy</span>
              </CardTitle>
              <CardDescription>Turnos agendados y pacientes en sala de espera</CardDescription>
            </div>
            {onNavigate && (
              <Button variant="ghost" size="sm" onClick={() => onNavigate('citas')} className="text-xs text-primary hover:text-primary">
                Ver Agenda Completa →
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 justify-center">
            {(!resumen?.proximasCitas || resumen.proximasCitas.length === 0) ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No hay más turnos pendientes programados para el resto del día de hoy.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {resumen.proximasCitas.map((c: any) => (
                  <div
                    key={c.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-border/70 hover:bg-muted/30 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {formatearHora(c.fechaHoraInicio)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">
                          {c.paciente.nombre} {c.paciente.apellido || ''}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {c.motivo} • Médico: {c.profesional?.nombre || 'General'}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {getBadgeEstadoCita(c.estado)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Diagnósticos CIE-10 (1 columna) */}
        <Card className="shadow-xs flex flex-col">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="size-4 text-emerald-500" />
              <span>Top Diagnósticos CIE-10</span>
            </CardTitle>
            <CardDescription>Patologías prevalentes este mes</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            {topDiagnosticos.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm my-auto">
                Aún no hay diagnósticos registrados en este período.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {topDiagnosticos.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1">
                    <div className="min-w-0 pr-2">
                      <div className="font-medium truncate">{d.diagnostico}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {d.codigoCie10 || 'Sin código'}
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0 font-bold">
                      {d.total} {d.total === 1 ? 'caso' : 'casos'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Muro de actividad cronológico (Ancho completo abajo, ocupa el espacio restante hasta abajo) */}
      <Card className="shadow-xs flex-1 flex flex-col min-h-[220px]">
        <CardHeader className="pb-2 shrink-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CheckCircle2 className="size-4 text-sky-500" />
            <span>Muro de Actividad Asistencial en Vivo</span>
          </CardTitle>
          <CardDescription>Últimos eventos registrados en el consultorio</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
          {actividad.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm my-auto">
              Sin actividad reciente registrada.
            </div>
          ) : (
            <div className="divide-y divide-border overflow-y-auto flex-1 pr-1">
              {actividad.map((ev) => (
                <div key={ev.id} className="py-2.5 px-1 flex items-center justify-between gap-4 text-sm hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge
                      variant={
                        ev.tipo === 'CONSULTA'
                          ? 'success'
                          : ev.tipo === 'RECETA'
                          ? 'warning'
                          : 'info'
                      }
                      className="shrink-0 text-[10px]"
                    >
                      {ev.tipo}
                    </Badge>
                    <div className="min-w-0 truncate">
                      <span className="font-medium text-foreground">{ev.descripcion}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        (Paciente: {ev.paciente.nombre} {ev.paciente.apellido || ''})
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                    {formatearFechaRelativa(ev.fecha)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
