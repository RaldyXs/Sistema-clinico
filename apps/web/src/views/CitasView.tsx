import * as React from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Clock,
  Plus,
  RefreshCw,
  CheckCircle,
  Play,
  XCircle,
  UserCheck,
  X,
  AlertCircle,
} from 'lucide-react';

export function CitasView() {
  const [citas, setCitas] = React.useState<any[]>([]);
  const [pacientes, setPacientes] = React.useState<any[]>([]);
  const [medicos, setMedicos] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filtroEstado, setFiltroEstado] = React.useState<string>('TODOS');
  const [showModalCrear, setShowModalCrear] = React.useState(false);

  // Formulario nueva cita
  const [form, setForm] = React.useState(() => ({
    pacienteId: '',
    profesionalId: '',
    fechaHoraInicio: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    duracionMinutos: 30,
    motivo: 'Consulta de control general',
  }));
  const [guardando, setGuardando] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const cargarDatos = React.useCallback(async () => {
    setLoading(true);
    try {
      const [citasData, pacData, medData] = await Promise.all([
        api.get('/citas'),
        api.get('/pacientes'),
        api.get('/usuarios/medicos').catch(() => []),
      ]);
      setCitas(Array.isArray(citasData) ? citasData : citasData.data || []);
      setPacientes(Array.isArray(pacData) ? pacData : pacData.data || []);
      setMedicos(Array.isArray(medData) ? medData : []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const cambiarEstado = async (id: string, accion: string) => {
    try {
      await api.patch(`/citas/${id}/${accion}`, {});
      cargarDatos();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado de la cita');
    }
  };

  const handleCrearCita = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setFormError(null);

    try {
      const inicio = new Date(form.fechaHoraInicio);
      const fin = new Date(inicio.getTime() + form.duracionMinutos * 60000);

      await api.post('/citas', {
        pacienteId: form.pacienteId,
        profesionalId: form.profesionalId || undefined,
        fechaHoraInicio: inicio.toISOString(),
        fechaHoraFin: fin.toISOString(),
        motivo: form.motivo,
      });

      setShowModalCrear(false);
      cargarDatos();
    } catch (err: any) {
      setFormError(err.message || 'Error al agendar cita médica');
    } finally {
      setGuardando(false);
    }
  };

  const citasFiltradas = citas.filter((c) =>
    filtroEstado === 'TODOS' ? true : c.estado === filtroEstado,
  );

  const formatearFechaHora = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString([], {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
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
        return <Badge variant="warning">En Espera (Llegó)</Badge>;
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

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda y Flujo de Atención</h1>
          <p className="text-sm text-muted-foreground">
            Programación de turnos, gestión de sala de espera y ciclo de consulta
          </p>
        </div>
        <Button onClick={() => setShowModalCrear(true)}>
          <Plus className="size-4 mr-2" />
          Agendar Nueva Cita
        </Button>
      </div>

      {/* Barra de filtros de estado */}
      <div className="flex flex-wrap items-center gap-2">
        {['TODOS', 'PROGRAMADA', 'EN_ESPERA', 'EN_CONSULTA', 'ATENDIDA', 'CANCELADA'].map((st) => (
          <Button
            key={st}
            variant={filtroEstado === st ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroEstado(st)}
            className="text-xs capitalize"
          >
            {st.replace('_', ' ').toLowerCase()}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={cargarDatos} className="ml-auto">
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Listado de citas */}
      <Card>
        <CardContent className="p-0">
          {loading && citas.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
              Cargando agenda médica...
            </div>
          ) : citasFiltradas.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No hay citas registradas en el estado seleccionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Horario</th>
                    <th className="px-6 py-3 font-semibold">Paciente</th>
                    <th className="px-6 py-3 font-semibold">Motivo</th>
                    <th className="px-6 py-3 font-semibold">Profesional</th>
                    <th className="px-6 py-3 font-semibold">Estado</th>
                    <th className="px-6 py-3 font-semibold text-right">Acciones de Flujo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {citasFiltradas.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="size-4 text-primary" />
                          <span>{formatearFechaHora(c.fechaHoraInicio)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">
                          {c.paciente?.nombre} {c.paciente?.apellido || ''}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          DNI: {c.paciente?.dni || 'N/D'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                        {c.motivo}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {c.profesional?.nombre
                          ? `${c.profesional.nombre} ${c.profesional.apellido || ''}`
                          : 'Asignación General'}
                      </td>
                      <td className="px-6 py-4">{getBadgeEstadoCita(c.estado)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.estado === 'PROGRAMADA' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 text-sky-600 hover:bg-sky-500/10"
                              onClick={() => cambiarEstado(c.id, 'registrar-llegada')}
                              title="El paciente llegó a la sala de espera"
                            >
                              <UserCheck className="size-3.5 mr-1" />
                              Llegada
                            </Button>
                          )}

                          {c.estado === 'EN_ESPERA' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 text-amber-600 hover:bg-amber-500/10"
                              onClick={() => cambiarEstado(c.id, 'iniciar-consulta')}
                              title="Hacer pasar al consultorio"
                            >
                              <Play className="size-3.5 mr-1" />
                              Iniciar
                            </Button>
                          )}

                          {c.estado === 'EN_CONSULTA' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 text-emerald-600 hover:bg-emerald-500/10"
                              onClick={() => cambiarEstado(c.id, 'finalizar')}
                              title="Finalizar y cerrar atención"
                            >
                              <CheckCircle className="size-3.5 mr-1" />
                              Finalizar
                            </Button>
                          )}

                          {!['ATENDIDA', 'CANCELADA', 'NO_ASISTIO'].includes(c.estado) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 text-muted-foreground hover:text-destructive"
                              onClick={() => cambiarEstado(c.id, 'cancelar')}
                              title="Cancelar turno"
                            >
                              <XCircle className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL AGENDAR NUEVA CITA */}
      {showModalCrear && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-md w-full shadow-2xl border-border">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Agendar Nueva Cita</h3>
                <p className="text-xs text-muted-foreground">Reservar turno en la agenda médica</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowModalCrear(false)}>
                <X className="size-5" />
              </Button>
            </div>

            <form onSubmit={handleCrearCita}>
              <div className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Paciente *</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus:border-primary"
                    required
                    value={form.pacienteId}
                    onChange={(e) => setForm({ ...form, pacienteId: e.target.value })}
                  >
                    <option value="">Seleccione un paciente...</option>
                    {pacientes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {p.apellido || ''} (DNI: {p.dni})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Profesional Asignado</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus:border-primary"
                    value={form.profesionalId}
                    onChange={(e) => setForm({ ...form, profesionalId: e.target.value })}
                  >
                    <option value="">Cualquier profesional disponible</option>
                    {medicos.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre} {m.apellido || ''} ({m.especialidad || 'Médico'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Fecha y Hora *</label>
                    <Input
                      type="datetime-local"
                      required
                      value={form.fechaHoraInicio}
                      onChange={(e) => setForm({ ...form, fechaHoraInicio: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Duración (min)</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus:border-primary"
                      value={form.duracionMinutos}
                      onChange={(e) => setForm({ ...form, duracionMinutos: parseInt(e.target.value, 10) })}
                    >
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Motivo de la Cita *</label>
                  <Input
                    required
                    placeholder="Ej. Control de rutina, Ecografía, Cefalea"
                    value={form.motivo}
                    onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-4 border-t border-border flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowModalCrear(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardando}>
                  {guardando ? 'Agendando...' : 'Confirmar Cita'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
