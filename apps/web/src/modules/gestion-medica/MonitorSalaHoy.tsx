import * as React from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users,
  Play,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Shield,
  Eye,
  UserCheck,
  UserX,
} from 'lucide-react';
import { FichaPacienteDrawer } from '@/components/pacientes/FichaPacienteDrawer';

interface MonitorSalaHoyProps {
  onIniciarConsultaDirecta?: (cita: any) => void;
}

export function MonitorSalaHoy({ onIniciarConsultaDirecta }: MonitorSalaHoyProps) {
  const [citas, setCitas] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filtroEstado, setFiltroEstado] = React.useState<string>('TODOS');
  const [busqueda, setBusqueda] = React.useState('');
  const [accionLoadingId, setAccionLoadingId] = React.useState<string | null>(null);

  // Estado para abrir la Ficha del Paciente inline (drawer lateral)
  const [pacienteSeleccionadoId, setPacienteSeleccionadoId] = React.useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const cargarCitasHoy = React.useCallback(async () => {
    setLoading(true);
    try {
      const hoyStr = new Date().toISOString().slice(0, 10);
      const res = await api.get(`/citas?fecha=${hoyStr}`).catch(() => api.get('/citas'));
      const listado = Array.isArray(res) ? res : (res?.datos || res?.data || []);
      setCitas(listado);
    } catch (err) {
      console.error('Error al cargar citas del día:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    cargarCitasHoy();
  }, [cargarCitasHoy]);

  // Transición de estados de la cita médica
  const handleCambiarEstado = async (id: string, endpoint: string, payload: any = {}) => {
    setAccionLoadingId(id);
    try {
      await api.patch(`/citas/${id}/${endpoint}`, payload);
      await cargarCitasHoy();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado de la cita');
    } finally {
      setAccionLoadingId(null);
    }
  };

  const abrirFicha = (pacienteId: string) => {
    setPacienteSeleccionadoId(pacienteId);
    setDrawerOpen(true);
  };

  // Métricas de sala en vivo
  const totalHoy = citas.length;
  const enEspera = citas.filter((c) => c.estado === 'EN_ESPERA').length;
  const enConsulta = citas.filter((c) => c.estado === 'EN_CONSULTA').length;
  const atendidos = citas.filter((c) => c.estado === 'ATENDIDA' || c.estado === 'COMPLETADA').length;
  const noAsistieron = citas.filter((c) => c.estado === 'NO_ASISTIO').length;

  // Filtro y búsqueda
  const citasFiltradas = citas.filter((c) => {
    if (filtroEstado !== 'TODOS') {
      if (filtroEstado === 'ATENDIDA') {
        if (c.estado !== 'ATENDIDA' && c.estado !== 'COMPLETADA') return false;
      } else if (c.estado !== filtroEstado) {
        return false;
      }
    }

    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    const nombre = `${c.paciente?.nombre || ''} ${c.paciente?.apellido || ''}`.toLowerCase();
    const doc = (c.paciente?.documentoIdentidad || c.paciente?.dni || '').toLowerCase();
    const poliza = (c.paciente?.numeroPoliza || '').toLowerCase();
    const ars = (c.paciente?.ars || '').toLowerCase();
    const motivo = (c.motivo || '').toLowerCase();

    return nombre.includes(q) || doc.includes(q) || poliza.includes(q) || ars.includes(q) || motivo.includes(q);
  });

  return (
    <div className="space-y-5">
      {/* ── BANNER / HEADER CON RESUMEN ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Monitor de Pacientes de Hoy
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sala de espera en tiempo real: control de llegadas, consultas en curso y expedientes médicos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={cargarCitasHoy}
            disabled={loading}
            className="text-xs h-8 gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar Sala</span>
          </Button>
        </div>
      </div>

      {/* ── TARJETAS DE CONTADORES RÁPIDOS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setFiltroEstado('TODOS')}
          className={`p-3.5 rounded-xl border bg-card transition-all cursor-pointer ${
            filtroEstado === 'TODOS' ? 'border-primary ring-1 ring-primary shadow-xs' : 'border-border hover:border-border/80'
          }`}
        >
          <div className="text-[11px] font-semibold text-muted-foreground">Total Citados</div>
          <div className="text-2xl font-bold text-foreground mt-0.5">{totalHoy}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Agenda del día</div>
        </div>

        <div
          onClick={() => setFiltroEstado('EN_ESPERA')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            filtroEstado === 'EN_ESPERA'
              ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-500/10'
              : 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
          }`}
        >
          <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
            <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
            En Espera
          </div>
          <div className="text-2xl font-bold text-amber-800 dark:text-amber-300 mt-0.5">{enEspera}</div>
          <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">En sala clínica</div>
        </div>

        <div
          onClick={() => setFiltroEstado('EN_CONSULTA')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            filtroEstado === 'EN_CONSULTA'
              ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-500/10'
              : 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50'
          }`}
        >
          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            En Consulta
          </div>
          <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">{enConsulta}</div>
          <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">Siendo atendidos</div>
        </div>

        <div
          onClick={() => setFiltroEstado('ATENDIDA')}
          className={`p-3.5 rounded-xl border bg-card transition-all cursor-pointer ${
            filtroEstado === 'ATENDIDA' ? 'border-primary ring-1 ring-primary shadow-xs' : 'border-border hover:border-border/80'
          }`}
        >
          <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="size-3 text-sky-500" />
            Atendidos
          </div>
          <div className="text-2xl font-bold text-foreground mt-0.5">{atendidos}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Consultas listas</div>
        </div>

        <div
          onClick={() => setFiltroEstado('NO_ASISTIO')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            filtroEstado === 'NO_ASISTIO'
              ? 'border-destructive ring-1 ring-destructive bg-destructive/10'
              : 'border-destructive/30 bg-destructive/5 hover:border-destructive/50'
          }`}
        >
          <div className="text-[11px] font-semibold text-destructive flex items-center gap-1">
            <XCircle className="size-3" />
            No Asistió
          </div>
          <div className="text-2xl font-bold text-destructive mt-0.5">{noAsistieron}</div>
          <div className="text-[10px] text-destructive/80 mt-0.5">Inasistencias</div>
        </div>
      </div>

      {/* ── BARRA DE BÚSQUEDA Y FILTROS ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente, cédula, ARS o póliza..."
            className="pl-9 h-9 text-xs"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1 hidden sm:inline">Mostrar:</span>
          {['TODOS', 'EN_ESPERA', 'EN_CONSULTA', 'ATENDIDA', 'NO_ASISTIO'].map((st) => (
            <button
              key={st}
              onClick={() => setFiltroEstado(st)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                filtroEstado === st
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {st === 'TODOS' ? 'Todos' : st === 'EN_ESPERA' ? 'En Sala' : st === 'EN_CONSULTA' ? 'En Consulta' : st === 'ATENDIDA' ? 'Atendidos' : 'Inasistencias'}
            </button>
          ))}
        </div>
      </div>

      {/* ── LISTADO DE PACIENTES DE HOY ── */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground text-xs animate-pulse">
          Cargando citas de la sala de espera...
        </div>
      ) : citasFiltradas.length === 0 ? (
        <Card className="border-dashed border-border bg-muted/20">
          <CardContent className="p-12 text-center space-y-2">
            <Users className="size-10 text-muted-foreground/40 mx-auto" />
            <h3 className="font-semibold text-sm">No hay pacientes con el filtro seleccionado</h3>
            <p className="text-xs text-muted-foreground">
              {citas.length === 0
                ? 'No se registran citas programadas para el día de hoy.'
                : 'Intenta limpiar el buscador o seleccionar otro estado de sala.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {citasFiltradas.map((cita) => {
            const isEspera = cita.estado === 'EN_ESPERA';
            const isEnConsulta = cita.estado === 'EN_CONSULTA';
            const isAtendida = cita.estado === 'ATENDIDA' || cita.estado === 'COMPLETADA';
            const isNoAsistio = cita.estado === 'NO_ASISTIO';
            const isProgramada = cita.estado === 'PROGRAMADA' || cita.estado === 'CONFIRMADA';

            const fechaHora = new Date(cita.fechaHoraInicio);
            const horaStr = fechaHora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={cita.id}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card ${
                  isEspera
                    ? 'border-amber-500/50 bg-amber-500/5 shadow-xs'
                    : isEnConsulta
                    ? 'border-emerald-500/50 bg-emerald-500/5 shadow-xs'
                    : 'border-border'
                }`}
              >
                {/* Info del Paciente */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Hora badge */}
                  <div className="p-2.5 rounded-lg bg-muted/60 text-center shrink-0 min-w-[62px]">
                    <div className="text-xs font-bold text-foreground font-mono">{horaStr}</div>
                    <div className="text-[9px] text-muted-foreground uppercase">Turno</div>
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-foreground truncate">
                        {cita.paciente?.nombre} {cita.paciente?.apellido || ''}
                      </h4>

                      {/* Estado badge */}
                      {isEspera && (
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-2 py-0">
                          🟡 En Sala de Espera
                        </Badge>
                      )}
                      {isEnConsulta && (
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-2 py-0">
                          🟢 En Consulta
                        </Badge>
                      )}
                      {isAtendida && (
                        <Badge variant="outline" className="text-sky-600 border-sky-500/30 text-[10px] px-2 py-0">
                          ✓ Atendido
                        </Badge>
                      )}
                      {isNoAsistio && (
                        <Badge variant="destructive" className="text-[10px] px-2 py-0">
                          ✕ No Asistió
                        </Badge>
                      )}
                      {isProgramada && (
                        <Badge variant="secondary" className="text-[10px] px-2 py-0">
                          Por Llegar
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>Cédula: <strong className="text-foreground">{cita.paciente?.documentoIdentidad || cita.paciente?.dni || 'S/D'}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Shield className="size-3 text-sky-500" />
                        ARS: <strong className="text-foreground">{cita.paciente?.ars || 'Particular'}</strong>
                      </span>
                      {cita.paciente?.numeroPoliza && (
                        <>
                          <span>•</span>
                          <span>Póliza: <strong className="text-foreground">{cita.paciente.numeroPoliza}</strong></span>
                        </>
                      )}
                    </div>

                    {cita.motivo && (
                      <div className="text-xs text-muted-foreground pt-0.5">
                        <span className="font-semibold text-foreground">Motivo:</span> {cita.motivo}
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end border-t md:border-t-0 pt-2 md:pt-0">
                  {/* Botón Abrir Ficha Médica Inline */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10 cursor-pointer"
                    onClick={() => abrirFicha(cita.pacienteId || cita.paciente?.id)}
                  >
                    <Eye className="size-3.5" />
                    <span>Ficha Médica</span>
                  </Button>

                  {/* Acciones según estado */}
                  {isProgramada && (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 text-xs gap-1 bg-amber-600 hover:bg-amber-700 text-white"
                      disabled={accionLoadingId === cita.id}
                      onClick={() => handleCambiarEstado(cita.id, 'registrar-llegada')}
                    >
                      <UserCheck className="size-3.5" />
                      <span>Registrar Llegada</span>
                    </Button>
                  )}

                  {isEspera && (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={accionLoadingId === cita.id}
                      onClick={() => {
                        handleCambiarEstado(cita.id, 'iniciar-consulta');
                        if (onIniciarConsultaDirecta) onIniciarConsultaDirecta(cita);
                      }}
                    >
                      <Play className="size-3.5" />
                      <span>Llamar a Consulta</span>
                    </Button>
                  )}

                  {isEnConsulta && (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 text-xs gap-1 bg-primary text-primary-foreground"
                      disabled={accionLoadingId === cita.id}
                      onClick={() => handleCambiarEstado(cita.id, 'finalizar')}
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>Finalizar Atención</span>
                    </Button>
                  )}

                  {isProgramada && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-destructive hover:bg-destructive/10 px-2"
                      disabled={accionLoadingId === cita.id}
                      onClick={() => handleCambiarEstado(cita.id, 'no-asistio')}
                      title="Marcar inasistencia"
                    >
                      <UserX className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DRAWER LATERAL DE FICHA DE PACIENTE INLINE ── */}
      <FichaPacienteDrawer
        pacienteId={pacienteSeleccionadoId}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onPacienteActualizado={() => cargarCitasHoy()}
      />
    </div>
  );
}
