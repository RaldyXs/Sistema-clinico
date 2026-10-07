import * as React from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Stethoscope,
  Plus,
  RefreshCw,
  HeartPulse,
  X,
  FileCheck,
  AlertCircle,
  Search,
  BookOpen,
  Eye,
  Printer,
  Activity,
  FileText,
  User,
  Baby,
  Calculator,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { CATALOGO_CIE10 } from '@/data/cie10';
import { FichaPacienteDrawer } from '@/components/pacientes/FichaPacienteDrawer';

export function ConsultasView() {
  const { user } = useAuth();
  const tieneGinecologia = user?.consultorio?.modulosActivos?.ginecologia !== false;

  const [consultas, setConsultas] = React.useState<any[]>([]);
  const [pacientes, setPacientes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showModalCrear, setShowModalCrear] = React.useState(false);
  const [showModalCalculadora, setShowModalCalculadora] = React.useState(false);
  const [drawerPacienteId, setDrawerPacienteId] = React.useState<string | null>(null);

  // Asistente Obstétrico integrado
  const [mostrarHerramientasObstetricas, setMostrarHerramientasObstetricas] = React.useState(false);
  const [datosCopiados, setDatosCopiados] = React.useState(false);

  const [fur, setFur] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 120);
    return d.toISOString().slice(0, 10);
  });
  const [resultadoObstetrico, setResultadoObstetrico] = React.useState<any | null>(null);

  // Biometría Hadlock
  const [dbp, setDbp] = React.useState<number>(65);
  const [cc, setCc] = React.useState<number>(230);
  const [ca, setCa] = React.useState<number>(210);
  const [lf, setLf] = React.useState<number>(48);
  const [pfeCalculado, setPfeCalculado] = React.useState<number | null>(null);

  const calcularObstetricia = React.useCallback(async (fechaFur: string) => {
    try {
      const data = await api.post('/ginecologia/calculadora-obstetrica', { fechaUltimaRegla: fechaFur });
      setResultadoObstetrico(data);
    } catch {
      // Fallback local fórmula Naegele
      const d = new Date(fechaFur);
      const fpp = new Date(d.getTime() + 280 * 86400000);
      const diffDias = Math.floor((Date.now() - d.getTime()) / 86400000);
      const semanas = Math.floor(diffDias / 7);
      const dias = diffDias % 7;
      setResultadoObstetrico({
        edadGestacionalSemanas: semanas,
        edadGestacionalDias: dias,
        edadGestacionalTexto: `${semanas} semanas + ${dias} días`,
        fechaProbableParto: fpp.toISOString().slice(0, 10),
        trimestre: semanas < 14 ? 1 : semanas < 28 ? 2 : 3,
        ecografiasRecomendadas: [
          { nombre: 'Ecografía Precoz / Viabilidad', semanas: '6 - 10 sem' },
          { nombre: 'Screening 11-14 (Translucencia Nucal)', semanas: '11 - 13.6 sem' },
          { nombre: 'Morfológica Detallada Nivel II', semanas: '20 - 24 sem' },
          { nombre: 'Crecimiento y Doppler Fetal', semanas: '32 - 36 sem' },
        ],
      });
    }
  }, []);

  React.useEffect(() => {
    calcularObstetricia(fur);
  }, [calcularObstetricia, fur]);

  React.useEffect(() => {
    const dbpCm = dbp / 10;
    const ccCm = cc / 10;
    const caCm = ca / 10;
    const lfCm = lf / 10;

    const log10Peso =
      1.3596 -
      0.00386 * caCm * lfCm +
      0.007 * dbpCm +
      0.061 * ccCm +
      0.0424 * caCm +
      0.174 * lfCm;

    const pesoGramos = Math.round(Math.pow(10, log10Peso));
    setPfeCalculado(pesoGramos);
  }, [dbp, cc, ca, lf]);

  const insertarEnConsulta = () => {
    const egTexto = resultadoObstetrico?.edadGestacionalTexto || 'EG en cálculo';
    const fppTexto = resultadoObstetrico?.fechaProbableParto || 'N/D';
    const trimTexto = resultadoObstetrico?.trimestre ? `${resultadoObstetrico.trimestre}° Trimestre` : '';
    const pfeTexto = pfeCalculado ? `${pfeCalculado.toLocaleString()} g (~${(pfeCalculado / 1000).toFixed(2)} kg)` : '';
    const biometriaTexto = `DBP: ${dbp}mm, CC: ${cc}mm, CA: ${ca}mm, LF: ${lf}mm`;

    const textoResumen = `[EVALUACIÓN OBSTÉTRICA: EG ${egTexto} (${trimTexto}) | FPP: ${fppTexto} | PFE Hadlock: ${pfeTexto} (${biometriaTexto})]`;

    setForm((prev) => ({
      ...prev,
      motivoConsulta: prev.motivoConsulta || `Control prenatal (${egTexto})`,
      diagnosticoPrincipal: prev.diagnosticoPrincipal || 'Supervisión de embarazo normal',
      codigoCie10: prev.codigoCie10 || 'Z34.9',
      planTratamiento: prev.planTratamiento
        ? `${prev.planTratamiento}\n\n${textoResumen}`
        : textoResumen,
    }));

    setDatosCopiados(true);
    setTimeout(() => setDatosCopiados(false), 2500);
  };

  // Detalle de consulta para modal
  const [consultaDetalle, setConsultaDetalle] = React.useState<any | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = React.useState(false);

  const verDetalleConsulta = async (c: any) => {
    setConsultaDetalle(c);
    setCargandoDetalle(true);
    try {
      const data = await api.get(`/consultas/${c.id}`);
      if (data) {
        setConsultaDetalle(data);
      }
    } catch (err) {
      console.error('Error al obtener detalle:', err);
    } finally {
      setCargandoDetalle(false);
    }
  };

  // Formulario nueva consulta
  const [form, setForm] = React.useState({
    pacienteId: '',
    motivoConsulta: '',
    enfermedadActual: '',
    pesoKg: 65,
    tallaCm: 165,
    presionSistolica: 120,
    presionDiastolica: 80,
    frecuenciaCardiaca: 75,
    temperatura: 36.6,
    saturacionOxigeno: 98,
    diagnosticoPrincipal: '',
    codigoCie10: '',
    planTratamiento: '',
  });

  const [guardando, setGuardando] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Asistente predictivo CIE-10
  const [busquedaCie10, setBusquedaCie10] = React.useState('');
  const [mostrarDropdownCie, setMostrarDropdownCie] = React.useState(false);

  const sugerenciasCie = React.useMemo(() => {
    if (!busquedaCie10.trim()) return [];
    const q = busquedaCie10.toLowerCase().trim();
    return CATALOGO_CIE10.filter(
      (item) => item.codigo.toLowerCase().includes(q) || item.nombre.toLowerCase().includes(q) || item.categoria.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [busquedaCie10]);

  const imcCalculado = React.useMemo(() => {
    if (form.pesoKg > 0 && form.tallaCm > 0) {
      const metros = form.tallaCm / 100;
      return (form.pesoKg / (metros * metros)).toFixed(1);
    }
    return null;
  }, [form.pesoKg, form.tallaCm]);

  const cargarDatos = React.useCallback(async () => {
    setLoading(true);
    try {
      const [consultasData, pacData] = await Promise.all([
        api.get('/consultas').catch(() => []),
        api.get('/pacientes?limite=100').catch(() => []),
      ]);
      setConsultas(Array.isArray(consultasData) ? consultasData : (consultasData?.datos || consultasData?.data || []));
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

  const handleCrearConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setFormError(null);

    try {
      await api.post('/consultas', {
        pacienteId: form.pacienteId,
        motivoConsulta: form.motivoConsulta,
        enfermedadActual: form.enfermedadActual || undefined,
        pesoKg: form.pesoKg || undefined,
        tallaCm: form.tallaCm || undefined,
        presionSistolica: form.presionSistolica || undefined,
        presionDiastolica: form.presionDiastolica || undefined,
        frecuenciaCardiaca: form.frecuenciaCardiaca || undefined,
        temperatura: form.temperatura || undefined,
        saturacionOxigeno: form.saturacionOxigeno || undefined,
        diagnosticoPrincipal: form.diagnosticoPrincipal,
        codigoCie10: form.codigoCie10 || undefined,
        planTratamiento: form.planTratamiento || undefined,
      });

      setShowModalCrear(false);
      cargarDatos();
    } catch (err: any) {
      setFormError(err.message || 'Error al registrar consulta');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight">Consultas Clínicas y Acto Médico</h1>
          <p className="text-[11px] text-muted-foreground">
            Historias clínicas digitales, signos vitales, diagnósticos CIE-10 y evolución
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tieneGinecologia && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowModalCalculadora(true)}
              className="h-7 text-xs px-2.5 border-pink-500/30 text-pink-600 dark:text-pink-400 hover:bg-pink-500/10 cursor-pointer"
            >
              <Baby className="size-3.5 mr-1" />
              Calculadora Obstétrica
            </Button>
          )}
          <Button size="sm" onClick={() => setShowModalCrear(true)} className="h-7 text-xs px-2.5">
            <Plus className="size-3.5 mr-1" />
            Nueva Consulta
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading && consultas.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-primary" />
              Cargando historial de atenciones clínicas...
            </div>
          ) : consultas.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No se han registrado consultas médicas aún en este consultorio.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-3.5 py-2 font-semibold">Fecha Atención</th>
                    <th className="px-3.5 py-2 font-semibold">Paciente</th>
                    <th className="px-3.5 py-2 font-semibold">Motivo</th>
                    <th className="px-3.5 py-2 font-semibold">Diagnóstico (CIE-10)</th>
                    <th className="px-3.5 py-2 font-semibold">Signos Vitales</th>
                    <th className="px-3.5 py-2 font-semibold">Estado</th>
                    <th className="px-3.5 py-2 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {consultas.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3.5 py-2.5 font-mono text-xs whitespace-nowrap">
                        {new Date(c.fechaAtencion).toLocaleDateString()}{' '}
                        {new Date(c.fechaAtencion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="font-semibold">
                          {c.paciente?.nombre} {c.paciente?.apellido || ''}
                        </div>
                        <div className="text-[11px] text-muted-foreground">DNI: {c.paciente?.dni || 'N/D'}</div>
                      </td>
                      <td className="px-3.5 py-2.5 max-w-xs truncate">{c.motivoConsulta}</td>
                      <td className="px-3.5 py-2.5">
                        <div className="font-medium">{c.diagnosticoPrincipal || 'En evaluación'}</div>
                        {c.codigoCie10 && (
                          <span className="text-[10px] font-mono text-primary font-bold">
                            [{c.codigoCie10}]
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-[11px] text-muted-foreground">
                        {c.presionSistolica && c.presionDiastolica && (
                          <div>TA: {c.presionSistolica}/{c.presionDiastolica} mmHg</div>
                        )}
                        {c.pesoKg && c.imc && (
                          <div>{c.pesoKg} kg (IMC: {c.imc})</div>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <Badge variant={c.estado === 'COMPLETADA' ? 'success' : 'secondary'} className="text-[10px] py-0 px-2">
                          {c.estado}
                        </Badge>
                      </td>
                      <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-primary/40 text-primary hover:bg-primary/10 cursor-pointer"
                          onClick={() => verDetalleConsulta(c)}
                        >
                          <Eye className="size-3.5 mr-1" />
                          Ver Ficha
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

      {/* MODAL NUEVA CONSULTA */}
      {showModalCrear && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-2xl w-full shadow-2xl border-border max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Stethoscope className="size-5 text-primary" />
                  Registro de Acto Médico y Consulta
                </h3>
                <p className="text-xs text-muted-foreground">
                  Anamnesis, biometría, signos vitales y diagnóstico
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowModalCrear(false)}>
                <X className="size-5" />
              </Button>
            </div>

            <form onSubmit={handleCrearConsulta} className="flex flex-col flex-1 overflow-hidden">
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
                    value={form.pacienteId}
                    onChange={(e) => setForm({ ...form, pacienteId: e.target.value })}
                  >
                    <option value="">Seleccione el paciente en consulta...</option>
                    {pacientes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {p.apellido || ''} ({p.tipoDocumento || 'Doc'}: {p.documentoIdentidad || p.dni || 'S/D'})
                      </option>
                    ))}
                  </select>
                  {form.pacienteId && (
                    <div className="flex justify-end pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6 text-primary hover:bg-primary/10 gap-1.5 px-2 font-medium"
                        onClick={() => setDrawerPacienteId(form.pacienteId)}
                      >
                        <Eye className="size-3.5" />
                        Ver / Editar Ficha y Antecedentes (Inline)
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Motivo de Consulta *</label>
                  <Input
                    required
                    placeholder="Ej. Control de salud, Cefalea, Control prenatal semana 20"
                    value={form.motivoConsulta}
                    onChange={(e) => setForm({ ...form, motivoConsulta: e.target.value })}
                  />
                </div>

                {/* Signos Vitales */}
                <div className="p-3 rounded-lg bg-muted/20 border border-border space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <HeartPulse className="size-3.5 text-primary" /> Signos Vitales y Biometría
                    </span>
                    {imcCalculado && (
                      <Badge variant="outline" className="font-mono">
                        IMC: {imcCalculado} kg/m²
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[11px] text-muted-foreground">Peso (kg)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={form.pesoKg}
                        onChange={(e) => setForm({ ...form, pesoKg: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">Talla (cm)</label>
                      <Input
                        type="number"
                        value={form.tallaCm}
                        onChange={(e) => setForm({ ...form, tallaCm: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">TA Sistólica (mmHg)</label>
                      <Input
                        type="number"
                        value={form.presionSistolica}
                        onChange={(e) => setForm({ ...form, presionSistolica: parseInt(e.target.value, 10) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground">TA Diastólica (mmHg)</label>
                      <Input
                        type="number"
                        value={form.presionDiastolica}
                        onChange={(e) => setForm({ ...form, presionDiastolica: parseInt(e.target.value, 10) || 0 })}
                      />
                    </div>
                  </div>
                </div>

                {/* Asistente Especializado: Obstetricia & Feto-Materna */}
                {tieneGinecologia && (
                  <div className="p-3 rounded-lg border border-pink-500/30 bg-pink-500/5 space-y-2.5">
                    <div
                      className="flex items-center justify-between cursor-pointer select-none"
                      onClick={() => setMostrarHerramientasObstetricas((prev) => !prev)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-md bg-pink-500/20 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                          <Baby className="size-3.5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-foreground">
                            Asistente Obstétrico & Biometría Fetal
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-2 hidden sm:inline">
                            (Regla de Naegele, FPP, Hadlock 4P)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] font-mono border-pink-500/30 text-pink-600 dark:text-pink-400">
                          {mostrarHerramientasObstetricas ? 'Ocultar' : 'Desplegar'}
                        </Badge>
                        {mostrarHerramientasObstetricas ? (
                          <ChevronUp className="size-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="size-3.5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {mostrarHerramientasObstetricas && (
                      <div className="space-y-3 pt-2 border-t border-pink-500/20">
                        {/* Fila Naegele: FUR, EG, FPP */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-background/80 p-2.5 rounded-lg border border-pink-500/20">
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                              <Calendar className="size-3 text-pink-500" /> Fecha Última Regla (FUR)
                            </label>
                            <Input
                              type="date"
                              value={fur}
                              onChange={(e) => setFur(e.target.value)}
                              className="h-7 text-xs"
                            />
                          </div>

                          <div className="space-y-0.5 sm:border-l sm:border-border sm:pl-2.5 flex flex-col justify-center">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Edad Gestacional:</span>
                            <span className="text-xs font-bold text-pink-600 dark:text-pink-400">
                              {resultadoObstetrico?.edadGestacionalTexto || '---'}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {resultadoObstetrico?.trimestre ? `${resultadoObstetrico.trimestre}° Trimestre` : ''}
                            </span>
                          </div>

                          <div className="space-y-0.5 sm:border-l sm:border-border sm:pl-2.5 flex flex-col justify-center">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold">FPP Estimada (Naegele):</span>
                            <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                              {resultadoObstetrico?.fechaProbableParto || '---'}
                            </span>
                            <span className="text-[10px] text-muted-foreground">40 semanas de amenorrea</span>
                          </div>
                        </div>

                        {/* Fila Biometría Hadlock */}
                        <div className="space-y-1.5 bg-background/80 p-2.5 rounded-lg border border-pink-500/20">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                              <Calculator className="size-3 text-sky-500" /> Biometría Hadlock (mm) & Peso Fetal
                            </span>
                            <span className="text-xs font-black text-sky-600 dark:text-sky-400">
                              PFE: {pfeCalculado ? `${pfeCalculado.toLocaleString()} g (~${(pfeCalculado / 1000).toFixed(2)} kg)` : '---'}
                            </span>
                          </div>

                          <div className="grid grid-cols-4 gap-1.5">
                            <div>
                              <label className="text-[9px] text-muted-foreground block truncate">DBP (mm)</label>
                              <Input
                                type="number"
                                className="h-6 text-xs px-1.5"
                                value={dbp}
                                onChange={(e) => setDbp(parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-muted-foreground block truncate">CC (mm)</label>
                              <Input
                                type="number"
                                className="h-6 text-xs px-1.5"
                                value={cc}
                                onChange={(e) => setCc(parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-muted-foreground block truncate">CA (mm)</label>
                              <Input
                                type="number"
                                className="h-6 text-xs px-1.5"
                                value={ca}
                                onChange={(e) => setCa(parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-muted-foreground block truncate">LF (mm)</label>
                              <Input
                                type="number"
                                className="h-6 text-xs px-1.5"
                                value={lf}
                                onChange={(e) => setLf(parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Botón de Inserción Automática */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-muted-foreground">
                            {datosCopiados ? (
                              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                                <Check className="size-3" /> ¡Evaluación obstétrica copiada al plan médico!
                              </span>
                            ) : (
                              'Pega automáticamente las semanas, FPP y peso fetal en el plan médico.'
                            )}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            onClick={insertarEnConsulta}
                            className="h-6 text-[11px] px-2.5 bg-pink-600 hover:bg-pink-700 text-white cursor-pointer"
                          >
                            <Sparkles className="size-3 mr-1" />
                            Insertar en Consulta
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Diagnóstico y Asistente Predictivo CIE-10 */}
                <div className="p-3 bg-muted/20 border border-border rounded-lg space-y-2 relative">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="size-3.5 text-primary" /> Asistente de Diagnósticos CIE-10
                    </span>
                    <span className="text-[10px] lowercase font-normal text-muted-foreground">
                      Buscador predictivo por código o patología
                    </span>
                  </div>

                  {/* Buscador predictivo */}
                  <div className="relative">
                    <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Escribe para buscar (ej. hiper, diabetes, asma, control, J00)..."
                      value={busquedaCie10}
                      onChange={(e) => {
                        setBusquedaCie10(e.target.value);
                        setMostrarDropdownCie(true);
                      }}
                      onFocus={() => {
                        if (busquedaCie10) setMostrarDropdownCie(true);
                      }}
                      className="pl-9 h-8 text-xs bg-background"
                    />

                    {mostrarDropdownCie && sugerenciasCie.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-border">
                        {sugerenciasCie.map((item) => (
                          <div
                            key={item.codigo}
                            onClick={() => {
                              setForm((prev) => ({
                                ...prev,
                                codigoCie10: item.codigo,
                                diagnosticoPrincipal: item.nombre,
                              }));
                              setBusquedaCie10('');
                              setMostrarDropdownCie(false);
                            }}
                            className="p-2 text-xs hover:bg-muted/50 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded text-[11px]">
                                {item.codigo}
                              </span>
                              <span className="font-medium text-foreground">{item.nombre}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {item.categoria}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Chips de diagnósticos frecuentes */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <span className="text-[10px] font-semibold text-muted-foreground self-center">Frecuentes:</span>
                    {[
                      { c: 'I10', n: 'Hipertensión esencial (primaria)' },
                      { c: 'E11.9', n: 'Diabetes mellitus tipo 2' },
                      { c: 'J00', n: 'Rinofaringitis aguda [resfriado común]' },
                      { c: 'Z34.9', n: 'Supervisión de embarazo normal' },
                      { c: 'K29.7', n: 'Gastritis, no especificada' },
                      { c: 'Z00.0', n: 'Examen médico general / Chequeo' },
                    ].map((d) => (
                      <button
                        key={d.c}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            codigoCie10: d.c,
                            diagnosticoPrincipal: d.n,
                          }));
                        }}
                        className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-background hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors text-muted-foreground"
                      >
                        {d.c} {d.n.split(' ')[0]}
                      </button>
                    ))}
                  </div>

                  {/* Inputs de confirmación/edición */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-border/60">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Diagnóstico Principal Seleccionado *</label>
                      <Input
                        required
                        placeholder="Ej. Rinofaringitis aguda, Hipertensión arterial"
                        value={form.diagnosticoPrincipal}
                        onChange={(e) => setForm({ ...form, diagnosticoPrincipal: e.target.value })}
                        className="h-8 text-xs font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Código CIE-10</label>
                      <Input
                        placeholder="Ej. J00, I10"
                        value={form.codigoCie10}
                        onChange={(e) => setForm({ ...form, codigoCie10: e.target.value.toUpperCase() })}
                        className="h-8 text-xs font-mono font-bold text-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Plan y Tratamiento</label>
                  <textarea
                    rows={2}
                    className="w-full rounded-md border border-input bg-background p-2 text-sm shadow-xs outline-none focus:border-primary"
                    placeholder="Indicaciones médicas, reposo, pautas de alarma..."
                    value={form.planTratamiento}
                    onChange={(e) => setForm({ ...form, planTratamiento: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-4 border-t border-border flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowModalCrear(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardando}>
                  <FileCheck className="size-4 mr-1.5" />
                  {guardando ? 'Guardando...' : 'Firmar y Guardar Consulta'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL FICHA CLÍNICA DE CONSULTA */}
      {consultaDetalle && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-3xl w-full shadow-2xl border-border max-h-[90vh] flex flex-col print:max-h-none print:shadow-none print:border-none">
            <div className="p-5 border-b border-border flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                <div>
                  <h3 className="text-base font-semibold">Ficha Clínica de Atención Médica</h3>
                  <p className="text-xs text-muted-foreground">
                    Registro de acto médico oficial • {new Date(consultaDetalle.fechaAtencion).toLocaleDateString()}{' '}
                    {new Date(consultaDetalle.fechaAtencion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDrawerPacienteId(consultaDetalle.pacienteId || consultaDetalle.paciente?.id)}
                  className="h-8 text-xs cursor-pointer border-primary/40 text-primary hover:bg-primary/10 gap-1.5"
                >
                  <Eye className="size-3.5" />
                  Ficha Paciente (Drawer)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="h-8 text-xs cursor-pointer border-border text-foreground hover:bg-muted"
                >
                  <Printer className="size-3.5 mr-1.5" />
                  Imprimir Resumen
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => setConsultaDetalle(null)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {cargandoDetalle && (
                <div className="text-center py-2 text-muted-foreground animate-pulse text-xs">
                  Cargando información médica completa...
                </div>
              )}

              {/* Encabezado Paciente y Profesional */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <User className="size-3.5 text-primary" />
                    Paciente
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {consultaDetalle.paciente?.nombre} {consultaDetalle.paciente?.apellido || ''}
                  </div>
                  <div className="text-muted-foreground mt-0.5 space-y-0.5">
                    <div><span className="font-medium text-foreground">DNI / Documento:</span> {consultaDetalle.paciente?.dni || 'N/D'}</div>
                    {consultaDetalle.paciente?.telefono && (
                      <div><span className="font-medium text-foreground">Teléfono:</span> {consultaDetalle.paciente.telefono}</div>
                    )}
                    {consultaDetalle.paciente?.email && (
                      <div><span className="font-medium text-foreground">Email:</span> {consultaDetalle.paciente.email}</div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Stethoscope className="size-3.5 text-primary" />
                    Profesional Asistente
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {consultaDetalle.profesional ? `Dr(a). ${consultaDetalle.profesional.nombre || ''} ${consultaDetalle.profesional.apellido || ''}` : 'Médico General'}
                  </div>
                  <div className="text-muted-foreground mt-0.5 space-y-0.5">
                    <div><span className="font-medium text-foreground">Usuario:</span> {consultaDetalle.profesional?.email || 'N/D'}</div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-medium text-foreground">Estado de Consulta:</span>
                      <Badge variant={consultaDetalle.estado === 'COMPLETADA' ? 'success' : 'secondary'} className="text-[10px] py-0 px-2">
                        {consultaDetalle.estado}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Anamnesis / Motivo */}
              <div className="space-y-2">
                <div className="font-semibold text-xs text-foreground uppercase tracking-wider border-b border-border pb-1 flex items-center gap-1.5">
                  <FileText className="size-3.5 text-primary" />
                  1. Motivo de Consulta y Anamnesis
                </div>
                <div className="p-3 bg-card rounded-lg border border-border/70 space-y-2">
                  <div>
                    <span className="font-semibold text-muted-foreground block text-[11px]">Motivo manifestado:</span>
                    <p className="text-sm font-medium mt-0.5">{consultaDetalle.motivoConsulta}</p>
                  </div>
                  {consultaDetalle.enfermedadActual && (
                    <div className="pt-2 border-t border-border/50">
                      <span className="font-semibold text-muted-foreground block text-[11px]">Enfermedad actual:</span>
                      <p className="mt-0.5 text-muted-foreground whitespace-pre-wrap">{consultaDetalle.enfermedadActual}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Signos Vitales */}
              <div className="space-y-2">
                <div className="font-semibold text-xs text-foreground uppercase tracking-wider border-b border-border pb-1 flex items-center gap-1.5">
                  <Activity className="size-3.5 text-primary" />
                  2. Signos Vitales y Biometría
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  <div className="p-2.5 rounded-lg border border-border bg-muted/20 text-center">
                    <span className="text-[10px] text-muted-foreground block font-medium">Presión Arterial</span>
                    <span className="text-xs font-bold text-foreground">
                      {consultaDetalle.presionSistolica && consultaDetalle.presionDiastolica
                        ? `${consultaDetalle.presionSistolica}/${consultaDetalle.presionDiastolica}`
                        : '--'}
                    </span>
                    <span className="text-[9px] text-muted-foreground block">mmHg</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-border bg-muted/20 text-center">
                    <span className="text-[10px] text-muted-foreground block font-medium">Frec. Cardíaca</span>
                    <span className="text-xs font-bold text-foreground">
                      {consultaDetalle.frecuenciaCardiaca ? `${consultaDetalle.frecuenciaCardiaca}` : '--'}
                    </span>
                    <span className="text-[9px] text-muted-foreground block">lpm</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-border bg-muted/20 text-center">
                    <span className="text-[10px] text-muted-foreground block font-medium">Temperatura</span>
                    <span className="text-xs font-bold text-foreground">
                      {consultaDetalle.temperatura ? `${consultaDetalle.temperatura}` : '--'}
                    </span>
                    <span className="text-[9px] text-muted-foreground block">°C</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-border bg-muted/20 text-center">
                    <span className="text-[10px] text-muted-foreground block font-medium">Sat. O2</span>
                    <span className="text-xs font-bold text-foreground">
                      {consultaDetalle.saturacionOxigeno ? `${consultaDetalle.saturacionOxigeno}%` : '--'}
                    </span>
                    <span className="text-[9px] text-muted-foreground block">SpO2</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-border bg-muted/20 text-center">
                    <span className="text-[10px] text-muted-foreground block font-medium">Peso / Talla</span>
                    <span className="text-xs font-bold text-foreground">
                      {consultaDetalle.pesoKg ? `${consultaDetalle.pesoKg} kg` : '--'}
                    </span>
                    <span className="text-[9px] text-muted-foreground block">
                      {consultaDetalle.tallaCm ? `${consultaDetalle.tallaCm} cm` : '--'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-border bg-muted/20 text-center">
                    <span className="text-[10px] text-muted-foreground block font-medium">IMC</span>
                    <span className="text-xs font-bold text-primary">
                      {consultaDetalle.imc ? `${consultaDetalle.imc}` : '--'}
                    </span>
                    <span className="text-[9px] text-muted-foreground block">kg/m²</span>
                  </div>
                </div>
              </div>

              {/* Diagnósticos (CIE-10) */}
              <div className="space-y-2">
                <div className="font-semibold text-xs text-foreground uppercase tracking-wider border-b border-border pb-1 flex items-center gap-1.5">
                  <BookOpen className="size-3.5 text-primary" />
                  3. Diagnóstico Médico (CIE-10)
                </div>
                <div className="p-3 bg-card rounded-lg border border-border/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-muted-foreground block text-[11px]">Diagnóstico Principal:</span>
                      <p className="text-sm font-bold text-foreground mt-0.5">
                        {consultaDetalle.diagnosticoPrincipal || 'No especificado'}
                      </p>
                    </div>
                    {consultaDetalle.codigoCie10 && (
                      <Badge variant="outline" className="font-mono text-xs px-2.5 py-1 bg-primary/10 text-primary border-primary/30">
                        CIE-10: {consultaDetalle.codigoCie10}
                      </Badge>
                    )}
                  </div>
                  {consultaDetalle.diagnosticosSecundarios && (
                    <div className="pt-2 border-t border-border/50">
                      <span className="font-semibold text-muted-foreground block text-[11px]">Diagnósticos Secundarios:</span>
                      <p className="mt-0.5 text-muted-foreground">{consultaDetalle.diagnosticosSecundarios}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Plan y Tratamiento */}
              <div className="space-y-2">
                <div className="font-semibold text-xs text-foreground uppercase tracking-wider border-b border-border pb-1 flex items-center gap-1.5">
                  <FileCheck className="size-3.5 text-primary" />
                  4. Plan Terapéutico e Indicaciones
                </div>
                <div className="p-3 bg-card rounded-lg border border-border/70 space-y-2">
                  <div>
                    <span className="font-semibold text-muted-foreground block text-[11px]">Tratamiento y Prescripción:</span>
                    <p className="text-xs font-medium mt-0.5 whitespace-pre-wrap">
                      {consultaDetalle.planTratamiento || 'No se registraron indicaciones farmacológicas especiales.'}
                    </p>
                  </div>
                  {consultaDetalle.indicacionesGenerales && (
                    <div className="pt-2 border-t border-border/50">
                      <span className="font-semibold text-muted-foreground block text-[11px]">Indicaciones Generales / Alarma:</span>
                      <p className="mt-0.5 text-muted-foreground whitespace-pre-wrap">{consultaDetalle.indicacionesGenerales}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border flex items-center justify-between print:hidden">
              <span className="text-[11px] text-muted-foreground">
                Documento clínico válido para auditoría interna y seguimiento médico.
              </span>
              <Button variant="outline" size="sm" onClick={() => setConsultaDetalle(null)}>
                Cerrar Ficha
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL CALCULADORA OBSTÉTRICA Y BIOMETRÍA FETAL RÁPIDA */}
      {showModalCalculadora && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-2xl w-full shadow-2xl border-pink-500/30 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-pink-500/20 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                  <Baby className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-1.5">
                    Calculadora Obstétrica & Biometría Fetal
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Cálculo de Naegele (FUR/FPP), percentiles Hadlock y cronograma de ecografías
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 cursor-pointer"
                onClick={() => setShowModalCalculadora(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Naegele */}
              <div className="p-3 rounded-xl border border-pink-500/20 bg-pink-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
                    <Calendar className="size-3.5" /> Regla de Naegele
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-muted-foreground uppercase font-semibold">FUR:</label>
                    <Input
                      type="date"
                      value={fur}
                      onChange={(e) => setFur(e.target.value)}
                      className="h-7 text-xs w-36"
                    />
                  </div>
                </div>

                {resultadoObstetrico && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-lg bg-pink-500/10 border border-pink-500/20">
                      <span className="text-[10px] text-muted-foreground block">Edad Gestacional</span>
                      <span className="text-sm font-bold text-pink-600 dark:text-pink-400">
                        {resultadoObstetrico.edadGestacionalTexto}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20">
                      <span className="text-[10px] text-muted-foreground block">FPP (Naegele)</span>
                      <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
                        {resultadoObstetrico.fechaProbableParto}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-[10px] text-muted-foreground block">Trimestre</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {resultadoObstetrico.trimestre}° Trimestre
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Hadlock */}
              <div className="p-3 rounded-xl border border-sky-500/20 bg-sky-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                    <Calculator className="size-3.5" /> Biometría Hadlock 4-Parámetros
                  </span>
                  <span className="text-[10px] text-muted-foreground">Medidas en milímetros (mm)</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">DBP (Biparietal)</label>
                    <Input
                      type="number"
                      className="h-7 text-xs"
                      value={dbp}
                      onChange={(e) => setDbp(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">CC (Cefálica)</label>
                    <Input
                      type="number"
                      className="h-7 text-xs"
                      value={cc}
                      onChange={(e) => setCc(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">CA (Abdominal)</label>
                    <Input
                      type="number"
                      className="h-7 text-xs"
                      value={ca}
                      onChange={(e) => setCa(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">LF (Femoral)</label>
                    <Input
                      type="number"
                      className="h-7 text-xs"
                      value={lf}
                      onChange={(e) => setLf(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/30 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-sky-600 dark:text-sky-400 block">
                    Peso Fetal Estimado (Hadlock)
                  </span>
                  <span className="text-2xl font-black text-foreground">
                    {pfeCalculado ? `${pfeCalculado.toLocaleString()} g` : '---'}
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    {pfeCalculado ? `Equivalente aproximado: ${(pfeCalculado / 1000).toFixed(2)} kg` : ''}
                  </span>
                </div>
              </div>

              {/* Cronograma de ecografías */}
              {resultadoObstetrico?.ecografiasRecomendadas && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Sparkles className="size-3 text-amber-500" /> Cronograma de Ecografías Recomendadas
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {resultadoObstetrico.ecografiasRecomendadas.map((eco: any, i: number) => (
                      <div key={i} className="p-2 rounded-lg border border-border bg-card flex items-center justify-between text-[11px]">
                        <span className="font-medium truncate mr-1">{eco.nombre}</span>
                        <Badge variant="outline" className="font-mono text-[9px] shrink-0">
                          {eco.semanas}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-border flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowModalCalculadora(false)}
              >
                Cerrar
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs bg-pink-600 hover:bg-pink-700 text-white cursor-pointer"
                onClick={() => {
                  setShowModalCalculadora(false);
                  setShowModalCrear(true);
                  setMostrarHerramientasObstetricas(true);
                }}
              >
                <Plus className="size-3.5 mr-1" />
                Iniciar Consulta con estos datos
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Drawer Lateral de Ficha de Paciente Inline */}
      <FichaPacienteDrawer
        pacienteId={drawerPacienteId}
        isOpen={Boolean(drawerPacienteId)}
        onClose={() => setDrawerPacienteId(null)}
        onPacienteActualizado={() => cargarDatos()}
      />
    </div>
  );
}
