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
  Lock,
  Pencil,
  CheckCircle2,
  Upload,
  Download,
  Trash2,
  FolderOpen,
  Paperclip,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function PacientesView() {
  const { user } = useAuth();
  const isRecepcion = user?.rolCodigo === 'RECEPCION';
  const [pacientes, setPacientes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [showModalCrear, setShowModalCrear] = React.useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = React.useState<any | null>(null);
  const [historiaGinecologica, setHistoriaGinecologica] = React.useState<any | null>(null);
  const [embarazoActivo, setEmbarazoActivo] = React.useState<any | null>(null);
  const [loadingFicha, setLoadingFicha] = React.useState(false);

  // Estados para repositorio de documentos y estudios
  const [tabFicha, setTabFicha] = React.useState<'clinica' | 'documentos'>('clinica');
  const [documentosPaciente, setDocumentosPaciente] = React.useState<any[]>([]);
  const [cargandoDocs, setCargandoDocs] = React.useState(false);
  const [archivoDoc, setArchivoDoc] = React.useState<File | null>(null);
  const [formDoc, setFormDoc] = React.useState({
    categoria: 'LABORATORIO',
    descripcion: '',
    fechaDocumento: new Date().toISOString().slice(0, 10),
  });
  const [subiendoDoc, setSubiendoDoc] = React.useState(false);
  const [descargandoDocId, setDescargandoDocId] = React.useState<string | null>(null);

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

  // Estados para Edición de Paciente
  const [pacienteAEditar, setPacienteAEditar] = React.useState<any | null>(null);
  const [showModalEditar, setShowModalEditar] = React.useState(false);
  const [formEditar, setFormEditar] = React.useState({
    nombre: '',
    apellido: '',
    tipoDocumento: 'DNI',
    documentoIdentidad: '',
    fechaNacimiento: '1995-05-15',
    genero: 'FEMENINO',
    telefono: '',
    email: '',
    direccion: '',
    grupoSanguineo: 'O+',
    alergias: '',
    antecedentesMedicos: '',
    antecedentesFamiliares: '',
    contactoEmergenciaNombre: '',
    contactoEmergenciaTelefono: '',
    activo: true,
  });
  const [guardandoEdicion, setGuardandoEdicion] = React.useState(false);
  const [formEditarError, setFormEditarError] = React.useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = React.useState<string | null>(null);

  const cargarPacientes = React.useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = search
        ? `/pacientes?termino=${encodeURIComponent(search)}&busqueda=${encodeURIComponent(search)}&limite=100`
        : '/pacientes?limite=100';
      const data = await api.get(endpoint);
      const lista = Array.isArray(data) ? data : (data?.datos || data?.data || []);
      setPacientes(lista);
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
    setTabFicha('clinica');
    setHistoriaGinecologica(null);
    setEmbarazoActivo(null);
    setDocumentosPaciente([]);
    setArchivoDoc(null);

    const promises: Promise<any>[] = [
      cargarDocumentosPaciente(p.id),
    ];

    if (!isRecepcion) {
      promises.push(
        api.get(`/ginecologia/pacientes/${p.id}/historia-ginecologica`)
          .then((hg) => setHistoriaGinecologica(hg))
          .catch(() => {}),
        api.get(`/ginecologia/embarazos/paciente/${p.id}/activo`)
          .then((emb) => setEmbarazoActivo(emb))
          .catch(() => {}),
      );
    }

    try {
      await Promise.all(promises);
    } catch {
      // Ignorar errores no críticos
    } finally {
      setLoadingFicha(false);
    }
  };

  const cargarDocumentosPaciente = async (pacienteId: string) => {
    setCargandoDocs(true);
    try {
      const data = await api.get(`/documentos/paciente/${pacienteId}`);
      setDocumentosPaciente(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar documentos:', err);
      setDocumentosPaciente([]);
    } finally {
      setCargandoDocs(false);
    }
  };

  const handleSubirDocumento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoDoc || !pacienteSeleccionado) {
      alert('Por favor selecciona un archivo para adjuntar');
      return;
    }
    setSubiendoDoc(true);
    try {
      const fd = new FormData();
      fd.append('archivo', archivoDoc);
      fd.append('pacienteId', pacienteSeleccionado.id);
      fd.append('categoria', formDoc.categoria);
      if (formDoc.descripcion?.trim()) {
        fd.append('descripcion', formDoc.descripcion.trim());
      }
      if (formDoc.fechaDocumento) {
        fd.append('fechaDocumento', formDoc.fechaDocumento);
      }

      await api.upload('/documentos/subir', fd);
      setArchivoDoc(null);
      setFormDoc({
        categoria: 'LABORATORIO',
        descripcion: '',
        fechaDocumento: new Date().toISOString().slice(0, 10),
      });
      const fileInput = document.getElementById('archivo-estudio-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      await cargarDocumentosPaciente(pacienteSeleccionado.id);
    } catch (err: any) {
      alert(err.message || 'Error al subir documento');
    } finally {
      setSubiendoDoc(false);
    }
  };

  const handleDescargarDocumento = async (doc: any) => {
    setDescargandoDocId(doc.id);
    try {
      await api.downloadBlob(
        `/documentos/${doc.id}/descargar`,
        doc.nombreOriginal || `Documento_${doc.id}`,
      );
    } catch (err: any) {
      alert(err.message || 'Error al descargar documento');
    } finally {
      setDescargandoDocId(null);
    }
  };

  const handleEliminarDocumento = async (docId: string, nombre: string) => {
    if (!confirm(`¿Deseas eliminar el documento "${nombre}" del expediente?`)) return;
    try {
      await api.delete(`/documentos/${docId}`);
      if (pacienteSeleccionado) {
        await cargarDocumentosPaciente(pacienteSeleccionado.id);
      }
    } catch (err: any) {
      alert(err.message || 'Error al eliminar documento');
    }
  };

  const getBadgeCategoriaDoc = (cat: string) => {
    switch (cat) {
      case 'LABORATORIO':
        return <Badge variant="success">Laboratorio</Badge>;
      case 'IMAGENOLOGIA':
        return <Badge variant="info">Imagenología</Badge>;
      case 'INFORME_EXTERNO':
        return <Badge variant="warning">Informe Externo</Badge>;
      case 'CONSENTIMIENTO':
        return <Badge variant="secondary">Consentimiento</Badge>;
      default:
        return <Badge variant="outline">{cat || 'Otro'}</Badge>;
    }
  };

  const formatTamanioBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  const abrirModalEditar = (p: any) => {
    setPacienteAEditar(p);
    setFormEditarError(null);
    setFormEditar({
      nombre: p.nombre || '',
      apellido: p.apellido || '',
      tipoDocumento: p.tipoDocumento || 'DNI',
      documentoIdentidad: p.documentoIdentidad || p.dni || '',
      fechaNacimiento: p.fechaNacimiento ? String(p.fechaNacimiento).slice(0, 10) : '1995-05-15',
      genero: p.genero || p.sexo || 'FEMENINO',
      telefono: p.telefono || '',
      email: p.email || '',
      direccion: p.direccion || '',
      grupoSanguineo: p.grupoSanguineo || 'O+',
      alergias: p.alergias || '',
      antecedentesMedicos: p.antecedentesMedicos || '',
      antecedentesFamiliares: p.antecedentesFamiliares || '',
      contactoEmergenciaNombre: p.contactoEmergenciaNombre || '',
      contactoEmergenciaTelefono: p.contactoEmergenciaTelefono || '',
      activo: p.activo ?? true,
    });
    setShowModalEditar(true);
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteAEditar) return;
    setGuardandoEdicion(true);
    setFormEditarError(null);

    try {
      const payload: any = {
        nombre: formEditar.nombre.trim(),
        apellido: formEditar.apellido.trim(),
        tipoDocumento: formEditar.tipoDocumento,
        documentoIdentidad: formEditar.documentoIdentidad.trim() || undefined,
        fechaNacimiento: formEditar.fechaNacimiento,
        genero: formEditar.genero,
        telefono: formEditar.telefono.trim() || null,
        email: formEditar.email.trim() || null,
        direccion: formEditar.direccion.trim() || null,
        grupoSanguineo: formEditar.grupoSanguineo || undefined,
        alergias: formEditar.alergias.trim() || null,
        antecedentesMedicos: formEditar.antecedentesMedicos.trim() || null,
        antecedentesFamiliares: formEditar.antecedentesFamiliares.trim() || null,
        contactoEmergenciaNombre: formEditar.contactoEmergenciaNombre.trim() || null,
        contactoEmergenciaTelefono: formEditar.contactoEmergenciaTelefono.trim() || null,
        activo: formEditar.activo,
      };

      const actualizado = await api.patch(`/pacientes/${pacienteAEditar.id}`, payload);
      setShowModalEditar(false);
      setPacienteAEditar(null);
      setMensajeExito(`Expediente de "${formEditar.nombre} ${formEditar.apellido}" actualizado correctamente.`);

      if (pacienteSeleccionado?.id === actualizado.id) {
        setPacienteSeleccionado(actualizado);
      }

      await cargarPacientes();
    } catch (err: any) {
      setFormEditarError(err.message || 'Error al actualizar paciente');
    } finally {
      setGuardandoEdicion(false);
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

      {mensajeExito && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
          <button
            type="button"
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
            onClick={() => setMensajeExito(null)}
          >
            ✕
          </button>
        </div>
      )}

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
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            title="Editar datos del paciente"
                            onClick={() => abrirModalEditar(p)}
                          >
                            <Pencil className="size-3.5" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            onClick={() => verFichaPaciente(p)}
                          >
                            <Eye className="size-4" />
                            Ficha 360°
                          </Button>
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => abrirModalEditar(pacienteSeleccionado)}
                >
                  <Pencil className="size-3.5" />
                  Editar Datos
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPacienteSeleccionado(null)}
                >
                  <X className="size-5" />
                </Button>
              </div>
            </CardHeader>

            {/* Selector de Pestañas en Ficha 360 */}
            <div className="px-6 pt-2 border-b border-border flex items-center gap-2 bg-muted/20">
              <button
                type="button"
                onClick={() => setTabFicha('clinica')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  tabFicha === 'clinica'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <HeartPulse className="size-3.5" />
                Historial Clínico & Ginecológico
              </button>
              <button
                type="button"
                onClick={() => setTabFicha('documentos')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  tabFicha === 'documentos'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <FolderOpen className="size-3.5" />
                Estudios & Documentos
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-primary/10 text-primary font-bold">
                  {documentosPaciente.length}
                </span>
              </button>
            </div>

            <CardContent className="p-6 space-y-6 overflow-y-auto flex-1">
              {loadingFicha ? (
                <div className="py-12 text-center text-muted-foreground">
                  <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
                  Cargando expediente clínico...
                </div>
              ) : tabFicha === 'clinica' ? (
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

                  {/* Sección Obstétrica / Ginecológica */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Baby className="size-4 text-pink-500" />
                      Expediente Gineco-Obstétrico
                    </h4>

                    {isRecepcion ? (
                      <div className="p-3.5 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground flex items-center gap-2">
                        <Lock className="size-4 text-muted-foreground shrink-0" />
                        <span>Detalles clínicos y antecedentes gineco-obstétricos reservados exclusivamente para el equipo médico.</span>
                      </div>
                    ) : historiaGinecologica ? (
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
              ) : (
                /* PESTAÑA: ESTUDIOS Y DOCUMENTOS ADJUNTOS */
                <div className="space-y-6">
                  {/* Formulario para adjuntar documento */}
                  <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Upload className="size-4 text-primary" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                        Adjuntar Nuevo Estudio o Archivo Clínico
                      </h4>
                    </div>

                    <form onSubmit={handleSubirDocumento} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Categoría del Estudio *</label>
                          <select
                            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs outline-none focus:border-primary"
                            value={formDoc.categoria}
                            onChange={(e) => setFormDoc({ ...formDoc, categoria: e.target.value })}
                          >
                            <option value="LABORATORIO">Laboratorio / Análisis de Sangre</option>
                            <option value="IMAGENOLOGIA">Imagenología (Ecografía, Rx, TAC, RMN)</option>
                            <option value="INFORME_EXTERNO">Informe Externo / Epicrisis</option>
                            <option value="CONSENTIMIENTO">Consentimiento Informado Firmado</option>
                            <option value="OTRO">Otro Documento / Certificado</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Fecha del Estudio</label>
                          <Input
                            type="date"
                            className="h-9 text-xs"
                            value={formDoc.fechaDocumento}
                            onChange={(e) => setFormDoc({ ...formDoc, fechaDocumento: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">Título / Descripción del Estudio</label>
                        <Input
                          type="text"
                          placeholder="Ej. Hemograma Completo, Ecografía Obstétrica 20 semanas, Biopsia..."
                          className="h-9 text-xs"
                          value={formDoc.descripcion}
                          onChange={(e) => setFormDoc({ ...formDoc, descripcion: e.target.value })}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                        <div className="flex-1">
                          <input
                            type="file"
                            id="archivo-estudio-input"
                            accept=".pdf,image/*,.doc,.docx,.txt"
                            required
                            onChange={(e) => setArchivoDoc(e.target.files?.[0] || null)}
                            className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer text-muted-foreground"
                          />
                        </div>

                        <Button type="submit" size="sm" disabled={subiendoDoc || !archivoDoc} className="cursor-pointer gap-1 text-xs">
                          {subiendoDoc ? (
                            <>
                              <RefreshCw className="size-3.5 animate-spin" />
                              Subiendo...
                            </>
                          ) : (
                            <>
                              <Upload className="size-3.5" />
                              Adjuntar al Expediente
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>

                  {/* Listado de estudios adjuntos */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Paperclip className="size-4 text-primary" />
                        Estudios y Archivos en Expediente ({documentosPaciente.length})
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => pacienteSeleccionado && cargarDocumentosPaciente(pacienteSeleccionado.id)}
                      >
                        <RefreshCw className={`size-3 ${cargandoDocs ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>

                    {cargandoDocs && documentosPaciente.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-primary" />
                        Cargando documentos adjuntos...
                      </div>
                    ) : documentosPaciente.length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-border rounded-xl bg-muted/10 space-y-2">
                        <FolderOpen className="size-8 mx-auto text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground font-medium">
                          No hay estudios o documentos adjuntos para este paciente.
                        </p>
                        <p className="text-[11px] text-muted-foreground/80 max-w-sm mx-auto">
                          Utiliza el formulario superior para adjuntar análisis de laboratorio, ecografías, informes externos o consentimientos firmados.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-card shadow-xs">
                        {documentosPaciente.map((doc) => (
                          <div
                            key={doc.id}
                            className="p-3.5 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {getBadgeCategoriaDoc(doc.categoria)}
                                <span className="font-semibold text-foreground">
                                  {doc.descripcion || doc.nombreOriginal}
                                </span>
                              </div>
                              <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                                <span className="font-mono">{doc.nombreOriginal}</span>
                                <span>•</span>
                                <span>{formatTamanioBytes(doc.tamanoBytes)}</span>
                                <span>•</span>
                                <span>
                                  {doc.fechaDocumento || new Date(doc.createdAt).toLocaleDateString()}
                                </span>
                                {doc.profesional && (
                                  <>
                                    <span>•</span>
                                    <span>Subido por: Dr(a). {doc.profesional.nombre} {doc.profesional.apellido || ''}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1 cursor-pointer"
                                onClick={() => handleDescargarDocumento(doc)}
                                disabled={descargandoDocId === doc.id}
                              >
                                {descargandoDocId === doc.id ? (
                                  <RefreshCw className="size-3 animate-spin" />
                                ) : (
                                  <Download className="size-3 text-primary" />
                                )}
                                Descargar / Ver
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                                onClick={() => handleEliminarDocumento(doc.id, doc.descripcion || doc.nombreOriginal)}
                                title="Eliminar archivo adjunto"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
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

      {/* MODAL EDITAR EXPEDIENTE DEL PACIENTE */}
      {showModalEditar && pacienteAEditar && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-2xl w-full shadow-2xl border-border animate-in fade-in zoom-in-95 duration-150 my-8">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Pencil className="size-4 text-primary" />
                  Editar Expediente de Paciente
                </CardTitle>
                <CardDescription>
                  Rectifica o actualiza datos personales, número de teléfono, domicilio o antecedentes
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowModalEditar(false);
                  setPacienteAEditar(null);
                }}
              >
                <X className="size-5" />
              </Button>
            </CardHeader>

            <form onSubmit={handleGuardarEdicion}>
              <CardContent className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {formEditarError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{formEditarError}</span>
                  </div>
                )}

                {/* Nombre y Apellido */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Nombre *</label>
                    <Input
                      required
                      placeholder="Ej. Ana"
                      value={formEditar.nombre}
                      onChange={(e) => setFormEditar({ ...formEditar, nombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Apellido *</label>
                    <Input
                      required
                      placeholder="Ej. Gómez"
                      value={formEditar.apellido}
                      onChange={(e) => setFormEditar({ ...formEditar, apellido: e.target.value })}
                    />
                  </div>
                </div>

                {/* Documento y Nacimiento */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Tipo Doc. *</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-2.5 py-1 text-sm shadow-xs outline-none focus:border-primary"
                      value={formEditar.tipoDocumento}
                      onChange={(e) => setFormEditar({ ...formEditar, tipoDocumento: e.target.value })}
                    >
                      <option value="DNI">DNI</option>
                      <option value="CEDULA">Cédula</option>
                      <option value="PASAPORTE">Pasaporte</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Número de Documento</label>
                    <Input
                      placeholder="Ej. 38123456"
                      value={formEditar.documentoIdentidad}
                      onChange={(e) => setFormEditar({ ...formEditar, documentoIdentidad: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Fecha Nacimiento *</label>
                    <Input
                      type="date"
                      required
                      value={formEditar.fechaNacimiento}
                      onChange={(e) => setFormEditar({ ...formEditar, fechaNacimiento: e.target.value })}
                    />
                  </div>
                </div>

                {/* Género, Grupo Sanguíneo y Estado */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Sexo Biológico *</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus:border-primary"
                      value={formEditar.genero}
                      onChange={(e) => setFormEditar({ ...formEditar, genero: e.target.value })}
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
                      value={formEditar.grupoSanguineo}
                      onChange={(e) => setFormEditar({ ...formEditar, grupoSanguineo: e.target.value })}
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
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Estado del Paciente</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus:border-primary"
                      value={formEditar.activo ? 'true' : 'false'}
                      onChange={(e) => setFormEditar({ ...formEditar, activo: e.target.value === 'true' })}
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo / Pasivado</option>
                    </select>
                  </div>
                </div>

                {/* Contacto: Teléfono y Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Teléfono de Contacto</label>
                    <Input
                      placeholder="Ej. 809-555-0123"
                      value={formEditar.telefono}
                      onChange={(e) => setFormEditar({ ...formEditar, telefono: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Email</label>
                    <Input
                      type="email"
                      placeholder="paciente@correo.com"
                      value={formEditar.email}
                      onChange={(e) => setFormEditar({ ...formEditar, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Dirección */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Dirección / Domicilio</label>
                  <Input
                    placeholder="Calle, número, ciudad o sector"
                    value={formEditar.direccion}
                    onChange={(e) => setFormEditar({ ...formEditar, direccion: e.target.value })}
                  />
                </div>

                {/* Alergias */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Alergias Conocidas <span className="font-normal text-[11px]">(Opcional)</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setFormEditar({
                            ...formEditar,
                            alergias: formEditar.alergias.trim().toLowerCase() === 'ninguna' ? '' : 'Ninguna',
                          })
                        }
                        className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                          formEditar.alergias.trim().toLowerCase() === 'ninguna'
                            ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/40 font-semibold shadow-xs'
                            : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {formEditar.alergias.trim().toLowerCase() === 'ninguna' ? '✓ Ninguna (Sin alergias)' : 'Ninguna'}
                      </button>
                      {formEditar.alergias && formEditar.alergias.trim().toLowerCase() !== 'ninguna' && (
                        <button
                          type="button"
                          onClick={() => setFormEditar({ ...formEditar, alergias: '' })}
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
                    value={formEditar.alergias}
                    onChange={(e) => setFormEditar({ ...formEditar, alergias: e.target.value })}
                  />
                  <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-muted-foreground flex-wrap">
                    <span>Frecuentes:</span>
                    {['Penicilina', 'AINEs', 'Sulfas', 'Dipirona', 'Látex'].map((alergia) => (
                      <button
                        key={alergia}
                        type="button"
                        onClick={() => {
                          const actual = formEditar.alergias.trim().toLowerCase() === 'ninguna' ? '' : formEditar.alergias.trim();
                          const yaExiste = actual.toLowerCase().includes(alergia.toLowerCase());
                          if (!yaExiste) {
                            setFormEditar({ ...formEditar, alergias: actual ? `${actual}, ${alergia}` : alergia });
                          }
                        }}
                        className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer text-[10px] border border-border/40"
                      >
                        + {alergia}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Antecedentes Médicos y Familiares */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Antecedentes Médicos</label>
                    <Input
                      placeholder="Ej. Hipertensión, Asma, Diabetes..."
                      value={formEditar.antecedentesMedicos}
                      onChange={(e) => setFormEditar({ ...formEditar, antecedentesMedicos: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Antecedentes Familiares</label>
                    <Input
                      placeholder="Ej. Cardiopatías, Diabetes materna..."
                      value={formEditar.antecedentesFamiliares}
                      onChange={(e) => setFormEditar({ ...formEditar, antecedentesFamiliares: e.target.value })}
                    />
                  </div>
                </div>

                {/* Contacto de Emergencia */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Contacto de Emergencia</label>
                    <Input
                      placeholder="Nombre del familiar o acompañante"
                      value={formEditar.contactoEmergenciaNombre}
                      onChange={(e) => setFormEditar({ ...formEditar, contactoEmergenciaNombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Teléfono de Emergencia</label>
                    <Input
                      placeholder="Teléfono del contacto de emergencia"
                      value={formEditar.contactoEmergenciaTelefono}
                      onChange={(e) => setFormEditar({ ...formEditar, contactoEmergenciaTelefono: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>

              <div className="p-4 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModalEditar(false);
                    setPacienteAEditar(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardandoEdicion}>
                  {guardandoEdicion ? 'Guardando Cambios...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
