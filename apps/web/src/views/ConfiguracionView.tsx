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
  Building2,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  X,
  AlertCircle,
  Crown,
  Zap,
  Clock,
  Trash2,
  Pencil,
} from 'lucide-react';

export function ConfiguracionView() {
  const { user, actualizarPerfilLocal } = useAuth();
  const isAdmin = user?.rolCodigo === 'ADMIN' || user?.rolCodigo === 'SUPERADMIN';

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
  const [periodoSeleccionado, setPeriodoSeleccionado] = React.useState<'MENSUAL' | 'ANUAL'>('MENSUAL');
  const [solicitudPendiente, setSolicitudPendiente] = React.useState<any | null>(null);
  const [formTransferencia, setFormTransferencia] = React.useState({
    referencia: '',
    bancoOrigen: '',
    notas: '',
  });
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

  // Modal y formulario para editar usuario existente
  const [usuarioAEditar, setUsuarioAEditar] = React.useState<any | null>(null);
  const [showModalEditarUsuario, setShowModalEditarUsuario] = React.useState(false);
  const [formEditarUser, setFormEditarUser] = React.useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    especialidad: '',
    matriculaProfesional: '',
    rolCodigo: 'MEDICO',
    firmaDigitalUrl: '',
    password: '',
  });
  const [guardandoEditarUser, setGuardandoEditarUser] = React.useState(false);
  const [errorEditarUser, setErrorEditarUser] = React.useState<string | null>(null);

  const cargarDatos = React.useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [cfg, users, sub, pls, solPend] = await Promise.all([
        api.get('/consultorios/configuracion').catch(() => null),
        api.get('/usuarios').catch(() => []),
        api.get('/saas/mi-suscripcion').catch(() => null),
        api.get('/saas/planes').catch(() => []),
        api.get('/saas/mi-solicitud-pendiente').catch(() => null),
      ]);
      if (cfg) {
        cfg.modulosActivos = {
          general: true,
          citas: true,
          pacientes: true,
          caja: true,
          recetas: true,
          ginecologia: true,
          reportes: true,
          documentos: true,
          auditoria: true,
          ...(cfg.modulosActivos || {}),
        };
      }
      setConfig(cfg);
      setUsuarios(Array.isArray(users) ? users : []);
      if (sub) {
        setSuscripcionInfo(sub);
      }
      if (Array.isArray(pls)) {
        setPlanesDisponibles(pls);
        // Preseleccionar un plan diferente al actual de la clínica
        const planActual = sub?.plan?.codigo;
        const otro = pls.find((p: any) => p.codigo !== planActual);
        if (otro) {
          setPlanSeleccionado(otro.codigo);
        }
      }
      setSolicitudPendiente(solPend?.id ? solPend : null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const abrirModalPlan = () => {
    const planActual = suscripcionInfo?.plan?.codigo;
    if (!planSeleccionado || planSeleccionado === planActual) {
      const otro = planesDisponibles.find((p: any) => p.codigo !== planActual);
      if (otro) {
        setPlanSeleccionado(otro.codigo);
      }
    }
    setShowModalPlan(true);
  };

  React.useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleGuardarConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setGuardandoConfig(true);
    setMensajeExito(null);

    try {
      const updated = await api.patch('/consultorios/configuracion', {
        nombre: config.nombre,
        telefono: config.telefono,
        direccion: config.direccion,
        email: config.email,
        colorPrimario: config.colorPrimario || '#0284c7',
        colorSecundario: config.colorSecundario || '#0f172a',
        horarioAtencion: config.horarioAtencion,
        modulosActivos: config.modulosActivos,
      });
      setConfig(updated);
      if (user?.consultorio) {
        actualizarPerfilLocal({
          consultorio: {
            ...user.consultorio,
            nombre: updated.nombre,
            modulosActivos: updated.modulosActivos,
          },
        });
      }
      setMensajeExito('Información institucional de la clínica guardada correctamente.');
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

  const abrirModalEditar = (u: any) => {
    setUsuarioAEditar(u);
    setErrorEditarUser(null);
    setFormEditarUser({
      nombre: u.nombre || '',
      apellido: u.apellido || '',
      email: u.email || '',
      telefono: u.telefono || '',
      especialidad: u.especialidad || '',
      matriculaProfesional: u.matriculaProfesional || '',
      rolCodigo: u.rolCodigo || 'MEDICO',
      firmaDigitalUrl: u.firmaDigitalUrl || '',
      password: '',
    });
    setShowModalEditarUsuario(true);
  };

  const handleGuardarEdicionUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioAEditar) return;
    setGuardandoEditarUser(true);
    setErrorEditarUser(null);

    try {
      const payload: any = {
        nombre: formEditarUser.nombre.trim(),
        apellido: formEditarUser.apellido ? formEditarUser.apellido.trim() : null,
        telefono: formEditarUser.telefono ? formEditarUser.telefono.trim() : null,
        especialidad: formEditarUser.especialidad ? formEditarUser.especialidad.trim() : null,
        matriculaProfesional: formEditarUser.matriculaProfesional ? formEditarUser.matriculaProfesional.trim() : null,
        firmaDigitalUrl: formEditarUser.firmaDigitalUrl ? formEditarUser.firmaDigitalUrl : null,
        rolCodigo: formEditarUser.rolCodigo,
      };

      if (formEditarUser.password?.trim()) {
        payload.password = formEditarUser.password.trim();
      }

      await api.patch(`/usuarios/${usuarioAEditar.id}`, payload);
      setShowModalEditarUsuario(false);
      setUsuarioAEditar(null);
      setMensajeExito(`Datos del colaborador "${formEditarUser.nombre}" actualizados correctamente.`);
      await cargarDatos();
    } catch (err: any) {
      setErrorEditarUser(err.message || 'Error al actualizar información del colaborador.');
    } finally {
      setGuardandoEditarUser(false);
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

  const handleSolicitarPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTransferencia.referencia.trim()) {
      alert('Por favor ingresa el número de comprobante o referencia de tu transferencia bancaria.');
      return;
    }
    if (planSeleccionado === suscripcionInfo?.plan?.codigo) {
      alert('Tu clínica ya tiene activo este plan. Por favor selecciona un plan diferente para cambiar o mejorar.');
      return;
    }
    setCambiandoPlan(true);
    try {
      await api.post('/saas/solicitar-plan', {
        planCodigo: planSeleccionado,
        periodo: periodoSeleccionado,
        referenciaTransferencia: formTransferencia.referencia.trim(),
        bancoOrigen: formTransferencia.bancoOrigen.trim() || undefined,
        notas: formTransferencia.notas.trim() || undefined,
      });
      setShowModalPlan(false);
      setFormTransferencia({ referencia: '', bancoOrigen: '', notas: '' });
      setMensajeExito('¡Solicitud enviada exitosamente! El Administrador verificará la transferencia y activará tu plan.');
      await cargarDatos();
    } catch (err: any) {
      alert(err.message || 'Error al solicitar cambio de plan');
    } finally {
      setCambiandoPlan(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-12 max-w-lg mx-auto text-center space-y-4">
        <div className="size-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="size-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Acceso Restringido</h2>
        <p className="text-sm text-muted-foreground">
          La administración de la clínica, la gestión de usuarios y la configuración de planes están reservadas exclusivamente para el Administrador de la clínica o SuperAdmin.
        </p>
      </div>
    );
  }

  if (loading && !config) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
        Cargando configuración institucional...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-1.5">
            <Settings className="size-4 text-primary" />
            Configuración y Administración de la Clínica
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Datos institucionales, equipo de trabajo y capacidad de tu suscripción
          </p>
        </div>
      </div>

      {mensajeExito && (
        <div className="p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="size-3.5 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Alerta de Solicitud de Plan / Transferencia Bancaria en Revisión */}
      {solicitudPendiente?.id && (
        <div className="p-2 px-2.5 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0 truncate text-[11px]">
              <span className="font-semibold">
                Cambio a {solicitudPendiente.plan?.nombre?.toLowerCase().startsWith('plan') ? solicitudPendiente.plan?.nombre : `Plan ${solicitudPendiente.plan?.nombre || 'Nuevo'}`} en Verificación:
              </span>{' '}
              <span className="text-muted-foreground">
                Ref <span className="font-mono font-bold text-foreground">#{solicitudPendiente.referenciaTransferencia}</span> (${solicitudPendiente.monto} {solicitudPendiente.periodo}). Se activará tras confirmación bancaria.
              </span>
            </div>
          </div>
          <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-amber-500/50 text-amber-700 dark:text-amber-300 bg-amber-500/20 font-semibold shrink-0">
            Pendiente Aprobación
          </Badge>
        </div>
      )}

      {/* TARJETA DE PLAN Y SUSCRIPCIÓN SAAS DE LA CLÍNICA (BARRA HORIZONTAL COMPACTA) */}
      {suscripcionInfo && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-card to-card shadow-xs overflow-hidden">
          <div className="py-2 px-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            {/* Info izquierda */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                <Crown className="size-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-foreground">{suscripcionInfo.plan?.nombre || 'Plan Activo'}</span>
                  <Badge
                    variant={suscripcionInfo.suscripcion?.estado === 'ACTIVA' ? 'default' : 'secondary'}
                    className="text-[8.5px] py-0 px-1 font-semibold"
                  >
                    {suscripcionInfo.suscripcion?.estado === 'PRUEBA'
                      ? 'Prueba (14 d)'
                      : 'Activa'}
                  </Badge>
                </div>
                <div className="text-[9.5px] text-muted-foreground flex items-center gap-1 leading-none mt-0.5">
                  <span>Fact. {suscripcionInfo.suscripcion?.periodo === 'ANUAL' ? 'Anual' : 'Mensual'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="size-2 text-muted-foreground" />
                    {suscripcionInfo.suscripcion?.diasRestantes} días rest.
                  </span>
                </div>
              </div>
            </div>

            {/* Medidores de consumo inline */}
            <div className="flex-1 grid grid-cols-2 gap-3 max-w-lg">
              <div className="space-y-0.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="size-2.5 text-primary" /> Capacidad Usuarios
                  </span>
                  <span className="font-semibold text-[10px]">
                    {suscripcionInfo.consumo?.usuarios?.actual ?? suscripcionInfo.consumo?.medicos?.actual ?? 0} / {suscripcionInfo.consumo?.usuarios?.maximo ?? suscripcionInfo.consumo?.medicos?.maximo ?? 0}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      ((suscripcionInfo.consumo?.usuarios?.porcentaje ?? suscripcionInfo.consumo?.medicos?.porcentaje ?? 0) >= 90)
                        ? 'bg-destructive'
                        : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(100, suscripcionInfo.consumo?.usuarios?.porcentaje ?? suscripcionInfo.consumo?.medicos?.porcentaje ?? 0)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="size-2.5 text-emerald-500" /> Capacidad Pacientes
                  </span>
                  <span className="font-semibold text-[10px]">
                    {suscripcionInfo.consumo?.pacientes?.actual ?? 0} / {suscripcionInfo.consumo?.pacientes?.maximo ?? 0}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      (suscripcionInfo.consumo?.pacientes?.porcentaje ?? 0) >= 90
                        ? 'bg-destructive'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, suscripcionInfo.consumo?.pacientes?.porcentaje ?? 0)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Botón cambiar plan */}
            <Button
              size="sm"
              onClick={abrirModalPlan}
              className="gap-1 shrink-0 shadow-xs h-6.5 text-[11px] px-2"
            >
              <Zap className="size-2.5" /> Cambiar Plan
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* DATOS DE LA CLÍNICA Y MEMBRETE OFICIAL */}
        <Card className="shadow-xs">
          <CardHeader className="border-b border-border/60 py-2 px-3">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <Building2 className="size-3.5 text-primary" />
              Datos de la Clínica & Membrete Oficial
            </CardTitle>
            <CardDescription className="text-[10px]">Información institucional para recetas médicas y recibos de cobro</CardDescription>
          </CardHeader>
          <CardContent className="p-2.5 pt-2">
            <form onSubmit={handleGuardarConfig} className="space-y-2.5">
              <div className="space-y-0.5">
                <label className="text-[10px] font-semibold text-muted-foreground">Nombre de la Clínica / Centro Médico</label>
                <Input
                  className="h-7 text-xs"
                  placeholder="Ej. Clínica Médica San Lucas"
                  value={config?.nombre || ''}
                  onChange={(e) => setConfig({ ...config, nombre: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[10px] font-semibold text-muted-foreground">Teléfono / WhatsApp de Citas</label>
                  <Input
                    className="h-7 text-xs"
                    placeholder="+1 (809) 555-0199"
                    value={config?.telefono || ''}
                    onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[10px] font-semibold text-muted-foreground">Email de Contacto Público (Membrete)</label>
                  <Input
                    type="email"
                    className="h-7 text-xs"
                    placeholder="contacto@clinica.com"
                    value={config?.email || ''}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  />
                  <p className="text-[9px] text-muted-foreground/80 leading-tight">
                    Aparece impreso en recetas y facturas. No altera tu usuario de acceso.
                  </p>
                </div>
              </div>

              <div className="space-y-0.5">
                <label className="text-[10px] font-semibold text-muted-foreground">Dirección Física (Pie de Recetas y Facturas)</label>
                <Input
                  className="h-7 text-xs"
                  placeholder="Av. Salud #100, Ensanche Naco"
                  value={config?.direccion || ''}
                  onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                />
              </div>

              <Button type="submit" disabled={guardandoConfig} className="w-full mt-2 h-7 text-xs font-semibold cursor-pointer">
                {guardandoConfig ? 'Guardando...' : 'Guardar Información de la Clínica'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* NÓMINA DE USUARIOS Y PERSONAL MÉDICO */}
        <Card className="shadow-xs flex flex-col">
          <CardHeader className="border-b border-border/60 py-2 px-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs flex items-center gap-1.5">
                <Users className="size-3.5 text-emerald-500" />
                Personal y Médicos de la Clínica
              </CardTitle>
              <CardDescription className="text-[10px]">Gestión de usuarios y accesos autorizados</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowModalCrearUsuario(true)} className="h-6.5 text-[11px] px-2">
              <UserPlus className="size-2.5 mr-1" />
              Nuevo Miembro
            </Button>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="divide-y divide-border max-h-[220px] overflow-y-auto">
              {usuarios.map((u) => (
                <div key={u.id} className="py-1.5 px-3 flex items-center justify-between gap-2 text-xs hover:bg-muted/25 transition-colors">
                  <div className="min-w-0 pr-1">
                    <div className="font-semibold text-foreground truncate text-[11px]">
                      {u.nombre} {u.apellido || ''}
                    </div>
                    <div className="text-[9.5px] text-muted-foreground truncate">
                      {u.email} • {u.especialidad || u.rolCodigo}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant={u.activo ? 'default' : 'secondary'} className="text-[8.5px] py-0 px-1">
                      {u.activo ? 'Activo' : 'Suspendido'}
                    </Badge>
                    {u.id === user?.id && (
                      <Badge variant="outline" className="text-[8.5px] border-primary/40 text-primary py-0 px-1">
                        Tú
                      </Badge>
                    )}
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[9.5px] h-5.5 gap-0.5 px-1.5"
                        title="Editar datos del colaborador"
                        onClick={() => abrirModalEditar(u)}
                      >
                        <Pencil className="size-2" />
                        Editar
                      </Button>
                      {u.id !== user?.id && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[9.5px] h-5.5 px-1.5"
                            onClick={() => cambiarEstadoUsuario(u.id, !u.activo)}
                          >
                            {u.activo ? 'Suspender' : 'Activar'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[9.5px] h-5.5 text-destructive hover:bg-destructive/10 hover:text-destructive px-1"
                            title="Eliminar usuario"
                            onClick={() => setUsuarioAEliminar(u)}
                          >
                            <Trash2 className="size-2.5" />
                          </Button>
                        </>
                      )}
                    </div>
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

      {/* MODAL EDITAR COLABORADOR */}
      {showModalEditarUsuario && usuarioAEditar && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-md w-full shadow-2xl border-border">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Pencil className="size-4 text-primary" />
                  Editar Datos del Colaborador
                </h3>
                <p className="text-xs text-muted-foreground">
                  Actualiza información profesional, de contacto o credenciales
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowModalEditarUsuario(false);
                  setUsuarioAEditar(null);
                }}
              >
                <X className="size-5" />
              </Button>
            </div>

            <form onSubmit={handleGuardarEdicionUsuario}>
              <div className="p-6 space-y-3">
                {errorEditarUser && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{errorEditarUser}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Nombre *</label>
                    <Input
                      required
                      value={formEditarUser.nombre}
                      onChange={(e) => setFormEditarUser({ ...formEditarUser, nombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Apellido</label>
                    <Input
                      value={formEditarUser.apellido}
                      onChange={(e) => setFormEditarUser({ ...formEditarUser, apellido: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground">Email Institucional</label>
                    <span className="text-[10px] text-muted-foreground">Credencial única</span>
                  </div>
                  <Input
                    type="email"
                    disabled
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                    value={formEditarUser.email}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Teléfono</label>
                    <Input
                      placeholder="Ej. 809-555-0123"
                      value={formEditarUser.telefono}
                      onChange={(e) => setFormEditarUser({ ...formEditarUser, telefono: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Rol en la Clínica</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus:border-primary"
                      value={formEditarUser.rolCodigo}
                      onChange={(e) => setFormEditarUser({ ...formEditarUser, rolCodigo: e.target.value })}
                    >
                      <option value="MEDICO">Médico / Especialista</option>
                      <option value="RECEPCION">Recepción / Asistente</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Especialidad</label>
                    <Input
                      placeholder="Ej. Ginecología, Pediatría"
                      value={formEditarUser.especialidad}
                      onChange={(e) => setFormEditarUser({ ...formEditarUser, especialidad: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Matrícula Profesional</label>
                    <Input
                      placeholder="Ej. MP-123456"
                      value={formEditarUser.matriculaProfesional}
                      onChange={(e) => setFormEditarUser({ ...formEditarUser, matriculaProfesional: e.target.value })}
                    />
                  </div>
                </div>

                {formEditarUser.rolCodigo === 'MEDICO' && (
                  <div className="space-y-2 p-3 rounded-lg bg-muted/40 border border-border">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Firma / Sello Digital del Médico (Para Recetas PDF)
                      </label>
                      {formEditarUser.firmaDigitalUrl && (
                        <button
                          type="button"
                          onClick={() => setFormEditarUser({ ...formEditarUser, firmaDigitalUrl: '' })}
                          className="text-[11px] text-destructive hover:underline cursor-pointer"
                        >
                          Remover firma
                        </button>
                      )}
                    </div>
                    {formEditarUser.firmaDigitalUrl ? (
                      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded border border-border">
                        <img
                          src={formEditarUser.firmaDigitalUrl}
                          alt="Firma"
                          className="h-10 max-w-[140px] object-contain"
                        />
                        <span className="text-xs text-emerald-600 font-medium">✓ Firma activa cargada</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic">Sin firma digital asignada</p>
                    )}
                    <label className="inline-flex items-center gap-1.5 text-xs text-primary font-medium cursor-pointer hover:underline pt-1">
                      <span>📁 Cargar imagen PNG/JPG de firma</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setFormEditarUser((prev) => ({
                              ...prev,
                              firmaDigitalUrl: ev.target?.result as string,
                            }));
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  </div>
                )}

                <div className="space-y-1 pt-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Actualizar Contraseña <span className="text-[10px] font-normal text-muted-foreground">(Opcional)</span>
                  </label>
                  <Input
                    type="password"
                    placeholder="Dejar en blanco para mantener la actual"
                    value={formEditarUser.password}
                    onChange={(e) => setFormEditarUser({ ...formEditarUser, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-4 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModalEditarUsuario(false);
                    setUsuarioAEditar(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardandoEditarUser}>
                  {guardandoEditarUser ? 'Guardando Cambios...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal Cambiar / Solicitar Plan con Transferencia Bancaria */}
      {showModalPlan && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="max-w-2xl w-full shadow-2xl border-border animate-in fade-in zoom-in-95 duration-150 my-8">
            <CardHeader className="border-b border-border flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="size-5 text-primary" /> Cambiar o Mejorar Plan de la Clínica
                </CardTitle>
                <CardDescription className="text-xs">
                  Selecciona tu plan, realiza la transferencia bancaria y registra el comprobante para su activación inmediata.
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowModalPlan(false)}>
                <X className="size-4" />
              </Button>
            </CardHeader>

            <form onSubmit={handleSolicitarPlan}>
              <CardContent className="pt-5 space-y-5">
                {/* 1. Selector de Periodicidad */}
                <div className="flex items-center justify-between bg-muted/40 p-2.5 rounded-xl border border-border text-xs">
                  <span className="font-semibold text-foreground">Ciclo de Facturación:</span>
                  <div className="flex items-center gap-1.5 bg-background p-1 rounded-lg border border-border">
                    <button
                      type="button"
                      onClick={() => setPeriodoSeleccionado('MENSUAL')}
                      className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        periodoSeleccionado === 'MENSUAL'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Mensual
                    </button>
                    <button
                      type="button"
                      onClick={() => setPeriodoSeleccionado('ANUAL')}
                      className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                        periodoSeleccionado === 'ANUAL'
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Anual <Badge className="text-[9px] py-0 px-1 bg-emerald-500 text-white">Ahorra 15%</Badge>
                    </button>
                  </div>
                </div>

                {/* 2. Planes Comerciales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {planesDisponibles.map((p) => {
                    const esPlanActual = suscripcionInfo?.plan?.codigo === p.codigo;
                    const seleccionado = planSeleccionado === p.codigo;
                    const precio = periodoSeleccionado === 'ANUAL' ? p.precioAnual : p.precioMensual;
                    return (
                      <div
                        key={p.id}
                        onClick={esPlanActual ? undefined : () => setPlanSeleccionado(p.codigo)}
                        className={`p-3.5 rounded-xl border-2 transition-all relative select-none ${
                          esPlanActual
                            ? 'border-border/60 bg-muted/40 opacity-75 cursor-not-allowed'
                            : seleccionado
                            ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/40 cursor-pointer'
                            : 'border-border hover:border-border/80 hover:bg-muted/30 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm">{p.nombre}</span>
                          {esPlanActual ? (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-primary/15 text-primary border-primary/25 font-semibold">
                              ✓ Plan Actual
                            </Badge>
                          ) : p.destacado ? (
                            <Badge variant="default" className="text-[9px] py-0">
                              Popular
                            </Badge>
                          ) : null}
                        </div>
                        <div className="text-xl font-bold text-primary mt-1">
                          ${precio}
                          <span className="text-xs font-normal text-muted-foreground">
                            /{periodoSeleccionado === 'ANUAL' ? 'año' : 'mes'}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                          {p.descripcion}
                        </p>
                        <div className="mt-2.5 pt-2.5 border-t border-border/60 text-[11px] space-y-1 text-muted-foreground">
                          <div>👨‍⚕️ Hasta {p.maxMedicos} médicos</div>
                          <div>👥 Hasta {p.maxPacientes.toLocaleString()} pacientes</div>
                        </div>
                        {esPlanActual && (
                          <div className="mt-2 pt-1.5 border-t border-border/40 text-[10px] font-medium text-center text-muted-foreground bg-muted/30 rounded">
                            Tu clínica ya cuenta con este plan
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 3. Datos de Transferencia Bancaria Oficial */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2 text-xs">
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-primary">
                      🏦 Datos de la Cuenta para Transferencia Bancaria
                    </span>
                    <span className="font-bold text-foreground">
                      Monto a transferir: $
                      {(() => {
                        const p = planesDisponibles.find((x) => x.codigo === planSeleccionado);
                        if (!p) return 0;
                        return periodoSeleccionado === 'ANUAL' ? p.precioAnual : p.precioMensual;
                      })()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-background/80 p-2.5 rounded-lg border border-border/80">
                    <div>
                      <span className="text-muted-foreground">Banco Destino:</span>{' '}
                      <span className="font-bold text-foreground">Banco Popular Dominicano</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tipo de Cuenta:</span>{' '}
                      <span className="font-bold text-foreground">Cuenta Corriente</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Número de Cuenta:</span>{' '}
                      <span className="font-mono font-bold text-foreground">001-8492048-1</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Beneficiario / Titular:</span>{' '}
                      <span className="font-bold text-foreground">Sistema Clínico SaaS S.R.L.</span>
                    </div>
                  </div>
                </div>

                {/* 4. Formulario de Registro de Comprobante */}
                <div className="space-y-3 pt-1 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">
                        Nº de Comprobante / Referencia Bancaria <span className="text-destructive">*</span>
                      </label>
                      <Input
                        placeholder="Ej: 94820194 o REF-4029"
                        value={formTransferencia.referencia}
                        onChange={(e) =>
                          setFormTransferencia({ ...formTransferencia, referencia: e.target.value })
                        }
                        required
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground">
                        Banco Emisor <span className="text-[10px] font-normal">(Opcional)</span>
                      </label>
                      <Input
                        placeholder="Ej: Banreservas, BHD, Zelle"
                        value={formTransferencia.bancoOrigen}
                        onChange={(e) =>
                          setFormTransferencia({ ...formTransferencia, bancoOrigen: e.target.value })
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">
                      Notas o Comentarios Adicionales <span className="text-[10px] font-normal">(Opcional)</span>
                    </label>
                    <Input
                      placeholder="Información adicional sobre el pago..."
                      value={formTransferencia.notas}
                      onChange={(e) =>
                        setFormTransferencia({ ...formTransferencia, notas: e.target.value })
                      }
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {planSeleccionado === suscripcionInfo?.plan?.codigo && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>
                      Tu clínica ya tiene activo el plan <strong>{suscripcionInfo?.plan?.nombre}</strong>. Selecciona un plan diferente para cambiar o mejorar.
                    </span>
                  </div>
                )}
              </CardContent>

              <div className="p-4 border-t border-border flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowModalPlan(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    cambiandoPlan ||
                    planSeleccionado === suscripcionInfo?.plan?.codigo ||
                    !formTransferencia.referencia.trim()
                  }
                  className="gap-2 font-semibold"
                >
                  {cambiandoPlan ? 'Enviando Solicitud...' : 'Enviar Comprobante y Solicitar Activación'}
                </Button>
              </div>
            </form>
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
