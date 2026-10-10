import * as React from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  FileCheck,
  FlaskConical,
  Activity,
  Image as ImageIcon,
  Search,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';

export type CategoriaDoc = 'LABORATORIO' | 'IMAGENOLOGIA' | 'INFORME_EXTERNO' | 'CONSENTIMIENTO' | 'OTRO';

interface Props {
  pacientePreseleccionadoId?: string;
}

export function ResultadosEstudiosView({ pacientePreseleccionadoId }: Props) {
  // Lista de pacientes para selector
  const [pacientes, setPacientes] = React.useState<any[]>([]);
  const [busquedaPac, setBusquedaPac] = React.useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = React.useState<any | null>(null);
  const [dropdownPacAbierto, setDropdownPacAbierto] = React.useState(false);

  // Formulario de subida
  const [archivo, setArchivo] = React.useState<File | null>(null);
  const [categoria, setCategoria] = React.useState<CategoriaDoc>('LABORATORIO');
  const [fechaDocumento, setFechaDocumento] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [descripcion, setDescripcion] = React.useState('');
  const [subiendo, setSubiendo] = React.useState(false);
  const [mensajeExito, setMensajeExito] = React.useState<string | null>(null);
  const [mensajeError, setMensajeError] = React.useState<string | null>(null);

  // Listado y filtros de documentos
  const [documentos, setDocumentos] = React.useState<any[]>([]);
  const [cargandoDocs, setCargandoDocs] = React.useState(true);
  const [filtroCategoria, setFiltroCategoria] = React.useState<string>('TODAS');
  const [busquedaTexto, setBusquedaTexto] = React.useState('');

  // Drag and drop state
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Cargar pacientes
  React.useEffect(() => {
    const cargarPacientes = async () => {
      try {
        const res = await api.get('/pacientes?limite=150');
        const list = Array.isArray(res) ? res : res?.datos || [];
        setPacientes(list);

        if (pacientePreseleccionadoId) {
          const match = list.find((p: any) => p.id === pacientePreseleccionadoId);
          if (match) setPacienteSeleccionado(match);
        }
      } catch (err) {
        console.error('Error cargando lista de pacientes:', err);
      }
    };
    cargarPacientes();
  }, [pacientePreseleccionadoId]);

  // Cargar documentos (por paciente seleccionado o generales de la clínica)
  const cargarDocumentos = React.useCallback(async () => {
    setCargandoDocs(true);
    try {
      if (pacienteSeleccionado) {
        const url = `/documentos/paciente/${pacienteSeleccionado.id}${filtroCategoria !== 'TODAS' ? `?categoria=${filtroCategoria}` : ''}`;
        const res = await api.get(url);
        setDocumentos(Array.isArray(res) ? res : res?.datos || []);
      } else {
        const url = `/documentos${filtroCategoria !== 'TODAS' ? `?categoria=${filtroCategoria}` : ''}`;
        const res = await api.get(url);
        setDocumentos(Array.isArray(res) ? res : res?.datos || []);
      }
    } catch (err) {
      console.error('Error cargando documentos:', err);
    } finally {
      setCargandoDocs(false);
    }
  }, [pacienteSeleccionado, filtroCategoria]);

  React.useEffect(() => {
    cargarDocumentos();
  }, [cargarDocumentos]);

  // Manejar selección de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (f.size > 15 * 1024 * 1024) {
        setMensajeError('El archivo excede el tamaño máximo permitido (15 MB).');
        return;
      }
      setArchivo(f);
      setMensajeError(null);
    }
  };

  // Manejar Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (f.size > 15 * 1024 * 1024) {
        setMensajeError('El archivo excede el tamaño máximo permitido (15 MB).');
        return;
      }
      setArchivo(f);
      setMensajeError(null);
    }
  };

  // Enviar formulario de subida
  const handleSubirDocumento = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeError(null);
    setMensajeExito(null);

    if (!pacienteSeleccionado) {
      setMensajeError('Por favor selecciona el paciente al que pertenece este estudio.');
      return;
    }
    if (!archivo) {
      setMensajeError('Por favor selecciona o arrastra un archivo para subir.');
      return;
    }

    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('pacienteId', pacienteSeleccionado.id);
      formData.append('categoria', categoria);
      formData.append('fechaDocumento', fechaDocumento);
      if (descripcion.trim()) {
        formData.append('descripcion', descripcion.trim());
      }

      await api.upload('/documentos/subir', formData);

      setMensajeExito(`Estudio "${archivo.name}" adjuntado exitosamente al expediente de ${pacienteSeleccionado.nombre}.`);
      setArchivo(null);
      setDescripcion('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      await cargarDocumentos();
    } catch (err: any) {
      setMensajeError(err.message || 'Error al subir el archivo clínico.');
    } finally {
      setSubiendo(false);
    }
  };

  // Descargar archivo
  const handleDescargar = async (doc: any) => {
    try {
      await api.downloadBlob(`/documentos/${doc.id}/descargar`, doc.nombreOriginal || 'documento_clinico.pdf');
    } catch (err: any) {
      alert(err.message || 'Error al descargar archivo');
    }
  };

  // Eliminar archivo
  const handleEliminar = async (doc: any) => {
    if (!confirm(`¿Estás seguro de eliminar el archivo "${doc.nombreOriginal}" del expediente?`)) {
      return;
    }
    try {
      await api.delete(`/documentos/${doc.id}`);
      cargarDocumentos();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar archivo');
    }
  };

  // Pacientes filtrados para selector
  const pacientesFiltrados = React.useMemo(() => {
    if (!busquedaPac.trim()) return pacientes.slice(0, 8);
    const q = busquedaPac.toLowerCase();
    return pacientes
      .filter((p) =>
        `${p.nombre} ${p.apellido || ''} ${p.documentoIdentidad || p.dni || ''} ${p.numeroHistoria || ''}`
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 10);
  }, [busquedaPac, pacientes]);

  // Documentos filtrados por texto
  const docsFiltrados = React.useMemo(() => {
    if (!busquedaTexto.trim()) return documentos;
    const q = busquedaTexto.toLowerCase();
    return documentos.filter((d) => {
      const pacName = d.paciente ? `${d.paciente.nombre} ${d.paciente.apellido || ''}` : '';
      return (
        d.nombreOriginal?.toLowerCase().includes(q) ||
        d.descripcion?.toLowerCase().includes(q) ||
        pacName.toLowerCase().includes(q)
      );
    });
  }, [documentos, busquedaTexto]);

  const getBadgeCategoria = (cat: string) => {
    switch (cat) {
      case 'LABORATORIO':
        return (
          <Badge variant="info" className="text-[10px] gap-1 py-0 px-2">
            <FlaskConical className="size-3" /> Laboratorio
          </Badge>
        );
      case 'IMAGENOLOGIA':
        return (
          <Badge variant="warning" className="text-[10px] gap-1 py-0 px-2">
            <ImageIcon className="size-3" /> Imagenología
          </Badge>
        );
      case 'INFORME_EXTERNO':
        return (
          <Badge variant="default" className="text-[10px] gap-1 py-0 px-2 bg-purple-600 text-white">
            <Activity className="size-3" /> Informe / Biopsia
          </Badge>
        );
      case 'CONSENTIMIENTO':
        return (
          <Badge variant="success" className="text-[10px] gap-1 py-0 px-2">
            <FileCheck className="size-3" /> Consentimiento
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] gap-1 py-0 px-2">
            <FileText className="size-3" /> Otro
          </Badge>
        );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Alertas */}
      {mensajeExito && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito(null)} className="hover:opacity-75">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {mensajeError && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{mensajeError}</span>
          </div>
          <button onClick={() => setMensajeError(null)} className="hover:opacity-75">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ── Encabezado ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Upload className="size-6 text-violet-600 dark:text-violet-400" />
            Subida y Gestión de Resultados Clínicos
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Adjunta analíticas externas, ecografías, biopsias y consentimientos al expediente digital del paciente
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={cargarDocumentos}
          disabled={cargandoDocs}
          className="text-xs h-9 gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`size-3.5 ${cargandoDocs ? 'animate-spin' : ''}`} />
          Actualizar Lista
        </Button>
      </div>

      {/* ── Layout en dos columnas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Formulario de Subida (5 columnas) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-border shadow-xs">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Upload className="size-4 text-violet-600 dark:text-violet-400" />
                Adjuntar Nuevo Estudio o Documento
              </CardTitle>
              <CardDescription className="text-xs">
                Selecciona al paciente y sube el archivo correspondiente
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              <form onSubmit={handleSubirDocumento} className="space-y-4">
                {/* 1. Selector de Paciente */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Paciente Destino *</span>
                    {pacienteSeleccionado && (
                      <button
                        type="button"
                        onClick={() => {
                          setPacienteSeleccionado(null);
                          setBusquedaPac('');
                        }}
                        className="text-[11px] text-muted-foreground hover:text-destructive underline"
                      >
                        Cambiar
                      </button>
                    )}
                  </label>

                  {pacienteSeleccionado ? (
                    <div className="p-3 rounded-xl border border-violet-500/30 bg-violet-500/5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">
                          {pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido || ''}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>Céd: {pacienteSeleccionado.documentoIdentidad || pacienteSeleccionado.dni || 'S/N'}</span>
                          {pacienteSeleccionado.ars && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1.5">
                              {pacienteSeleccionado.ars}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CheckCircle2 className="size-4 text-violet-600 dark:text-violet-400 shrink-0" />
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Buscar por nombre, cédula o expediente..."
                          value={busquedaPac}
                          onChange={(e) => {
                            setBusquedaPac(e.target.value);
                            setDropdownPacAbierto(true);
                          }}
                          onFocus={() => setDropdownPacAbierto(true)}
                          className="pl-9 text-xs h-9"
                        />
                      </div>

                      {/* Dropdown autocompletado */}
                      {dropdownPacAbierto && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={() => setDropdownPacAbierto(false)}
                          />
                          <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-card rounded-xl border border-border shadow-xl max-h-56 overflow-y-auto p-1 divide-y divide-border">
                            {pacientesFiltrados.length === 0 ? (
                              <div className="p-3 text-center text-xs text-muted-foreground">
                                No se encontraron pacientes
                              </div>
                            ) : (
                              pacientesFiltrados.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    setPacienteSeleccionado(p);
                                    setDropdownPacAbierto(false);
                                  }}
                                  className="w-full text-left p-2.5 rounded-lg hover:bg-muted text-xs transition-colors flex items-center justify-between"
                                >
                                  <div>
                                    <div className="font-semibold text-foreground">
                                      {p.nombre} {p.apellido || ''}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                      {p.documentoIdentidad || p.dni || 'Sin documento'} • {p.ars || 'Particular'}
                                    </div>
                                  </div>
                                  <User className="size-3.5 text-muted-foreground shrink-0" />
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Tipo / Categoría de Estudio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Categoría del Documento *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCategoria('LABORATORIO')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center gap-2 ${
                        categoria === 'LABORATORIO'
                          ? 'border-violet-600 bg-violet-600/10 text-violet-700 dark:text-violet-300 font-semibold'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <FlaskConical className="size-3.5 text-sky-500" />
                      <span>Laboratorio Clínico</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCategoria('IMAGENOLOGIA')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center gap-2 ${
                        categoria === 'IMAGENOLOGIA'
                          ? 'border-violet-600 bg-violet-600/10 text-violet-700 dark:text-violet-300 font-semibold'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <ImageIcon className="size-3.5 text-amber-500" />
                      <span>Sonografía / Rayos X</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCategoria('INFORME_EXTERNO')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center gap-2 ${
                        categoria === 'INFORME_EXTERNO'
                          ? 'border-violet-600 bg-violet-600/10 text-violet-700 dark:text-violet-300 font-semibold'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Activity className="size-3.5 text-purple-500" />
                      <span>Biopsia / Informe</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCategoria('CONSENTIMIENTO')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center gap-2 ${
                        categoria === 'CONSENTIMIENTO'
                          ? 'border-violet-600 bg-violet-600/10 text-violet-700 dark:text-violet-300 font-semibold'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <FileCheck className="size-3.5 text-emerald-500" />
                      <span>Consentimiento</span>
                    </button>
                  </div>
                </div>

                {/* 3. Fecha del Documento */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Fecha de Realización del Estudio
                  </label>
                  <Input
                    type="date"
                    value={fechaDocumento}
                    onChange={(e) => setFechaDocumento(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>

                {/* 4. Descripción breve o notas */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Descripción / Observaciones del Estudio (Opcional)
                  </label>
                  <Input
                    type="text"
                    placeholder="Ej: Hemograma de control, perfil lipídico, sonografía pélvica..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>

                {/* 5. Zona de Dropzone para arrastrar archivo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Archivo a Subir (PDF, PNG, JPG hasta 15 MB) *
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/webp,.docx,.doc"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {archivo ? (
                    <div className="p-3.5 rounded-xl border border-border bg-muted/40 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0">
                          <FileText className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate">
                            {archivo.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {formatFileSize(archivo.size)}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setArchivo(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="size-7 text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                        isDragging
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-border bg-muted/20 hover:border-violet-500/50 hover:bg-muted/40'
                      }`}
                    >
                      <div className="size-10 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto mb-2">
                        <Upload className="size-5" />
                      </div>
                      <p className="text-xs font-medium text-foreground">
                        Haz clic para seleccionar o arrastra tu archivo aquí
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        PDF de laboratorio, imagen de ecografía, reporte de biopsia (máx. 15 MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Botón de Enviar */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={subiendo || !archivo || !pacienteSeleccionado}
                    className="w-full text-xs h-9 bg-violet-600 hover:bg-violet-700 text-white shadow-sm gap-1.5"
                  >
                    {subiendo ? (
                      <RefreshCw className="size-3.5 animate-spin" />
                    ) : (
                      <Upload className="size-3.5" />
                    )}
                    {subiendo ? 'Subiendo y Asociando...' : 'Adjuntar Estudio al Expediente'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Explorador y Listado de Documentos (7 columnas) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-border shadow-xs">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileSpreadsheet className="size-4 text-primary" />
                    {pacienteSeleccionado
                      ? `Estudios de: ${pacienteSeleccionado.nombre} ${pacienteSeleccionado.apellido || ''}`
                      : 'Estudios Clínicos Recientes en la Clínica'}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {pacienteSeleccionado
                      ? 'Archivos y reportes vinculados al expediente de este paciente'
                      : 'Últimos documentos de laboratorio e imágenes subidos en recepción'}
                  </CardDescription>
                </div>

                {pacienteSeleccionado && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPacienteSeleccionado(null)}
                    className="text-xs h-8 text-muted-foreground hover:text-foreground shrink-0 self-start sm:self-auto"
                  >
                    Ver Todos los de la Clínica
                  </Button>
                )}
              </div>

              {/* Barra de Filtros y Búsqueda */}
              <div className="pt-3 flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Filtrar por nombre de archivo o paciente..."
                    value={busquedaTexto}
                    onChange={(e) => setBusquedaTexto(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto shrink-0 pb-1 sm:pb-0">
                  {['TODAS', 'LABORATORIO', 'IMAGENOLOGIA', 'INFORME_EXTERNO'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFiltroCategoria(cat)}
                      className={`px-2.5 py-1 text-[11px] rounded-lg border transition-colors whitespace-nowrap ${
                        filtroCategoria === cat
                          ? 'border-violet-600 bg-violet-600/10 text-violet-700 dark:text-violet-300 font-semibold'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {cat === 'TODAS'
                        ? 'Todas'
                        : cat === 'LABORATORIO'
                        ? 'Labs'
                        : cat === 'IMAGENOLOGIA'
                        ? 'Imágenes'
                        : 'Biopsias'}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {cargandoDocs ? (
                <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <RefreshCw className="size-4 animate-spin text-primary" />
                  Cargando archivos clínicos...
                </div>
              ) : docsFiltrados.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
                  <div className="size-10 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
                    <FileText className="size-5" />
                  </div>
                  <p className="font-medium text-foreground">No hay documentos registrados</p>
                  <p className="max-w-xs mx-auto text-[11px]">
                    {pacienteSeleccionado
                      ? 'Este paciente aún no tiene analíticas o imágenes adjuntas. Usa el formulario de la izquierda para subir una.'
                      : 'Selecciona un paciente a la izquierda para ver su historial específico o adjuntar nuevos estudios.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-4 font-semibold">Documento / Archivo</th>
                        <th className="py-2.5 px-4 font-semibold">Categoría</th>
                        {!pacienteSeleccionado && (
                          <th className="py-2.5 px-4 font-semibold">Paciente</th>
                        )}
                        <th className="py-2.5 px-4 font-semibold">Fecha Estudio</th>
                        <th className="py-2.5 px-4 font-semibold">Peso</th>
                        <th className="py-2.5 px-4 font-semibold text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {docsFiltrados.map((doc) => {
                        const esPdf = doc.mimeType?.includes('pdf') || doc.nombreOriginal?.endsWith('.pdf');
                        const esImagen = doc.mimeType?.includes('image');

                        return (
                          <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                            {/* Nombre del archivo */}
                            <td className="py-3 px-4 font-medium text-foreground">
                              <div className="flex items-center gap-2.5 min-w-[180px]">
                                <div
                                  className={`p-1.5 rounded-lg shrink-0 ${
                                    esPdf
                                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                      : esImagen
                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                      : 'bg-primary/10 text-primary'
                                  }`}
                                >
                                  {esPdf ? (
                                    <FileText className="size-3.5" />
                                  ) : esImagen ? (
                                    <ImageIcon className="size-3.5" />
                                  ) : (
                                    <FileSpreadsheet className="size-3.5" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold truncate max-w-[220px]" title={doc.nombreOriginal}>
                                    {doc.nombreOriginal}
                                  </div>
                                  {doc.descripcion && (
                                    <div className="text-[10px] text-muted-foreground truncate max-w-[220px]">
                                      {doc.descripcion}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Categoría */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              {getBadgeCategoria(doc.categoria)}
                            </td>

                            {/* Paciente (si lista general) */}
                            {!pacienteSeleccionado && (
                              <td className="py-3 px-4 text-foreground whitespace-nowrap">
                                {doc.paciente ? (
                                  <button
                                    type="button"
                                    onClick={() => setPacienteSeleccionado(doc.paciente)}
                                    className="font-medium text-primary hover:underline flex items-center gap-1"
                                    title="Filtrar por este paciente"
                                  >
                                    <User className="size-3" />
                                    <span>
                                      {doc.paciente.nombre} {doc.paciente.apellido || ''}
                                    </span>
                                  </button>
                                ) : (
                                  <span className="text-muted-foreground italic">N/D</span>
                                )}
                              </td>
                            )}

                            {/* Fecha */}
                            <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Calendar className="size-3" />
                                <span>
                                  {doc.fechaDocumento
                                    ? new Date(doc.fechaDocumento).toLocaleDateString('es-DO', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                      })
                                    : new Date(doc.creadoEn).toLocaleDateString('es-DO', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                      })}
                                </span>
                              </div>
                            </td>

                            {/* Peso */}
                            <td className="py-3 px-4 text-muted-foreground whitespace-nowrap text-[11px]">
                              {formatFileSize(doc.pesoBytes)}
                            </td>

                            {/* Acciones */}
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-muted-foreground hover:text-primary"
                                  title="Descargar archivo"
                                  onClick={() => handleDescargar(doc)}
                                >
                                  <Download className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-muted-foreground hover:text-destructive"
                                  title="Eliminar archivo"
                                  onClick={() => handleEliminar(doc)}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
