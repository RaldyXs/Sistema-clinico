import * as React from 'react';
import { api } from '@/lib/api';
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
} from 'lucide-react';

export function ConsultasView() {
  const [consultas, setConsultas] = React.useState<any[]>([]);
  const [pacientes, setPacientes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showModalCrear, setShowModalCrear] = React.useState(false);

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Consultas Clínicas y Acto Médico</h1>
          <p className="text-sm text-muted-foreground">
            Historias clínicas digitales, signos vitales, diagnósticos CIE-10 y evolución
          </p>
        </div>
        <Button onClick={() => setShowModalCrear(true)}>
          <Plus className="size-4 mr-2" />
          Nueva Consulta
        </Button>
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
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Fecha Atención</th>
                    <th className="px-6 py-3 font-semibold">Paciente</th>
                    <th className="px-6 py-3 font-semibold">Motivo</th>
                    <th className="px-6 py-3 font-semibold">Diagnóstico (CIE-10)</th>
                    <th className="px-6 py-3 font-semibold">Signos Vitales</th>
                    <th className="px-6 py-3 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {consultas.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">
                        {new Date(c.fechaAtencion).toLocaleDateString()}{' '}
                        {new Date(c.fechaAtencion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold">
                          {c.paciente?.nombre} {c.paciente?.apellido || ''}
                        </div>
                        <div className="text-xs text-muted-foreground">DNI: {c.paciente?.dni || 'N/D'}</div>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate">{c.motivoConsulta}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{c.diagnosticoPrincipal || 'En evaluación'}</div>
                        {c.codigoCie10 && (
                          <span className="text-xs font-mono text-primary font-bold">
                            [{c.codigoCie10}]
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {c.presionSistolica && c.presionDiastolica && (
                          <div>TA: {c.presionSistolica}/{c.presionDiastolica} mmHg</div>
                        )}
                        {c.pesoKg && c.imc && (
                          <div>{c.pesoKg} kg (IMC: {c.imc})</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={c.estado === 'COMPLETADA' ? 'success' : 'secondary'}>
                          {c.estado}
                        </Badge>
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

                {/* Diagnóstico y CIE-10 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Diagnóstico Principal *</label>
                    <Input
                      required
                      placeholder="Ej. Rinofaringitis aguda, Embarazo normal"
                      value={form.diagnosticoPrincipal}
                      onChange={(e) => setForm({ ...form, diagnosticoPrincipal: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Código CIE-10</label>
                    <Input
                      placeholder="Ej. J00, Z34"
                      value={form.codigoCie10}
                      onChange={(e) => setForm({ ...form, codigoCie10: e.target.value.toUpperCase() })}
                    />
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
    </div>
  );
}
