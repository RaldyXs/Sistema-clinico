import * as React from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Users,
  Palette,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  X,
  AlertCircle,
  Crown,
  Zap,
  Clock,
  Trash2,
} from 'lucide-react';

export function ConfiguracionView() {
  const { user } = useAuth();
  const [config, setConfig] = React.useState<any>(null);
  const [usuarios, setUsuarios] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [guardandoConfig, setGuardandoConfig] = React.useState(false);
  const [showModalCrearUsuario, setShowModalCrearUsuario] = React.useState(false);
  const [mensajeExito, setMensajeExito] = React.useState<string | null>(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = React.useState<any | null>(null);
  const [eliminandoUser, setEliminandoUser] = React.useState(false);

  // Suscripción SaaS & Cupos
  const [suscripcionInfo, setSuscripcionInfo] = React.useState<any>(null);
  const [planesDisponibles, setPlanesDisponibles] = React.useState<any[]>([]);
  const [showModalPlan, setShowModalPlan] = React.useState(false);
  const [planSeleccionado, setPlanSeleccionado] = React.useState('PROFESIONAL');
  const [cambiandoPlan, setCambiandoPlan] = React.useState(false);

  // Formulario nuevo usuario
  const [formUser, setFormUser] = React.useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    rolCodigo: 'MEDICO',
    especialidad: '',
    matriculaProfesional: '',
    telefono: '',
  });
  const [guardandoUser, setGuardandoUser] = React.useState(false);
  const [errorUser, setErrorUser] = React.useState<string | null>(null);

  const cargarDatos = React.useCallback(async () => {
    setLoading(true);
    try {
      const [cfg, users, sub, pls] = await Promise.all([
        api.get('/consultorios/configuracion'),
        api.get('/usuarios'),
        api.get('/saas/mi-suscripcion').catch(() => null),
        api.get('/saas/planes').catch(() => []),
      ]);
      setConfig(cfg);
      setUsuarios(Array.isArray(users) ? users : []);
      if (sub) {
        setSuscripcionInfo(sub);
        setPlanSeleccionado(sub.plan?.codigo || 'PROFESIONAL');
      }
      if (Array.isArray(pls)) {
        setPlanesDisponibles(pls);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleGuardarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoConfig(true);
    setMensajeExito(null);

    try {
      const updated = await api.patch('/consultorios/configuracion', {
        nombre: config.nombre,
        telefono: config.telefono,
        direccion: config.direccion,
        email: config.email,
        colorPrimario: config.colorPrimario,
        colorSecundario: config.colorSecundario,
        horarioAtencion: config.horarioAtencion,
        modulosActivos: config.modulosActivos,
      });
      setConfig(updated);
      setMensajeExito('Configuración y marca guardadas correctamente.');
    } catch (err: any) {
      alert(err.message || 'Error al guardar configuración');
    } finally {
      setGuardandoConfig(false);
    }
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoUser(true);
    setErrorUser(null);

    try {
      await api.post('/usuarios', formUser);
      setShowModalCrearUsuario(false);
      setFormUser({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        rolCodigo: 'MEDICO',
        especialidad: '',
        matriculaProfesional: '',
        telefono: '',
      });
      cargarDatos();
    } catch (err: any) {
      setErrorUser(err.message || 'Error al registrar usuario');
    } finally {
      setGuardandoUser(false);
    }
  };

  const cambiarEstadoUsuario = async (id: string, activo: boolean) => {
    try {
      await api.patch(`/usuarios/${id}/estado`, { activo });
      cargarDatos();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado');
    }
  };

  const handleEliminarUsuario = async () => {
    if (!usuarioAEliminar) return;
    setEliminandoUser(true);
    try {
      await api.delete(`/usuarios/${usuarioAEliminar.id}`);
      setMensajeExito(`Usuario ${usuarioAEliminar.nombre} ${usuarioAEliminar.apellido || ''} eliminado correctamente de la clínica.`);
      setUsuarioAEliminar(null);
      await cargarDatos();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar usuario');
    } finally {
      setEliminandoUser(false);
    }
  };

  const handleCambiarPlan = async () => {
    setCambiandoPlan(true);
    try {
      await api.post('/saas/cambiar-plan', {
        planCodigo: planSeleccionado,
        periodo: 'MENSUAL',
      });
      setShowModalPlan(false);
      setMensajeExito(`¡Plan de la clínica actualizado exitosamente a ${planSeleccionado}!`);
      await cargarDatos();
    } catch (err: any) {
      alert(err.message || 'Error al modificar plan');
    } finally {
      setCambiandoPlan(false);
    }
  };

  if (loading && !config) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
        Cargando configuración institucional...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="size-6 text-primary" />
          Configuración y Administración de la Clínica
        </h1>
        <p className="text-sm text-muted-foreground">
          Identidad de marca, horarios de atención, personal asistencial y módulos activos
        </p>
      </div>

      {mensajeExito && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* TARJETA DE PLAN Y SUSCRIPCIÓN SAAS DE LA CLÍNICA */}
      {suscripcionInfo && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-card to-card shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/60 pb-4 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Crown className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold">
                    {suscripcionInfo.plan?.nombre || 'Plan Activo'}
                  </CardTitle>
                  <Badge
                    variant={suscripcionInfo.suscripcion?.estado === 'ACTIVA' ? 'default' : 'secondary'}
                    className="text-[10px] font-semibold"
                  >
                    {suscripcionInfo.suscripcion?.estado === 'PRUEBA'
                      ? 'Prueba Gratuita (14 días)'
                      : 'Suscripción Activa'}
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-0.5 flex items-center gap-2">
                  <span>Facturación {suscripcionInfo.suscripcion?.periodo === 'ANUAL' ? 'Anual' : 'Mensual'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3 text-muted-foreground" />
                    {suscripcionInfo.suscripcion?.diasRestantes} días restantes en el ciclo actual
                  </span>
                </CardDescription>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setShowModalPlan(true)}
              className="gap-1.5 shrink-0 shadow-xs"
            >
              <Zap className="size-3.5" /> Cambiar / Mejorar Plan
            </Button>
          </CardHeader>

          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Medidor de Médicos */}
            <div className="p-3 rounded-lg border border-border/80 bg-background/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                  <Users className="size-3.5 text-primary" /> Capacidad de Usuarios (Médicos y Personal)
                </span>
                <span className="font-semibold text-foreground">
                  {suscripcionInfo.consumo?.usuarios?.actual ?? suscripcionInfo.consumo?.medicos?.actual ?? 0} / {suscripcionInfo.consumo?.usuarios?.maximo ?? suscripcionInfo.consumo?.medicos?.maximo ?? 0} colaboradores
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    ((suscripcionInfo.consumo?.usuarios?.porcentaje ?? suscripcionInfo.consumo?.medicos?.porcentaje ?? 0) >= 90)
                      ? 'bg-destructive'
                      : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(100, suscripcionInfo.consumo?.usuarios?.porcentaje ?? suscripcionInfo.consumo?.medicos?.porcentaje ?? 0)}%` }}
                />
              </div>
              <div className="text-[11px] text-muted-foreground text-right">
                {suscripcionInfo.consumo?.usuarios?.porcentaje ?? suscripcionInfo.consumo?.medicos?.porcentaje ?? 0}% de cupo utilizado
              </div>
            </div>

            {/* Medidor de Pacientes */}
            <div className="p-3 rounded-lg border border-border/80 bg-background/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                  <Users className="size-3.5 text-emerald-500" /> Capacidad de Pacientes
                </span>
                <span className="font-semibold text-foreground">
                  {suscripcionInfo.consumo?.pacientes?.actual ?? 0} / {suscripcionInfo.consumo?.pacientes?.maximo ?? 0} expedientes
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    (suscripcionInfo.consumo?.pacientes?.porcentaje ?? 0) >= 90
                      ? 'bg-destructive'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, suscripcionInfo.consumo?.pacientes?.porcentaje ?? 0)}%` }}
                />
              </div>
              <div className="text-[11px] text-muted-foreground text-right">
                {suscripcionInfo.consumo?.pacientes?.porcentaje ?? 0}% de cupo utilizado
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BRANDING Y AJUSTES DE CONSULTORIO */}
        <Card>
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="size-4 text-primary" />
              Identidad de Marca y Horarios
            </CardTitle>
            <CardDescription>Colores corporativos y datos institucionales</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleGuardarConfig} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Nombre del Consultorio</label>
                <Input
                  value={config?.nombre || ''}
                  onChange={(e) => setConfig({ ...config, nombre: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Teléfono</label>
                  <Input
                    value={config?.telefono || ''}
                    onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Email de Contacto</label>
                  <Input
                    type="email"
                    value={config?.email || ''}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Dirección Física</label>
                <Input
                  value={config?.direccion || ''}
                  onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                />
              </div>

              {/* Colores corporativos */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Color Primario</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="size-8 rounded border border-border cursor-pointer"
                      value={config?.colorPrimario || '#0284c7'}
                      onChange={(e) => setConfig({ ...config, colorPrimario: e.target.value })}
                    />
                    <Input
                      className="font-mono text-xs"
                      value={config?.colorPrimario || '#0284c7'}
                      onChange={(e) => setConfig({ ...config, colorPrimario: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Color Secundario</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="size-8 rounded border border-border cursor-pointer"
                      value={config?.colorSecundario || '#0f172a'}
                      onChange={(e) => setConfig({ ...config, colorSecundario: e.target.value })}
                    />
                    <Input
                      className="font-mono text-xs"
                      value={config?.colorSecundario || '#0f172a'}
                      onChange={(e) => setConfig({ ...config, colorSecundario: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={guardandoConfig} className="w-full mt-2">
                {guardandoConfig ? 'Guardando...' : 'Guardar Cambios de Consultorio'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* NÓMINA DE USUARIOS Y PERSONAL MÉDICO */}
        <Card>
          <CardHeader className="border-b border-border/60 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="size-4 text-emerald-500" />
                Personal y Médicos de la Clínica
              </CardTitle>
              <CardDescription>Gestión de usuarios y accesos autorizados</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowModalCrearUsuario(true)}>
              <UserPlus className="size-3.5 mr-1" />
              Nuevo Miembro
            </Button>
          </CardHeader>
          <CardContent className="pt-6 p-0">
            <div className="divide-y divide-border">
              {usuarios.map((u) => (
                <div key={u.id} className="p-4 flex items-center justify-between gap-3 text-sm">
                  <div>
                    <div className="font-semibold text-foreground">
                      {u.nombre} {u.apellido || ''}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {u.email} • {u.especialidad || u.rolCodigo}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={u.activo ? 'default' : 'secondary'}>
                      {u.activo ? 'Activo' : 'Suspendido'}
                    </Badge>
                    {u.id === user?.id ? (
                      <Badge variant="outline" className="text-[10px] border-primary/40 text-primary py-0.5">
                        Tú (Sesión actual)
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => cambiarEstadoUsuario(u.id, !u.activo)}
                        >
                          {u.activo ? 'Suspender' : 'Activar'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-destructive hover:bg-destructive/10 hover:text-destructive px-2"
                          title="Eliminar usuario"
                          onClick={() => setUsuarioAEliminar(u)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MODAL CREAR USUARIO */}
      {showModalCrearUsuario && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-md w-full shadow-2xl border-border">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Dar de Alta Miembro de Equipo</h3>
                <p className="text-xs text-muted-foreground">
                  Registrar médico, recepcionista o administrador
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowModalCrearUsuario(false)}>
                <X className="size-5" />
              </Button>
            </div>

            <form onSubmit={handleCrearUsuario}>
              <div className="p-6 space-y-3">
                {errorUser && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{errorUser}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Nombre *</label>
                    <Input
                      required
                      value={formUser.nombre}
                      onChange={(e) => setFormUser({ ...formUser, nombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Apellido</label>
                    <Input
                      value={formUser.apellido}
                      onChange={(e) => setFormUser({ ...formUser, apellido: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Email *</label>
                  <Input
                    type="email"
                    required
                    value={formUser.email}
                    onChange={(e) => setFormUser({ ...formUser, email: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Contraseña *</label>
                  <Input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={formUser.password}
                    onChange={(e) => setFormUser({ ...formUser, password: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Rol</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus:border-primary"
                      value={formUser.rolCodigo}
                      onChange={(e) => setFormUser({ ...formUser, rolCodigo: e.target.value })}
                    >
                      <option value="MEDICO">Médico / Especialista</option>
                      <option value="RECEPCION">Recepción / Asistente</option>
                      {!usuarios.some((u) => u.rolCodigo === 'ADMIN' && u.activo) && (
                        <option value="ADMIN">Administrador</option>
                      )}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Especialidad</label>
                    <Input
                      placeholder="Ej. Ginecología"
                      value={formUser.especialidad}
                      onChange={(e) => setFormUser({ ...formUser, especialidad: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Matrícula Profesional</label>
                  <Input
                    placeholder="Ej. MP-123456"
                    value={formUser.matriculaProfesional}
                    onChange={(e) => setFormUser({ ...formUser, matriculaProfesional: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-4 border-t border-border flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowModalCrearUsuario(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardandoUser}>
                  {guardandoUser ? 'Guardando...' : 'Crear Usuario'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal Cambiar Plan */}
      {showModalPlan && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="max-w-2xl w-full shadow-2xl border-border animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="size-5 text-primary" /> Cambiar o Mejorar Plan de la Clínica
                </CardTitle>
                <CardDescription>
                  Actualiza tu suscripción para ampliar la capacidad de médicos, pacientes y funcionalidades
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowModalPlan(false)}>
                <X className="size-4" />
              </Button>
            </CardHeader>

            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {planesDisponibles.map((p) => {
                  const seleccionado = planSeleccionado === p.codigo;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setPlanSeleccionado(p.codigo)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        seleccionado
                          ? 'border-primary bg-primary/5 shadow-xs'
                          : 'border-border hover:border-border/80 hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm">{p.nombre}</span>
                        {p.destacado && (
                          <Badge variant="default" className="text-[9px] py-0">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <div className="text-xl font-bold text-primary mt-1">
                        ${p.precioMensual}
                        <span className="text-xs font-normal text-muted-foreground">/mes</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">
                        {p.descripcion}
                      </p>
                      <div className="mt-3 pt-3 border-t border-border/60 text-[11px] space-y-1 text-muted-foreground">
                        <div>👨‍⚕️ Hasta {p.maxMedicos} médicos</div>
                        <div>👥 Hasta {p.maxPacientes.toLocaleString()} pacientes</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 border-t border-border flex items-center justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowModalPlan(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCambiarPlan} disabled={cambiandoPlan}>
                  {cambiandoPlan ? 'Actualizando...' : 'Confirmar Cambio de Plan'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN DE USUARIO */}
      {usuarioAEliminar && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-2xl border-destructive/30">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-destructive flex items-center gap-2">
                  <Trash2 className="size-5" />
                  Confirmar Eliminación de Colaborador
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => setUsuarioAEliminar(null)}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <CardDescription>
                Esta acción removerá el acceso de forma inmediata.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-xs space-y-2 text-foreground">
                <p>
                  ¿Estás seguro de que deseas eliminar a{' '}
                  <strong className="text-destructive font-semibold">
                    {usuarioAEliminar.nombre} {usuarioAEliminar.apellido || ''}
                  </strong>{' '}
                  ({usuarioAEliminar.email})?
                </p>
                <p className="text-muted-foreground text-[11px]">
                  • Se revocarán todas sus sesiones activas en cualquier dispositivo.<br />
                  • Su correo quedará liberado para futuros registros.<br />
                  • Por normativa médico-legal, su historial clínico y recetas previas se mantendrán preservados.<br />
                  • La eliminación quedará auditada y registrada en el historial del consultorio.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setUsuarioAEliminar(null)}
                  disabled={eliminandoUser}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleEliminarUsuario}
                  disabled={eliminandoUser}
                >
                  {eliminandoUser ? 'Eliminando...' : 'Eliminar Definitivamente'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
