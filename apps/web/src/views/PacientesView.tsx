import * as React from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  UserPlus,
  Phone,
  Mail,
  HeartPulse,
  Baby,
  X,
  RefreshCw,
  Eye,
  AlertCircle,
} from 'lucide-react';

export function PacientesView() {
  const [pacientes, setPacientes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [showModalCrear, setShowModalCrear] = React.useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = React.useState<any | null>(null);
  const [historiaGinecologica, setHistoriaGinecologica] = React.useState<any | null>(null);
  const [embarazoActivo, setEmbarazoActivo] = React.useState<any | null>(null);
  const [loadingFicha, setLoadingFicha] = React.useState(false);

  // Formulario nuevo paciente
  const [form, setForm] = React.useState({
    nombre: '',
    apellido: '',
    tipoDocumento: 'DNI',
    documentoIdentidad: '',
    fechaNacimiento: '1995-05-15',
    genero: 'FEMENINO',
    telefono: '',
    email: '',
    grupoSanguineo: 'O+',
    alergias: '',
    antecedentesMedicos: '',
  });
  const [guardando, setGuardando] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const cargarPacientes = React.useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = search ? `/pacientes?busqueda=${encodeURIComponent(search)}` : '/pacientes';
      const data = await api.get(endpoint);
      setPacientes(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    cargarPacientes();
  }, [cargarPacientes]);

  const verFichaPaciente = async (p: any) => {
    setPacienteSeleccionado(p);
    setLoadingFicha(true);
    setHistoriaGinecologica(null);
    setEmbarazoActivo(null);

    try {
      // Intentamos cargar la historia ginecológica y embarazo activo si aplica
      const [hg, emb] = await Promise.all([
        api.get(`/ginecologia/pacientes/${p.id}/historia-ginecologica`).catch(() => null),
        api.get(`/ginecologia/embarazos/paciente/${p.id}/activo`).catch(() => null),
      ]);
      setHistoriaGinecologica(hg);
      setEmbarazoActivo(emb);
    } catch {
      // Ignorar si no tiene historia ginecológica
    } finally {
      setLoadingFicha(false);
    }
  };

  const handleCrearPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setFormError(null);

    try {
      const payload = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        tipoDocumento: form.tipoDocumento,
        documentoIdentidad: form.documentoIdentidad.trim(),
        fechaNacimiento: form.fechaNacimiento,
        genero: form.genero,
        telefono: form.telefono.trim() || undefined,
        email: form.email.trim() || undefined,
        grupoSanguineo: form.grupoSanguineo || undefined,
        alergias: form.alergias.trim() || undefined,
        antecedentesMedicos: form.antecedentesMedicos.trim() || undefined,
      };

      await api.post('/pacientes', payload);
      setShowModalCrear(false);
      setForm({
        nombre: '',
        apellido: '',
        tipoDocumento: 'DNI',
        documentoIdentidad: '',
        fechaNacimiento: '1995-05-15',
        genero: 'FEMENINO',
        telefono: '',
        email: '',
        grupoSanguineo: 'O+',
        alergias: '',
        antecedentesMedicos: '',
      });
      cargarPacientes();
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar paciente');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expedientes de Pacientes</h1>
          <p className="text-sm text-muted-foreground">
            Gestión integral de historias clínicas, fichas de filiación y antecedentes
          </p>
        </div>
        <Button onClick={() => setShowModalCrear(true)}>
          <UserPlus className="size-4 mr-2" />
          Registrar Paciente
        </Button>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nombre, apellido o DNI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" onClick={cargarPacientes}>
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Lista de pacientes */}
      <Card>
        <CardContent className="p-0">
          {loading && pacientes.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
              Cargando nómina de pacientes...
            </div>
          ) : pacientes.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No se encontraron pacientes registrados con los criterios de búsqueda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Paciente</th>
                    <th className="px-6 py-3 font-semibold">DNI / Documento</th>
                    <th className="px-6 py-3 font-semibold">Contacto</th>
                    <th className="px-6 py-3 font-semibold">Grupo Sang.</th>
                    <th className="px-6 py-3 font-semibold">Estado</th>
                    <th className="px-6 py-3 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pacientes.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {p.nombre[0]}
                            {p.apellido?.[0] || ''}
                          </div>
                          <div>
                            <div>
                              {p.nombre} {p.apellido || ''}
                            </div>
                            <div className="text-xs text-muted-foreground">{p.genero || p.sexo || 'Femenino'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-muted-foreground">{p.documentoIdentidad || p.dni || 'S/D'}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground space-y-0.5">
                        {p.telefono && (
                          <div className="flex items-center gap-1">
                            <Phone className="size-3" /> {p.telefono}
                          </div>
                        )}
                        {p.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="size-3" /> {p.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{p.grupoSanguineo || 'N/D'}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={p.activo ? 'success' : 'secondary'}>
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => verFichaPaciente(p)}
                        >
                          <Eye className="size-4 mr-1.5" />
                          Ficha 360°
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL FICHA 360° DEL PACIENTE */}
      {pacienteSeleccionado && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border-border">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {pacienteSeleccionado.nombre[0]}
                  {pacienteSeleccionado.apellido?.[0] || ''}
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido || ''}
                  </CardTitle>
                  <CardDescription>
                    {pacienteSeleccionado.tipoDocumento || 'Doc'}: {pacienteSeleccionado.documentoIdentidad || pacienteSeleccionado.dni || 'S/D'} • {pacienteSeleccionado.genero || pacienteSeleccionado.sexo}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPacienteSeleccionado(null)}
              >
                <X className="size-5" />
              </Button>
            </CardHeader>

            <CardContent className="p-6 space-y-6 overflow-y-auto flex-1">
              {loadingFicha ? (
                <div className="py-12 text-center text-muted-foreground">
                  <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
                  Cargando expediente clínico...
                </div>
              ) : (
                <>
                  {/* Datos generales */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-lg bg-muted/30 border border-border/60 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Teléfono:</span>
                      <span className="font-semibold">{pacienteSeleccionado.telefono || 'Sin teléfono'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Email:</span>
                      <span className="font-semibold">{pacienteSeleccionado.email || 'Sin email'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Grupo Sanguíneo:</span>
                      <span className="font-semibold">{pacienteSeleccionado.grupoSanguineo || 'N/D'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Nacimiento:</span>
                      <span className="font-semibold">{pacienteSeleccionado.fechaNacimiento}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground block">Dirección:</span>
                      <span className="font-semibold">{pacienteSeleccionado.direccion || 'Sin dirección registrada'}</span>
                    </div>
                  </div>

                  {/* Alergias y antecedentes */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <HeartPulse className="size-4 text-destructive" />
                      Alergias y Antecedentes Médicos
                    </h4>
                    <div className="p-3 rounded-lg border border-border/80 text-xs space-y-1">
                      <div>
                        <span className="font-semibold">Alergias conocidas:</span>{' '}
                        {pacienteSeleccionado.alergias || 'Ninguna registrada'}
                      </div>
                      <div>
                        <span className="font-semibold">Antecedentes patológicos:</span>{' '}
                        {pacienteSeleccionado.antecedentesMedicos || 'Sin antecedentes patológicos crónicos'}
                      </div>
                    </div>
                  </div>

                  {/* Sección Obstétrica / Ginecológica (Si existe) */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Baby className="size-4 text-pink-500" />
                      Expediente Gineco-Obstétrico
                    </h4>

                    {historiaGinecologica ? (
                      <div className="p-4 rounded-lg bg-pink-500/5 border border-pink-500/20 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-pink-600 dark:text-pink-400">
                            Fórmula Obstétrica: {historiaGinecologica.formulaObstetrica}
                          </span>
                          <Badge variant="outline">
                            Menarca: {historiaGinecologica.edadMenarca} años
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          <div>
                            <span className="text-muted-foreground block">Gestas:</span>
                            <span className="font-semibold">{historiaGinecologica.gestas}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Partos:</span>
                            <span className="font-semibold">{historiaGinecologica.partos}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Cesáreas:</span>
                            <span className="font-semibold">{historiaGinecologica.cesareas}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Abortos:</span>
                            <span className="font-semibold">{historiaGinecologica.abortos}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg border border-border/60 text-xs text-muted-foreground">
                        Sin historia ginecológica inicial registrada.
                      </div>
                    )}

                    {embarazoActivo && (
                      <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            Embarazo Activo en Curso
                          </span>
                          <Badge variant="success">FPP: {embarazoActivo.fechaProbableParto}</Badge>
                        </div>
                        <div className="text-muted-foreground">
                          FUR: {embarazoActivo.fechaUltimaRegla} • Tipo: {embarazoActivo.tipoEmbarazo}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL CREAR NUEVO PACIENTE */}
      {showModalCrear && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-lg w-full shadow-2xl border-border">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
              <div>
                <CardTitle className="text-lg">Registrar Nuevo Paciente</CardTitle>
                <CardDescription>Dar de alta un nuevo expediente clínico</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowModalCrear(false)}
              >
                <X className="size-5" />
              </Button>
            </CardHeader>

            <form onSubmit={handleCrearPaciente}>
              <CardContent className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {formError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Nombre *</label>
                    <Input
                      required
                      placeholder="Ej. Ana"
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Apellido *</label>
                    <Input
                      required
                      placeholder="Ej. Gómez"
                      value={form.apellido}
                      onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Tipo Doc. *</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-2.5 py-1 text-sm shadow-xs outline-none focus:border-primary"
                      value={form.tipoDocumento}
                      onChange={(e) => setForm({ ...form, tipoDocumento: e.target.value })}
                    >
                      <option value="DNI">DNI</option>
                      <option value="CEDULA">Cédula</option>
                      <option value="PASAPORTE">Pasaporte</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Número de Documento *</label>
                    <Input
                      required
                      placeholder="Ej. 38123456"
                      value={form.documentoIdentidad}
                      onChange={(e) => setForm({ ...form, documentoIdentidad: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Fecha Nacimiento *</label>
                    <Input
                      type="date"
                      required
                      value={form.fechaNacimiento}
                      onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Sexo Biológico *</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus:border-primary"
                      value={form.genero}
                      onChange={(e) => setForm({ ...form, genero: e.target.value })}
                    >
                      <option value="FEMENINO">Femenino</option>
                      <option value="MASCULINO">Masculino</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Grupo Sanguíneo</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus:border-primary"
                      value={form.grupoSanguineo}
                      onChange={(e) => setForm({ ...form, grupoSanguineo: e.target.value })}
                    >
                      <option value="">No especificado / Desconocido</option>
                      <option value="O+">O Rh+ (O+)</option>
                      <option value="O-">O Rh- (O-)</option>
                      <option value="A+">A Rh+ (A+)</option>
                      <option value="A-">A Rh- (A-)</option>
                      <option value="B+">B Rh+ (B+)</option>
                      <option value="B-">B Rh- (B-)</option>
                      <option value="AB+">AB Rh+ (AB+)</option>
                      <option value="AB-">AB Rh- (AB-)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Teléfono</label>
                    <Input
                      placeholder="+54 9 11 1234-5678"
                      value={form.telefono}
                      onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Email</label>
                    <Input
                      type="email"
                      placeholder="paciente@correo.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Alergias Conocidas <span className="font-normal text-[11px]">(Opcional)</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            alergias: form.alergias.trim().toLowerCase() === 'ninguna' ? '' : 'Ninguna',
                          })
                        }
                        className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                          form.alergias.trim().toLowerCase() === 'ninguna'
                            ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40 font-semibold shadow-xs'
                            : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {form.alergias.trim().toLowerCase() === 'ninguna' ? '✓ Ninguna (Sin alergias)' : 'Ninguna'}
                      </button>
                      {form.alergias && form.alergias.trim().toLowerCase() !== 'ninguna' && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, alergias: '' })}
                          className="text-[11px] px-1.5 py-0.5 text-muted-foreground hover:text-destructive cursor-pointer"
                          title="Dejar vacío"
                        >
                          ✕ Vaciar
                        </button>
                      )}
                    </div>
                  </div>
                  <Input
                    placeholder="Ej. Penicilina, AINEs (o selecciona 'Ninguna' / deja vacío)"
                    value={form.alergias}
                    onChange={(e) => setForm({ ...form, alergias: e.target.value })}
                  />
                  <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-muted-foreground flex-wrap">
                    <span>Frecuentes:</span>
                    {['Penicilina', 'AINEs', 'Sulfas', 'Dipirona', 'Látex'].map((alergia) => (
                      <button
                        key={alergia}
                        type="button"
                        onClick={() => {
                          const actual = form.alergias.trim().toLowerCase() === 'ninguna' ? '' : form.alergias.trim();
                          const yaExiste = actual.toLowerCase().includes(alergia.toLowerCase());
                          if (!yaExiste) {
                            setForm({ ...form, alergias: actual ? `${actual}, ${alergia}` : alergia });
                          }
                        }}
                        className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer text-[10px] border border-border/40"
                      >
                        + {alergia}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>

              <div className="p-4 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModalCrear(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Crear Expediente'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
