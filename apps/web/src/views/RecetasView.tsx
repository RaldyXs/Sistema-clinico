import * as React from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Download,
  Plus,
  Trash2,
  RefreshCw,
  X,
  Pill,
  AlertCircle,
  PenTool,
  CheckCircle2,
  Upload,
  Eraser,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function RecetasView() {
  const { user, actualizarPerfilLocal } = useAuth();
  const [recetas, setRecetas] = React.useState<any[]>([]);
  const [pacientes, setPacientes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showModalCrear, setShowModalCrear] = React.useState(false);
  const [descargandoId, setDescargandoId] = React.useState<string | null>(null);

  // Firma y sello digital del profesional
  const [showModalFirma, setShowModalFirma] = React.useState(false);
  const [firmaDataUrl, setFirmaDataUrl] = React.useState<string>(user?.firmaDigitalUrl || '');
  const [matricula, setMatricula] = React.useState<string>(user?.matriculaProfesional || '');
  const [especialidad, setEspecialidad] = React.useState<string>(user?.especialidad || '');
  const [guardandoFirma, setGuardandoFirma] = React.useState(false);
  const [firmaMsg, setFirmaMsg] = React.useState<string | null>(null);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);

  const abrirModalFirma = () => {
    setFirmaDataUrl(user?.firmaDigitalUrl || '');
    setMatricula(user?.matriculaProfesional || '');
    setEspecialidad(user?.especialidad || '');
    setFirmaMsg(null);
    setShowModalFirma(true);
  };

  const limpiarCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setFirmaDataUrl('');
  };

  const handleSubirImagenFirma = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no debe superar los 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFirmaDataUrl(base64);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = base64;
      }
    };
    reader.readAsDataURL(file);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setFirmaDataUrl(canvas.toDataURL('image/png'));
    }
  };

  const handleGuardarFirma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setGuardandoFirma(true);
    setFirmaMsg(null);
    try {
      await api.patch(`/usuarios/${user.id}`, {
        firmaDigitalUrl: firmaDataUrl || null,
        matriculaProfesional: matricula.trim() || null,
        especialidad: especialidad.trim() || null,
      });
      actualizarPerfilLocal({
        firmaDigitalUrl: firmaDataUrl || null,
        matriculaProfesional: matricula.trim() || null,
        especialidad: especialidad.trim() || null,
      });
      setFirmaMsg('¡Firma y matrícula guardadas con éxito! Tus recetas emitidas se sellarán automáticamente.');
      setTimeout(() => setShowModalFirma(false), 1600);
    } catch (err: any) {
      alert(err.message || 'Error al guardar firma');
    } finally {
      setGuardandoFirma(false);
    }
  };

  // Formulario nueva receta
  const [pacienteId, setPacienteId] = React.useState('');
  const [medicamentos, setMedicamentos] = React.useState<any[]>([
    {
      medicamento: 'Amoxicilina + Ácido Clavulánico',
      presentacion: 'Comprimidos 875/125 mg',
      dosis: '1 comprimido',
      via: 'Oral',
      frecuencia: 'cada 12 horas',
      duracion: 'por 7 días',
      indicaciones: 'Tomar al inicio de las comidas principales con abundante agua.',
      cantidad: 14,
    },
  ]);
  const [instruccionesGenerales, setInstruccionesGenerales] = React.useState(
    'Completar el esquema antibiótico indicado. En caso de reacción alérgica o erupción cutánea, suspender y consultar de inmediato.',
  );
  const [guardando, setGuardando] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const cargarDatos = React.useCallback(async () => {
    setLoading(true);
    try {
      const [recetasData, pacData] = await Promise.all([
        api.get('/recetas').catch(() => []),
        api.get('/pacientes?limite=100').catch(() => []),
      ]);
      setRecetas(Array.isArray(recetasData) ? recetasData : (recetasData?.datos || recetasData?.data || []));
      setPacientes(Array.isArray(pacData) ? pacData : (pacData?.datos || pacData?.data || []));
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const descargarPdf = async (id: string, folio: string) => {
    setDescargandoId(id);
    try {
      await api.downloadBlob(`/recetas/${id}/pdf`, `Receta_${folio || id}.pdf`);
    } catch (err: any) {
      alert(err.message || 'Error al descargar PDF');
    } finally {
      setDescargandoId(null);
    }
  };

  const agregarMedicamento = () => {
    setMedicamentos([
      ...medicamentos,
      {
        medicamento: '',
        presentacion: '',
        dosis: '',
        via: 'Oral',
        frecuencia: 'cada 8 horas',
        duracion: 'por 5 días',
        indicaciones: '',
        cantidad: 1,
      },
    ]);
  };

  const eliminarMedicamento = (index: number) => {
    setMedicamentos(medicamentos.filter((_, i) => i !== index));
  };

  const actualizarMedicamento = (index: number, campo: string, valor: any) => {
    const copia = [...medicamentos];
    copia[index] = { ...copia[index], [campo]: valor };
    setMedicamentos(copia);
  };

  const handleCrearReceta = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setFormError(null);

    try {
      await api.post('/recetas', {
        pacienteId,
        medicamentos,
        indicacionesGenerales: instruccionesGenerales,
      });

      setShowModalCrear(false);
      cargarDatos();
    } catch (err: any) {
      setFormError(err.message || 'Error al emitir receta médica');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recetas Médicas y Prescripciones</h1>
          <p className="text-sm text-muted-foreground">
            Emisión con numeración correlativa por clínica y descarga de PDFs oficiales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={abrirModalFirma} className="cursor-pointer">
            <PenTool className="size-4 mr-2 text-primary" />
            {user?.firmaDigitalUrl ? 'Mi Firma y Sello Digital' : 'Configurar Firma y Sello'}
          </Button>
          <Button onClick={() => setShowModalCrear(true)} className="cursor-pointer">
            <Plus className="size-4 mr-2" />
            Emitir Nueva Receta
          </Button>
        </div>
      </div>

      {/* Banner informativo de firma digital */}
      {user?.firmaDigitalUrl ? (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2.5">
            <FileCheck className="size-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Firma y Sello Oficial Activos:</strong> Tus recetas se emitirán con tu rúbrica digitalizada, M.P. <strong>{user.matriculaProfesional || 'Sin mat.'}</strong> y especialidad ({user.especialidad || 'General'}).
            </span>
          </div>
          <button
            onClick={abrirModalFirma}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 underline hover:no-underline cursor-pointer"
          >
            Actualizar
          </button>
        </div>
      ) : (
        <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="size-4 text-amber-600 shrink-0" />
            <span>
              <strong>Firma Digital pendiente:</strong> Aún no has digitalizado tu rúbrica o número de matrícula. Tus recetas saldrán con línea de firma en blanco.
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={abrirModalFirma} className="h-7 text-xs border-amber-500/40 text-amber-700 dark:text-amber-300 cursor-pointer">
            <PenTool className="size-3 mr-1" /> Configurar Ahora
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading && recetas.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
              Cargando recetas emitidas...
            </div>
          ) : recetas.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No hay recetas emitidas aún en este consultorio.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Folio / Número</th>
                    <th className="px-6 py-3 font-semibold">Fecha</th>
                    <th className="px-6 py-3 font-semibold">Paciente</th>
                    <th className="px-6 py-3 font-semibold">Fármacos</th>
                    <th className="px-6 py-3 font-semibold">Estado</th>
                    <th className="px-6 py-3 font-semibold text-right">PDF Oficial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recetas.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-primary">
                        {r.numeroReceta}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(r.fechaEmision).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold">
                          {r.paciente?.nombre} {r.paciente?.apellido || ''}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          DNI: {r.paciente?.dni || 'N/D'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="font-medium">
                          {r.medicamentos?.length || 0} medicamento(s)
                        </div>
                        <div className="text-muted-foreground truncate max-w-xs">
                          {r.medicamentos?.map((m: any) => m.medicamento).join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={r.estado === 'EMITIDA' ? 'success' : 'destructive'}>
                          {r.estado}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 text-xs border-primary/30 text-primary hover:bg-primary/10"
                          disabled={descargandoId === r.id}
                          onClick={() => descargarPdf(r.id, r.numeroReceta)}
                        >
                          <Download className="size-3.5" />
                          {descargandoId === r.id ? 'Descargando...' : 'Descargar PDF'}
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

      {/* MODAL EMITIR RECETA */}
      {showModalCrear && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-2xl w-full shadow-2xl border-border max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Pill className="size-5 text-primary" />
                  Emitir Receta Farmacológica
                </h3>
                <p className="text-xs text-muted-foreground">
                  Se generará el folio correlativo y PDF sellado
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowModalCrear(false)}>
                <X className="size-5" />
              </Button>
            </div>

            <form onSubmit={handleCrearReceta} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
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
                    value={pacienteId}
                    onChange={(e) => setPacienteId(e.target.value)}
                  >
                    <option value="">Seleccione el paciente a prescribir...</option>
                    {pacientes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {p.apellido || ''} ({p.tipoDocumento || 'Doc'}: {p.documentoIdentidad || p.dni || 'S/D'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lista de medicamentos */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Fármacos Prescritos ({medicamentos.length})
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={agregarMedicamento}
                    >
                      <Plus className="size-3 mr-1" />
                      Agregar Fármaco
                    </Button>
                  </div>

                  {medicamentos.map((med, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg border border-border bg-muted/20 space-y-2 relative"
                    >
                      {medicamentos.length > 1 && (
                        <button
                          type="button"
                          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                          onClick={() => eliminarMedicamento(index)}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-6">
                        <Input
                          placeholder="Principio activo o comercial *"
                          required
                          value={med.medicamento}
                          onChange={(e) => actualizarMedicamento(index, 'medicamento', e.target.value)}
                        />
                        <Input
                          placeholder="Presentación (ej. Comprimidos 500mg)"
                          required
                          value={med.presentacion}
                          onChange={(e) => actualizarMedicamento(index, 'presentacion', e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="Dosis (1 comp)"
                          required
                          value={med.dosis}
                          onChange={(e) => actualizarMedicamento(index, 'dosis', e.target.value)}
                        />
                        <Input
                          placeholder="Frecuencia (c/8h)"
                          required
                          value={med.frecuencia}
                          onChange={(e) => actualizarMedicamento(index, 'frecuencia', e.target.value)}
                        />
                        <Input
                          placeholder="Duración (x 7d)"
                          required
                          value={med.duracion}
                          onChange={(e) => actualizarMedicamento(index, 'duracion', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 pt-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Instrucciones Generales al Paciente
                  </label>
                  <textarea
                    rows={2}
                    className="w-full rounded-md border border-input bg-background p-2 text-sm shadow-xs outline-none focus:border-primary"
                    value={instruccionesGenerales}
                    onChange={(e) => setInstruccionesGenerales(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4 border-t border-border flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowModalCrear(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardando}>
                  {guardando ? 'Generando Receta y PDF...' : 'Emitir y Sellar Receta'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL CONFIGURAR FIRMA Y SELLO DIGITAL */}
      {showModalFirma && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-lg w-full shadow-2xl border-border">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <PenTool className="size-5 text-primary" />
                  Firma y Sello Digital del Profesional
                </h3>
                <p className="text-xs text-muted-foreground">
                  Se estampará automáticamente en el pie de página de cada receta médica en PDF
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowModalFirma(false)}>
                <X className="size-5" />
              </Button>
            </div>

            <form onSubmit={handleGuardarFirma}>
              <div className="p-5 space-y-4">
                {firmaMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>{firmaMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Especialidad Médica</label>
                    <Input
                      type="text"
                      placeholder="Ej: Medicina General, Cardiología..."
                      value={especialidad}
                      onChange={(e) => setEspecialidad(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Matrícula Profesional (M.P. / M.N.)</label>
                    <Input
                      type="text"
                      placeholder="Ej: M.P. 12345 / M.N. 98765"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                    />
                  </div>
                </div>

                {/* Área de Dibujo / Carga de Firma */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Trazo de Rúbrica o Firma Gráfica
                    </label>
                    <button
                      type="button"
                      onClick={limpiarCanvas}
                      className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 cursor-pointer"
                    >
                      <Eraser className="size-3.5" /> Limpiar trazo
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-border rounded-xl bg-slate-50 dark:bg-slate-900/50 p-2 text-center flex flex-col items-center justify-center">
                    <canvas
                      ref={canvasRef}
                      width={440}
                      height={140}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="cursor-crosshair bg-white rounded-lg shadow-inner w-full max-w-[440px] h-[140px] touch-none"
                    />
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Firma con tu mouse, touchpad o pantalla táctil dentro del recuadro blanco
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-muted-foreground">O sube un archivo:</span>
                    <label className="text-xs text-primary font-medium hover:underline cursor-pointer flex items-center gap-1">
                      <Upload className="size-3.5" /> Cargar imagen PNG transparente / JPG
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        className="hidden"
                        onChange={handleSubirImagenFirma}
                      />
                    </label>
                  </div>
                </div>

                {/* Previsualización del Sello Médico */}
                <div className="p-3 bg-muted/40 rounded-xl border border-border">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block mb-2">
                    Vista previa de tu estampilla en Recetas PDF
                  </span>
                  <div className="flex flex-col items-center justify-center text-center p-3 bg-white dark:bg-slate-950 rounded-lg border border-border/80 shadow-xs">
                    {firmaDataUrl ? (
                      <img
                        src={firmaDataUrl}
                        alt="Firma Digital"
                        className="h-16 max-w-[180px] object-contain mb-1"
                      />
                    ) : (
                      <div className="h-16 flex items-center justify-center text-xs text-muted-foreground italic">
                        (Sin trazo de firma)
                      </div>
                    )}
                    <div className="w-48 border-t border-slate-400 dark:border-slate-600 mt-1 mb-1"></div>
                    <div className="font-semibold text-xs text-foreground">
                      Dr. {user?.nombre} {user?.apellido || ''}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {matricula ? `M.P.: ${matricula}` : 'M.P.: Sin registrar'} {especialidad ? `• ${especialidad}` : ''}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowModalFirma(false)} disabled={guardandoFirma}>
                  Cerrar
                </Button>
                <Button type="submit" disabled={guardandoFirma} className="cursor-pointer">
                  {guardandoFirma ? (
                    <>
                      <RefreshCw className="size-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4 mr-2" />
                      Guardar Firma y Sello Oficial
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
