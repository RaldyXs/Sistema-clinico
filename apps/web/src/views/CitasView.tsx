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
  UserX,
  Check,
  X,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function CitasView() {
  const { user } = useAuth();
  const isRecepcion = user?.rolCodigo === 'RECEPCION';
  const [citas, setCitas] = React.useState<any[]>([]);
  const [pacientes, setPacientes] = React.useState<any[]>([]);
  const [medicos, setMedicos] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filtroEstado, setFiltroEstado] = React.useState<string>('TODOS');
  const [showModalCrear, setShowModalCrear] = React.useState(false);

  // Estado para modal de cancelación
  const [citaACancelar, setCitaACancelar] = React.useState<any | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = React.useState('Paciente solicitó cancelación');
  const [cancelando, setCancelando] = React.useState(false);

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
        api.get('/citas').catch(() => []),
        api.get('/pacientes?limite=100').catch(() => []),
        api.get('/usuarios/medicos').catch(() => []),
      ]);
      setCitas(Array.isArray(citasData) ? citasData : (citasData?.datos || citasData?.data || []));
      setPacientes(Array.isArray(pacData) ? pacData : (pacData?.datos || pacData?.data || []));
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

  const cambiarEstado = async (id: string, accion: string, payload: any = {}) => {
    try {
      await api.patch(`/citas/${id}/${accion}`, payload);
      cargarDatos();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado de la cita');
    }
  };

  const handleConfirmarCancelacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citaACancelar) return;
    setCancelando(true);
    try {
      await api.patch(`/citas/${citaACancelar.id}/cancelar`, {
        motivoCancelacion: motivoCancelacion.trim() || 'Cancelada a solicitud del paciente',
      });
      setCitaACancelar(null);
      cargarDatos();
    } catch (err: any) {
      alert(err.message || 'Error al cancelar la cita médica');
    } finally {
      setCancelando(false);
    }
  };

  const handleCrearCita = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setFormError(null);

    try {
      const inicio = new Date(form.fechaHoraInicio);
      const doctorId = form.profesionalId || medicos[0]?.id;
      if (!doctorId) {
        throw new Error('Debes seleccionar un profesional médico para la cita');
      }

      await api.post('/citas', {
        pacienteId: form.pacienteId,
        profesionalId: doctorId,
        fechaHoraInicio: inicio.toISOString(),
        duracionMinutos: Number(form.duracionMinutos) || 30,
        motivo: form.motivo.trim(),
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
      case 'NO_ASISTIO':
        return <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-500/10">No Asistió</Badge>;
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
        {['TODOS', 'PROGRAMADA', 'CONFIRMADA', 'EN_ESPERA', 'EN_CONSULTA', 'ATENDIDA', 'CANCELADA', 'NO_ASISTIO'].map((st) => (
          <Button
            key={st}
            variant={filtroEstado === st ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroEstado(st)}
            className="text-xs capitalize cursor-pointer"
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
                          {c.paciente?.tipoDocumento || 'Doc'}: {c.paciente?.documentoIdentidad || c.paciente?.dni || 'S/D'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground max-w-xs">
                        <div className="truncate">{c.motivo}</div>
                        {c.estado === 'CANCELADA' && c.motivoCancelacion && (
                          <div className="text-[11px] text-destructive italic mt-0.5">
                            Motivo: {c.motivoCancelacion}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {c.profesional?.nombre
                          ? `${c.profesional.nombre} ${c.profesional.apellido || ''}`
                          : 'Asignación General'}
                      </td>
                      <td className="px-6 py-4">{getBadgeEstadoCita(c.estado)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {c.estado === 'PROGRAMADA' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 text-indigo-600 hover:bg-indigo-500/10 cursor-pointer"
                                onClick={() => cambiarEstado(c.id, 'confirmar')}
                                title="Paciente confirma asistencia por teléfono/WhatsApp"
                              >
                                <Check className="size-3.5 mr-1" />
                                Confirmar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 text-sky-600 hover:bg-sky-500/10 cursor-pointer"
                                onClick={() => cambiarEstado(c.id, 'registrar-llegada')}
                                title="El paciente llegó a la sala de espera"
                              >
                                <UserCheck className="size-3.5 mr-1" />
                                Llegó
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7 text-amber-600 hover:bg-amber-500/10 cursor-pointer"
                                onClick={() => {
                                  if (confirm(`¿Marcar como "No Asistió" a ${c.paciente?.nombre}?`)) {
                                    cambiarEstado(c.id, 'no-asistio');
                                  }
                                }}
                                title="El turno pasó y el paciente no asistió"
                              >
                                <UserX className="size-3.5 mr-1" />
                                No Asistió
                              </Button>
                            </>
                          )}

                          {c.estado === 'CONFIRMADA' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 text-sky-600 hover:bg-sky-500/10 cursor-pointer"
                                onClick={() => cambiarEstado(c.id, 'registrar-llegada')}
                                title="El paciente llegó a la sala de espera"
                              >
                                <UserCheck className="size-3.5 mr-1" />
                                Llegó
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7 text-amber-600 hover:bg-amber-500/10 cursor-pointer"
                                onClick={() => {
                                  if (confirm(`¿Marcar como "No Asistió" a ${c.paciente?.nombre}?`)) {
                                    cambiarEstado(c.id, 'no-asistio');
                                  }
                                }}
                                title="El turno pasó y el paciente no asistió"
                              >
                                <UserX className="size-3.5 mr-1" />
                                No Asistió
                              </Button>
                            </>
                          )}

                          {c.estado === 'EN_ESPERA' && (
                            isRecepcion ? (
                              <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                                En sala de espera
                              </span>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 text-amber-600 hover:bg-amber-500/10 cursor-pointer"
                                onClick={() => cambiarEstado(c.id, 'iniciar-consulta')}
                                title="Hacer pasar al consultorio"
                              >
                                <Play className="size-3.5 mr-1" />
                                Iniciar
                              </Button>
                            )
                          )}

                          {c.estado === 'EN_CONSULTA' && (
                            isRecepcion ? (
                              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                                En consulta médica
                              </span>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                                onClick={() => cambiarEstado(c.id, 'finalizar')}
                                title="Finalizar y cerrar atención"
                              >
                                <CheckCircle className="size-3.5 mr-1" />
                                Finalizar
                              </Button>
                            )
                          )}

                          {!['ATENDIDA', 'CANCELADA', 'NO_ASISTIO'].includes(c.estado) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                              onClick={() => {
                                setCitaACancelar(c);
                                setMotivoCancelacion('Paciente solicitó cancelación');
                              }}
                              title="Cancelar turno (libera horario)"
                            >
                              <XCircle className="size-3.5 mr-1" />
                              Cancelar
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
                        {p.nombre} {p.apellido || ''} ({p.tipoDocumento || 'Doc'}: {p.documentoIdentidad || p.dni || 'S/D'})
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

      {/* MODAL CANCELACIÓN DE CITA */}
      {citaACancelar && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-md w-full shadow-2xl border-destructive/30">
            <div className="p-6 border-b border-border flex items-center justify-between bg-destructive/5">
              <div className="flex items-center gap-2.5 text-destructive">
                <AlertTriangle className="size-5 shrink-0" />
                <div>
                  <h3 className="text-base font-semibold text-foreground">Cancelar Cita Médica</h3>
                  <p className="text-xs text-muted-foreground">El horario quedará liberado en la agenda</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setCitaACancelar(null)}>
                <X className="size-5" />
              </Button>
            </div>

            <form onSubmit={handleConfirmarCancelacion}>
              <div className="p-6 space-y-4">
                <div className="p-3.5 rounded-lg bg-muted/40 border border-border text-xs space-y-1.5">
                  <div className="font-semibold text-foreground text-sm">
                    {citaACancelar.paciente?.nombre} {citaACancelar.paciente?.apellido || ''}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="size-3.5 text-primary" />
                    <span>{formatearFechaHora(citaACancelar.fechaHoraInicio)}</span>
                  </div>
                  <div className="text-muted-foreground">
                    Motivo programado: <span className="text-foreground">{citaACancelar.motivo}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Motivo de la Cancelación *
                  </label>
                  <Input
                    required
                    value={motivoCancelacion}
                    onChange={(e) => setMotivoCancelacion(e.target.value)}
                    placeholder="Ej. Paciente solicitó cancelación telefónica"
                  />
                  
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] text-muted-foreground">Motivos frecuentes:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Paciente solicitó cancelación',
                        'Reprogramará para otra fecha',
                        'Imprevisto personal / laboral',
                        'Problema de salud / internación',
                        'Error de agendamiento',
                      ].map((motivo) => (
                        <button
                          key={motivo}
                          type="button"
                          onClick={() => setMotivoCancelacion(motivo)}
                          className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                            motivoCancelacion === motivo
                              ? 'bg-destructive/15 text-destructive border-destructive/40 font-medium'
                              : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          {motivo}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCitaACancelar(null)}
                  disabled={cancelando}
                >
                  Regresar
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={cancelando}
                  className="cursor-pointer"
                >
                  {cancelando ? (
                    <>
                      <RefreshCw className="size-4 mr-2 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    <>
                      <XCircle className="size-4 mr-2" />
                      Confirmar Cancelación
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
