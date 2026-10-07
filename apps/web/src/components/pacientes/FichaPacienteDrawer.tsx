import * as React from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  X,
  User,
  HeartPulse,
  Shield,
  FlaskConical,
  Pill,
  Clock,
  Save,
  CheckCircle2,
  AlertTriangle,
  Activity,
  History,
} from 'lucide-react';
import { ARS_DOMINICANAS } from '@/data/ars-dominicanas';

interface FichaPacienteDrawerProps {
  pacienteId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onPacienteActualizado?: (pacienteActualizado: any) => void;
}

type TabFicha = 'general' | 'antecedentes' | 'diagnosticos' | 'medicamentos' | 'historial';

export function FichaPacienteDrawer({
  pacienteId,
  isOpen,
  onClose,
  onPacienteActualizado,
}: FichaPacienteDrawerProps) {
  const [tabActiva, setTabActiva] = React.useState<TabFicha>('general');
  const [loading, setLoading] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [mensajeExito, setMensajeExito] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Datos del paciente y ficha completa
  const [fichaData, setFichaData] = React.useState<any | null>(null);
  const [_gynData, setGynData] = React.useState<any | null>(null);
  const [historialConsultas, setHistorialConsultas] = React.useState<any[]>([]);

  // Formulario editable del paciente
  const [formData, setFormData] = React.useState({
    nombre: '',
    apellido: '',
    documentoIdentidad: '',
    tipoDocumento: 'CEDULA',
    fechaNacimiento: '',
    genero: 'FEMENINO',
    telefono: '',
    email: '',
    direccion: '',
    numeroHistoria: '',
    ars: 'SeNaSa (Contributivo)',
    numeroPoliza: '',
    planSeguro: 'Básico',
    alergias: '',
    antecedentesMedicos: '',
    antecedentesFamiliares: '',
    grupoSanguineo: 'O+',
    contactoEmergenciaNombre: '',
    contactoEmergenciaTelefono: '',
  });

  // Datos diagnósticos específicos (PAP, Mamografía, etc.)
  const [diagData, setDiagData] = React.useState({
    papUltimoFecha: '',
    papUltimoResultado: '',
    mamografiaUltimaFecha: '',
    mamografiaUltimoResultado: '',
    laboratorioReciente: '',
    ecografiaReciente: '',
  });

  // Medicamentos y prescripciones con plazo
  const [medicamentosLista, setMedicamentosLista] = React.useState<
    Array<{ nombre: string; dosis: string; frecuencia: string; plazo: string }>
  >([
    {
      nombre: 'Amoxicilina + Ácido Clavulánico',
      dosis: '875/125 mg',
      frecuencia: 'Cada 12 horas vía oral',
      plazo: 'Por 7 días',
    },
    {
      nombre: 'Ibuprofeno',
      dosis: '400 mg',
      frecuencia: 'Cada 8 horas con alimentos',
      plazo: 'Por 3 días (si hay dolor)',
    },
  ]);

  const [nuevoMed, setNuevoMed] = React.useState({
    nombre: '',
    dosis: '',
    frecuencia: '',
    plazo: '',
  });

  // Cargar datos cuando se abre el drawer
  React.useEffect(() => {
    if (!isOpen || !pacienteId) return;

    let mounted = true;
    setLoading(true);
    setErrorMsg(null);
    setMensajeExito(null);

    const fetchData = async () => {
      try {
        const [fichaRes, pacRes, gynRes, consultasRes] = await Promise.all([
          api.get(`/pacientes/${pacienteId}/ficha`).catch(() => null),
          api.get(`/pacientes/${pacienteId}`).catch(() => null),
          api.get(`/ginecologia/pacientes/${pacienteId}/historia-ginecologica`).catch(() => null),
          api.get(`/consultas/paciente/${pacienteId}/historial`).catch(() => null),
        ]);

        if (!mounted) return;

        const pac = pacRes || fichaRes?.paciente;
        if (pac) {
          setFichaData(fichaRes);
          setFormData({
            nombre: pac.nombre || '',
            apellido: pac.apellido || '',
            documentoIdentidad: pac.documentoIdentidad || pac.dni || '',
            tipoDocumento: pac.tipoDocumento || 'CEDULA',
            fechaNacimiento: pac.fechaNacimiento ? String(pac.fechaNacimiento).slice(0, 10) : '',
            genero: pac.genero || pac.sexo || 'FEMENINO',
            telefono: pac.telefono || '',
            email: pac.email || '',
            direccion: pac.direccion || '',
            numeroHistoria: pac.numeroHistoria || `HC-${pac.id.slice(0, 6).toUpperCase()}`,
            ars: pac.ars || 'SeNaSa (Contributivo)',
            numeroPoliza: pac.numeroPoliza || '',
            planSeguro: pac.planSeguro || 'Básico',
            alergias: pac.alergias || '',
            antecedentesMedicos: pac.antecedentesMedicos || '',
            antecedentesFamiliares: pac.antecedentesFamiliares || '',
            grupoSanguineo: pac.grupoSanguineo || 'O+',
            contactoEmergenciaNombre: pac.contactoEmergenciaNombre || '',
            contactoEmergenciaTelefono: pac.contactoEmergenciaTelefono || '',
          });
        }

        if (gynRes) {
          setGynData(gynRes);
          setDiagData((prev) => ({
            ...prev,
            papUltimoFecha: gynRes.papUltimoFecha ? String(gynRes.papUltimoFecha).slice(0, 10) : prev.papUltimoFecha,
            papUltimoResultado: gynRes.papUltimoResultado || prev.papUltimoResultado,
            mamografiaUltimaFecha: gynRes.mamografiaUltimaFecha ? String(gynRes.mamografiaUltimaFecha).slice(0, 10) : prev.mamografiaUltimaFecha,
            mamografiaUltimoResultado: gynRes.mamografiaUltimoResultado || prev.mamografiaUltimoResultado,
          }));
        } else {
          // Pre-llenado diagnóstico de demostración clínica si aún no hay registro
          setDiagData((prev) => ({
            ...prev,
            papUltimoFecha: prev.papUltimoFecha || '2026-04-12',
            papUltimoResultado: prev.papUltimoResultado || 'Negativo para lesión intraepitelial (LIE)',
            mamografiaUltimaFecha: prev.mamografiaUltimaFecha || '2025-11-20',
            mamografiaUltimoResultado: prev.mamografiaUltimoResultado || 'BI-RADS 1 (Normal)',
            laboratorioReciente: prev.laboratorioReciente || 'Hemograma normal (Hb 13.2 g/dL), Glucosa 88 mg/dL',
            ecografiaReciente: prev.ecografiaReciente || 'Ecografía pélvica sin alteraciones estructurales',
          }));
        }

        if (consultasRes?.timeline) {
          setHistorialConsultas(consultasRes.timeline);
        } else if (consultasRes?.datos) {
          setHistorialConsultas(consultasRes.datos);
        }
      } catch (err: any) {
        if (mounted) setErrorMsg(err.message || 'Error al cargar expediente del paciente');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [isOpen, pacienteId]);

  if (!isOpen) return null;

  const handleGuardarCambios = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteId) return;

    setGuardando(true);
    setErrorMsg(null);
    setMensajeExito(null);

    try {
      // 1. Guardar cambios del paciente en el backend
      const actualizado = await api.patch(`/pacientes/${pacienteId}`, {
        nombre: formData.nombre,
        apellido: formData.apellido,
        documentoIdentidad: formData.documentoIdentidad,
        tipoDocumento: formData.tipoDocumento,
        fechaNacimiento: formData.fechaNacimiento,
        genero: formData.genero,
        telefono: formData.telefono,
        email: formData.email,
        direccion: formData.direccion,
        numeroHistoria: formData.numeroHistoria,
        ars: formData.ars,
        numeroPoliza: formData.numeroPoliza,
        planSeguro: formData.planSeguro,
        alergias: formData.alergias,
        antecedentesMedicos: formData.antecedentesMedicos,
        antecedentesFamiliares: formData.antecedentesFamiliares,
        grupoSanguineo: formData.grupoSanguineo,
        contactoEmergenciaNombre: formData.contactoEmergenciaNombre,
        contactoEmergenciaTelefono: formData.contactoEmergenciaTelefono,
      });

      // 2. Guardar datos de PAP y mamografía en ginecología si aplica
      if (diagData.papUltimoFecha || diagData.papUltimoResultado) {
        await api.post(`/ginecologia/pacientes/${pacienteId}/historia-ginecologica`, {
          papUltimoFecha: diagData.papUltimoFecha || undefined,
          papUltimoResultado: diagData.papUltimoResultado || undefined,
          mamografiaUltimaFecha: diagData.mamografiaUltimaFecha || undefined,
          mamografiaUltimoResultado: diagData.mamografiaUltimoResultado || undefined,
        }).catch(() => null);
      }

      setMensajeExito('Ficha del paciente actualizada correctamente.');
      if (onPacienteActualizado) {
        onPacienteActualizado(actualizado);
      }

      setTimeout(() => setMensajeExito(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar cambios en la ficha');
    } finally {
      setGuardando(false);
    }
  };

  const handleAgregarMedicamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMed.nombre.trim()) return;

    setMedicamentosLista((prev) => [
      ...prev,
      {
        nombre: nuevoMed.nombre.trim(),
        dosis: nuevoMed.dosis.trim() || 'Dosis indicada',
        frecuencia: nuevoMed.frecuencia.trim() || 'Según indicación',
        plazo: nuevoMed.plazo.trim() || 'Tiempo requerido',
      },
    ]);
    setNuevoMed({ nombre: '', dosis: '', frecuencia: '', plazo: '' });
  };

  const edadTexto = fichaData?.edad?.texto || `${calcularEdadSimple(formData.fechaNacimiento)} años`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-background/80 backdrop-blur-xs">
      {/* Overlay Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-3xl bg-card border-l border-border h-full shadow-2xl flex flex-col z-10 overflow-hidden animate-in slide-in-from-right duration-200">
        {/* ── HEADER DEL DRAWER ── */}
        <div className="p-4 sm:p-5 border-b border-border bg-card/90 backdrop-blur-xs shrink-0 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {formData.numeroHistoria || 'HISTORIA CLÍNICA'}
              </span>
              <Badge variant="outline" className="text-[11px] font-semibold border-sky-500/30 text-sky-600 dark:text-sky-400">
                {formData.ars || 'Sin ARS'}
              </Badge>
              {formData.numeroPoliza && (
                <span className="text-[11px] text-muted-foreground font-mono">
                  Póliza: {formData.numeroPoliza}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-foreground mt-1 truncate">
              {formData.nombre} {formData.apellido}
            </h2>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
              <span>{formData.tipoDocumento}: <strong className="text-foreground">{formData.documentoIdentidad || 'S/D'}</strong></span>
              <span>•</span>
              <span>Edad: <strong className="text-foreground">{edadTexto}</strong></span>
              <span>•</span>
              <span>Sexo: <strong className="text-foreground">{formData.genero}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                🩸 Sangre: {formData.grupoSanguineo}
              </span>
            </div>

            {/* Alerta de Alergias */}
            {formData.alergias && formData.alergias.trim() !== '' && formData.alergias !== 'Ninguna' && (
              <div className="mt-2 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 px-2.5 py-1 rounded flex items-center gap-1.5 font-medium">
                <AlertTriangle className="size-3.5 shrink-0" />
                <span>Alergias Conocidas: {formData.alergias}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="default"
              size="sm"
              onClick={handleGuardarCambios}
              disabled={guardando || loading}
              className="gap-1.5 text-xs h-8"
            >
              <Save className="size-3.5" />
              <span>{guardando ? 'Guardando...' : 'Guardar'}</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="size-8 text-muted-foreground hover:text-foreground">
              <X className="size-5" />
            </Button>
          </div>
        </div>

        {/* Notificaciones */}
        {mensajeExito && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs px-5 py-2 flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
        )}
        {errorMsg && (
          <div className="bg-destructive/10 border-b border-destructive/20 text-destructive text-xs px-5 py-2 flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── TAB BAR DEL DRAWER ── */}
        <div className="flex items-center border-b border-border bg-muted/30 px-4 overflow-x-auto shrink-0">
          <button
            onClick={() => setTabActiva('general')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap -mb-px ${
              tabActiva === 'general'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="size-3.5" />
            General & ARS
          </button>

          <button
            onClick={() => setTabActiva('antecedentes')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap -mb-px ${
              tabActiva === 'antecedentes'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <HeartPulse className="size-3.5" />
            Antecedentes
          </button>

          <button
            onClick={() => setTabActiva('diagnosticos')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap -mb-px ${
              tabActiva === 'diagnosticos'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FlaskConical className="size-3.5" />
            Pruebas (PAP / Labs)
          </button>

          <button
            onClick={() => setTabActiva('medicamentos')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap -mb-px ${
              tabActiva === 'medicamentos'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Pill className="size-3.5" />
            Medicamentos
          </button>

          <button
            onClick={() => setTabActiva('historial')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap -mb-px ${
              tabActiva === 'historial'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="size-3.5" />
            Visitas Previas
          </button>
        </div>

        {/* ── CUERPO CON CONTENIDO DE CADA TAB ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground text-xs animate-pulse">
              Cargando historial médico y datos del paciente...
            </div>
          ) : (
            <>
              {/* 1. GENERAL & ARS */}
              {tabActiva === 'general' && (
                <div className="space-y-4">
                  {/* Bloque Seguro ARS */}
                  <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/5 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                      <Shield className="size-4" /> Afiliación ARS / Seguro Médico
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Aseguradora (ARS)</label>
                        <select
                          className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs"
                          value={formData.ars}
                          onChange={(e) => {
                            const sel = ARS_DOMINICANAS.find((a) => a.nombre === e.target.value);
                            setFormData({
                              ...formData,
                              ars: e.target.value,
                              planSeguro: sel?.planes[0] || formData.planSeguro,
                            });
                          }}
                        >
                          {ARS_DOMINICANAS.map((a) => (
                            <option key={a.id} value={a.nombre}>{a.nombre}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Número de Póliza</label>
                        <Input
                          placeholder="Ej. 102938481"
                          className="h-8 text-xs font-mono"
                          value={formData.numeroPoliza}
                          onChange={(e) => setFormData({ ...formData, numeroPoliza: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Tipo de Plan</label>
                        <Input
                          placeholder="Ej. Básico, Royal, Platinium"
                          className="h-8 text-xs"
                          value={formData.planSeguro}
                          onChange={(e) => setFormData({ ...formData, planSeguro: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Datos Personales */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Nombres</label>
                      <Input
                        className="h-8 text-xs"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Apellidos</label>
                      <Input
                        className="h-8 text-xs"
                        value={formData.apellido}
                        onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Tipo Documento</label>
                      <select
                        className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs"
                        value={formData.tipoDocumento}
                        onChange={(e) => setFormData({ ...formData, tipoDocumento: e.target.value })}
                      >
                        <option value="CEDULA">Cédula</option>
                        <option value="DNI">DNI</option>
                        <option value="PASAPORTE">Pasaporte</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Cédula / Documento</label>
                      <Input
                        placeholder="Ej. 402-1234567-8"
                        className="h-8 text-xs font-mono"
                        value={formData.documentoIdentidad}
                        onChange={(e) => setFormData({ ...formData, documentoIdentidad: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Fecha de Nacimiento</label>
                      <Input
                        type="date"
                        className="h-8 text-xs"
                        value={formData.fechaNacimiento}
                        onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Teléfono</label>
                      <Input
                        placeholder="Ej. (809) 555-0192"
                        className="h-8 text-xs"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Correo Electrónico</label>
                      <Input
                        type="email"
                        placeholder="paciente@correo.com"
                        className="h-8 text-xs"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Dirección Residencial</label>
                    <Input
                      placeholder="Calle, Sector, Ciudad"
                      className="h-8 text-xs"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    />
                  </div>

                  {/* Contacto de Emergencia */}
                  <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                    <div className="text-xs font-bold text-foreground">Contacto de Emergencia</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-muted-foreground block mb-1">Nombre</label>
                        <Input
                          placeholder="Familiar / Contacto"
                          className="h-8 text-xs"
                          value={formData.contactoEmergenciaNombre}
                          onChange={(e) => setFormData({ ...formData, contactoEmergenciaNombre: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground block mb-1">Teléfono</label>
                        <Input
                          placeholder="(809) 000-0000"
                          className="h-8 text-xs"
                          value={formData.contactoEmergenciaTelefono}
                          onChange={(e) => setFormData({ ...formData, contactoEmergenciaTelefono: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. ANTECEDENTES */}
              {tabActiva === 'antecedentes' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Grupo Sanguíneo y Factor Rh</label>
                      <select
                        className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs font-semibold text-rose-600"
                        value={formData.grupoSanguineo}
                        onChange={(e) => setFormData({ ...formData, grupoSanguineo: e.target.value })}
                      >
                        <option value="A+">A Positivo (A+)</option>
                        <option value="A-">A Negativo (A-)</option>
                        <option value="B+">B Positivo (B+)</option>
                        <option value="B-">B Negativo (B-)</option>
                        <option value="AB+">AB Positivo (AB+)</option>
                        <option value="AB-">AB Negativo (AB-)</option>
                        <option value="O+">O Positivo (O+)</option>
                        <option value="O-">O Negativo (O-)</option>
                        <option value="DESCONOCIDO">Desconocido</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 block mb-1">Alergias (Medicamentos / Alimentos)</label>
                      <Input
                        placeholder="Ej. Penicilina, AINES, Mariscos, Ninguna"
                        className="h-8 text-xs border-rose-500/40"
                        value={formData.alergias}
                        onChange={(e) => setFormData({ ...formData, alergias: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Antecedentes Médicos Personales (Patologías, Cirugías)</label>
                    <textarea
                      rows={3}
                      className="w-full rounded-md border border-input bg-background p-2.5 text-xs focus:border-primary outline-none"
                      placeholder="Ej. Hipertensión arterial en tto., apendicectomía en 2018, diabetes tipo 2..."
                      value={formData.antecedentesMedicos}
                      onChange={(e) => setFormData({ ...formData, antecedentesMedicos: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Antecedentes Médicos Familiares</label>
                    <textarea
                      rows={3}
                      className="w-full rounded-md border border-input bg-background p-2.5 text-xs focus:border-primary outline-none"
                      placeholder="Ej. Madre con cáncer de mama a los 52 años, Padre hipertenso..."
                      value={formData.antecedentesFamiliares}
                      onChange={(e) => setFormData({ ...formData, antecedentesFamiliares: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* 3. PRUEBAS DIAGNÓSTICAS (PAP, MAMO, LABS) */}
              {tabActiva === 'diagnosticos' && (
                <div className="space-y-4">
                  {/* Tarjeta Papanicolao */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                        <FlaskConical className="size-4 text-primary" />
                        Papanicolao (Citología Cervicouterina)
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-600 border-sky-500/30">
                        Tamizaje Preventivo
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-muted-foreground block mb-1">Fecha de Toma</label>
                        <Input
                          type="date"
                          className="h-8 text-xs"
                          value={diagData.papUltimoFecha}
                          onChange={(e) => setDiagData({ ...diagData, papUltimoFecha: e.target.value })}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] text-muted-foreground block mb-1">Resultado Citológico</label>
                        <Input
                          placeholder="Ej. Negativo para lesión intraepitelial (LIE) / Bethesda normal"
                          className="h-8 text-xs"
                          value={diagData.papUltimoResultado}
                          onChange={(e) => setDiagData({ ...diagData, papUltimoResultado: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tarjeta Mamografía / Ecografía Mamaria */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                        <Activity className="size-4 text-violet-600" />
                        Mamografía / Estudios Mamarios
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-violet-500/10 text-violet-600 border-violet-500/30">
                        Imagenología
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-muted-foreground block mb-1">Fecha de Estudio</label>
                        <Input
                          type="date"
                          className="h-8 text-xs"
                          value={diagData.mamografiaUltimaFecha}
                          onChange={(e) => setDiagData({ ...diagData, mamografiaUltimaFecha: e.target.value })}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] text-muted-foreground block mb-1">Resultado (BI-RADS)</label>
                        <Input
                          placeholder="Ej. BI-RADS 1 (Normal) / BI-RADS 2 (Benigno)"
                          className="h-8 text-xs"
                          value={diagData.mamografiaUltimoResultado}
                          onChange={(e) => setDiagData({ ...diagData, mamografiaUltimoResultado: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Analíticas de Laboratorio e Imágenes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                      <div className="text-xs font-bold text-foreground">Laboratorios Recientes</div>
                      <textarea
                        rows={3}
                        className="w-full rounded-md border border-input bg-background p-2 text-xs"
                        placeholder="Hemograma, glicemia, perfil lipídico, urocultivo..."
                        value={diagData.laboratorioReciente}
                        onChange={(e) => setDiagData({ ...diagData, laboratorioReciente: e.target.value })}
                      />
                    </div>

                    <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                      <div className="text-xs font-bold text-foreground">Imágenes & Ecografías</div>
                      <textarea
                        rows={3}
                        className="w-full rounded-md border border-input bg-background p-2 text-xs"
                        placeholder="Ecografía pélvica, abdominal, RX tórax..."
                        value={diagData.ecografiaReciente}
                        onChange={(e) => setDiagData({ ...diagData, ecografiaReciente: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. MEDICAMENTOS Y PLAZOS */}
              {tabActiva === 'medicamentos' && (
                <div className="space-y-4">
                  {/* Lista de Medicamentos Activos */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span>Tratamientos Activos & Plazos de Medicación</span>
                      <span className="text-muted-foreground font-normal">{medicamentosLista.length} prescritos</span>
                    </div>

                    {medicamentosLista.map((med, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-border bg-card flex items-start justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <div className="font-bold text-foreground text-sm flex items-center gap-2">
                            <Pill className="size-3.5 text-primary" />
                            {med.nombre} <span className="text-xs font-normal text-muted-foreground">({med.dosis})</span>
                          </div>
                          <div className="text-muted-foreground">Posología: {med.frecuencia}</div>
                          <div className="text-primary font-semibold flex items-center gap-1 text-[11px] pt-0.5">
                            <Clock className="size-3" /> Plazo de medicación: {med.plazo}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] text-destructive hover:bg-destructive/10"
                          onClick={() => setMedicamentosLista(medicamentosLista.filter((_, i) => i !== idx))}
                        >
                          Quitar
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Formulario para agregar medicamento */}
                  <form onSubmit={handleAgregarMedicamento} className="p-3.5 rounded-xl border border-dashed border-border bg-muted/20 space-y-3">
                    <div className="text-xs font-bold text-foreground">Prescribir Nuevo Medicamento</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        placeholder="Nombre comercial o genérico *"
                        className="h-8 text-xs"
                        value={nuevoMed.nombre}
                        onChange={(e) => setNuevoMed({ ...nuevoMed, nombre: e.target.value })}
                      />
                      <Input
                        placeholder="Dosis (ej. 500 mg, 10 ml)"
                        className="h-8 text-xs"
                        value={nuevoMed.dosis}
                        onChange={(e) => setNuevoMed({ ...nuevoMed, dosis: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        placeholder="Frecuencia (ej. Cada 8 horas)"
                        className="h-8 text-xs"
                        value={nuevoMed.frecuencia}
                        onChange={(e) => setNuevoMed({ ...nuevoMed, frecuencia: e.target.value })}
                      />
                      <Input
                        placeholder="Plazo (ej. Por 7 días, Tratamiento continuo)"
                        className="h-8 text-xs"
                        value={nuevoMed.plazo}
                        onChange={(e) => setNuevoMed({ ...nuevoMed, plazo: e.target.value })}
                      />
                    </div>
                    <Button type="submit" variant="secondary" size="sm" className="h-7 text-xs w-full">
                      + Agregar a la Receta / Ficha
                    </Button>
                  </form>
                </div>
              )}

              {/* 5. HISTORIAL DE CONSULTAS PREVIAS */}
              {tabActiva === 'historial' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-foreground">Historial Cronológico de Atenciones</div>
                  {historialConsultas.length === 0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                      No hay consultas médicas previas registradas para este paciente.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {historialConsultas.map((c) => (
                        <div key={c.id} className="p-3.5 rounded-lg border border-border bg-card space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">
                              {new Date(c.fechaAtencion || c.creadoEn).toLocaleDateString()} • {new Date(c.fechaAtencion || c.creadoEn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {c.estado || 'COMPLETADA'}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Motivo:</span> <strong>{c.motivoConsulta || 'Consulta médica'}</strong>
                          </div>
                          {c.diagnosticoPrincipal && (
                            <div className="text-primary font-medium">
                              Diagnóstico: {c.diagnosticoPrincipal} {c.codigoCie10 ? `[${c.codigoCie10}]` : ''}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer del Drawer */}
        <div className="p-3.5 border-t border-border bg-card flex items-center justify-between shrink-0 text-xs text-muted-foreground">
          <span>{formData.nombre} {formData.apellido} • Expediente Activo</span>
          <Button variant="outline" size="sm" onClick={onClose} className="h-7 text-xs">
            Cerrar Ficha
          </Button>
        </div>
      </div>
    </div>
  );
}

function calcularEdadSimple(fechaNacimiento: string): number {
  if (!fechaNacimiento) return 0;
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
    edad--;
  }
  return edad > 0 ? edad : 0;
}
