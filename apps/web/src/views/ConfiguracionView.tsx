import * as React from 'react';
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
} from 'lucide-react';

export function ConfiguracionView() {
  const [config, setConfig] = React.useState<any>(null);
  const [usuarios, setUsuarios] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [guardandoConfig, setGuardandoConfig] = React.useState(false);
  const [showModalCrearUsuario, setShowModalCrearUsuario] = React.useState(false);
  const [mensajeExito, setMensajeExito] = React.useState<string | null>(null);

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
      const [cfg, users] = await Promise.all([
        api.get('/consultorios/configuracion'),
        api.get('/usuarios'),
      ]);
      setConfig(cfg);
      setUsuarios(Array.isArray(users) ? users : []);
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
                    <Badge variant={u.activo ? 'success' : 'secondary'}>
                      {u.activo ? 'Activo' : 'Suspendido'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => cambiarEstadoUsuario(u.id, !u.activo)}
                    >
                      {u.activo ? 'Suspender' : 'Activar'}
                    </Button>
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
                      <option value="MEDICO">Médico</option>
                      <option value="RECEPCION">Recepción</option>
                      <option value="ADMIN">Administrador</option>
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
    </div>
  );
}
