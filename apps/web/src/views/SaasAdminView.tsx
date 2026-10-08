import * as React from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Globe2,
  Building2,
  DollarSign,
  Users,
  Stethoscope,
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  Search,
  ArrowUpRight,
  Power,
  Zap,
  Check,
  X,
  AlertCircle,
  CreditCard,
  PlusCircle,
  Layers,
  PieChart,
  ShieldCheck,
  Server,
} from 'lucide-react';

interface GlobalMetricas {
  totalConsultorios: number;
  consultoriosActivos: number;
  consultoriosSuspendidos: number;
  totalMedicos: number;
  totalPacientes: number;
  totalConsultas: number;
  mrrEstimado: number;
}

interface TenantItem {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  activo: boolean;
  creadoEn: string;
  plan: string;
  planCodigo: string;
  estadoSuscripcion: string;
  totalMedicos: number;
  totalPacientes: number;
}

interface PlanItem {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  precioMensual: number;
  precioAnual: number;
  maxMedicos: number;
  maxPacientes: number;
  maxAlmacenamientoMb: number;
  caracteristicas: string[];
  destacado: boolean;
}

interface SolicitudPlanItem {
  id: string;
  consultorioId: string;
  consultorio?: {
    id: string;
    nombre: string;
    email: string | null;
    telefono: string | null;
  };
  planId: string;
  plan?: {
    id: string;
    codigo: string;
    nombre: string;
  };
  periodo: string;
  monto: number;
  referenciaTransferencia: string;
  bancoOrigen: string | null;
  notas: string | null;
  estado: string;
  creadoEn: string;
}

type SaasSubTab = 'clinicas' | 'solicitudes' | 'planes' | 'metricas';

export function SaasAdminView() {
  const { token } = useAuth();
  const [activeSubTab, setActiveSubTab] = React.useState<SaasSubTab>('clinicas');
  const [metricas, setMetricas] = React.useState<GlobalMetricas | null>(null);
  const [distribucionPlanes, setDistribucionPlanes] = React.useState<Record<string, number>>({});
  const [consultorios, setConsultorios] = React.useState<TenantItem[]>([]);
  const [planes, setPlanes] = React.useState<PlanItem[]>([]);
  const [solicitudes, setSolicitudes] = React.useState<SolicitudPlanItem[]>([]);
  const [busqueda, setBusqueda] = React.useState('');
  const [filtroEstado, setFiltroEstado] = React.useState<'todos' | 'activos' | 'suspendidos'>('todos');
  const [isLoading, setIsLoading] = React.useState(false);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  // Modal para cambiar de plan
  const [selectedTenantForPlan, setSelectedTenantForPlan] = React.useState<TenantItem | null>(null);
  const [nuevoPlanCodigo, setNuevoPlanCodigo] = React.useState('PROFESIONAL');

  // Modal para registrar nueva clínica
  const [showModalCrearClinica, setShowModalCrearClinica] = React.useState(false);
  const [formNuevaClinica, setFormNuevaClinica] = React.useState({
    nombreConsultorio: '',
    telefono: '',
    direccion: '',
    especialidadPrincipal: 'MEDICINA_GENERAL',
    adminNombre: '',
    adminApellido: '',
    adminEmail: '',
    adminPassword: '',
    planCodigo: 'PROFESIONAL',
    periodo: 'MENSUAL',
  });
  const [creandoClinica, setCreandoClinica] = React.useState(false);
  const [errorNuevaClinica, setErrorNuevaClinica] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [dataDash, dataTenants, dataPlanes, dataSols] = await Promise.all([
        api.get('/saas/dashboard'),
        api.get('/saas/consultorios'),
        api.get('/saas/planes'),
        api.get('/saas/solicitudes?pendientes=true').catch(() => []),
      ]);

      setMetricas(dataDash.metricas);
      setDistribucionPlanes(dataDash.distribucionPlanes || {});
      setConsultorios(dataTenants);
      setPlanes(dataPlanes);
      setSolicitudes(Array.isArray(dataSols) ? dataSols : []);
    } catch (e) {
      console.error('Error cargando datos SaaS:', e);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleEstadoTenant = async (tenant: TenantItem) => {
    if (!token) return;
    setActionLoadingId(tenant.id);
    try {
      await api.patch(`/saas/consultorios/${tenant.id}/estado`, { activo: !tenant.activo });
      await fetchData();
    } catch (e) {
      console.error('Error cambiando estado del tenant:', e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCambiarPlanTenant = async () => {
    if (!token || !selectedTenantForPlan) return;
    setActionLoadingId(selectedTenantForPlan.id);
    try {
      await api.patch(`/saas/consultorios/${selectedTenantForPlan.id}/plan`, {
        planCodigo: nuevoPlanCodigo,
        periodo: 'MENSUAL',
      });
      setSelectedTenantForPlan(null);
      await fetchData();
    } catch (e) {
      console.error('Error cambiando plan:', e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAprobarSolicitud = async (solicitud: SolicitudPlanItem) => {
    const clinica = solicitud.consultorio?.nombre || 'la clínica';
    const planNom = solicitud.plan?.nombre || solicitud.plan?.codigo || 'plan';
    if (!confirm(`¿Confirmas que recibiste la transferencia bancaria por $${solicitud.monto} para activar el plan "${planNom}" a "${clinica}"?`)) {
      return;
    }
    setActionLoadingId(solicitud.id);
    try {
      await api.post(`/saas/solicitudes/${solicitud.id}/aprobar`, {});
      alert(`¡Plan activado exitosamente para ${clinica}!`);
      await fetchData();
    } catch (e: any) {
      alert(e.message || 'Error al aprobar solicitud');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRechazarSolicitud = async (solicitud: SolicitudPlanItem) => {
    const motivo = prompt('Ingresa el motivo del rechazo:', 'Transferencia no confirmada en cuenta bancaria');
    if (motivo === null) return;
    setActionLoadingId(solicitud.id);
    try {
      await api.post(`/saas/solicitudes/${solicitud.id}/rechazar`, { motivo });
      alert('Solicitud rechazada');
      await fetchData();
    } catch (e: any) {
      alert(e.message || 'Error al rechazar solicitud');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCrearClinica = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreandoClinica(true);
    setErrorNuevaClinica(null);
    try {
      await api.post('/saas/crear-clinica', formNuevaClinica);
      setShowModalCrearClinica(false);
      setFormNuevaClinica({
        nombreConsultorio: '',
        telefono: '',
        direccion: '',
        especialidadPrincipal: 'MEDICINA_GENERAL',
        adminNombre: '',
        adminApellido: '',
        adminEmail: '',
        adminPassword: '',
        planCodigo: 'PROFESIONAL',
        periodo: 'MENSUAL',
      });
      alert('¡Nueva clínica registrada y aprovisionada exitosamente!');
      await fetchData();
    } catch (err: any) {
      setErrorNuevaClinica(err.message || 'Error al registrar la clínica');
    } finally {
      setCreandoClinica(false);
    }
  };

  const consultoriosFiltrados = consultorios.filter((c) => {
    if (filtroEstado === 'activos' && !c.activo) return false;
    if (filtroEstado === 'suspendidos' && c.activo) return false;

    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      c.plan.toLowerCase().includes(q)
    );
  });

  // Cálculo de porcentajes para pestaña de métricas
  const totalClinicas = metricas?.totalConsultorios || 1;
  const tasaActivas = Math.round(((metricas?.consultoriosActivos || 0) / totalClinicas) * 100);
  const arrEstimado = (metricas?.mrrEstimado || 0) * 12;

  return (
    <div className="space-y-4">
      {/* Header General del SuperAdmin */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Globe2 className="size-4.5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Consola SuperAdmin
                <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider border-primary/30 text-primary">
                  SaaS Multi-Tenant
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Centro de comando general de suscripciones, clínicas clientes y métricas de plataforma.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => setShowModalCrearClinica(true)}
            className="gap-1.5 text-xs h-8 px-3 font-semibold shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
          >
            <PlusCircle className="size-4" /> Registrar Clínica
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="gap-1.5 text-xs h-8 px-2.5 cursor-pointer">
            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* 4 KPIs de Alto Nivel Ejecutivos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">MRR Actual</p>
              <p className="text-xl sm:text-2xl font-black text-foreground mt-0.5 truncate">
                ${metricas?.mrrEstimado?.toFixed(2) ?? '0.00'}
              </p>
              <p className="text-[10px] text-emerald-600 font-medium mt-0.5 flex items-center gap-0.5">
                <TrendingUp className="size-3 shrink-0" /> Recurrente mensual
              </p>
            </div>
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <DollarSign className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Organizaciones / Centros</p>
              <p className="text-xl sm:text-2xl font-black text-foreground mt-0.5">
                {metricas?.totalConsultorios ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                <span className="text-emerald-600 font-semibold">{metricas?.consultoriosActivos ?? 0} activas</span> •{' '}
                <span className="text-amber-600 font-semibold">{metricas?.consultoriosSuspendidos ?? 0} susp.</span>
              </p>
            </div>
            <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Profesionales Registrados</p>
              <p className="text-xl sm:text-2xl font-black text-foreground mt-0.5">
                {metricas?.totalMedicos ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Médicos y especialistas</p>
            </div>
            <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
              <Stethoscope className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Pacientes / Clientes</p>
              <p className="text-xl sm:text-2xl font-black text-foreground mt-0.5">
                {metricas?.totalPacientes ?? 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {metricas?.totalConsultas ?? 0} atenciones registradas
              </p>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Users className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subtabs de Navegación Ejecutiva */}
      <div className="flex items-center gap-1.5 border-b border-border pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('clinicas')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'clinicas'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <Building2 className="size-3.5" />
          Clínicas & Inquilinos
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            activeSubTab === 'clinicas' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            {consultorios.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('solicitudes')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'solicitudes'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <CreditCard className="size-3.5" />
          Transferencias Bancarias
          {solicitudes.length > 0 ? (
            <Badge className="bg-amber-500 text-white font-bold text-[10px] px-1.5 py-0">
              {solicitudes.length}
            </Badge>
          ) : (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeSubTab === 'solicitudes' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              0
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('planes')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'planes'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <Zap className="size-3.5" />
          Catálogo de Planes
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            activeSubTab === 'planes' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            {planes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('metricas')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'metricas'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <PieChart className="size-3.5" />
          Crecimiento & Plataforma
        </button>
      </div>

      {/* CONTENIDO DE LA PESTAÑA: CLÍNICAS */}
      {activeSubTab === 'clinicas' && (
        <Card className="border-border shadow-xs">
          <CardHeader className="p-4 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/70">
            <div>
              <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                Directorio Maestro de Clínicas Inquilinas
              </CardTitle>
              <CardDescription className="text-xs">
                Control de estados operativos, suscripciones activas y asignación de planes.
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Filtro por estado */}
              <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/30">
                <button
                  type="button"
                  onClick={() => setFiltroEstado('todos')}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all ${
                    filtroEstado === 'todos' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Todas ({consultorios.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroEstado('activos')}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all ${
                    filtroEstado === 'activos' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Activas ({consultorios.filter(c => c.activo).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroEstado('suspendidos')}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all ${
                    filtroEstado === 'suspendidos' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Suspendidas ({consultorios.filter(c => !c.activo).length})
                </button>
              </div>

              {/* Búsqueda */}
              <div className="relative w-full sm:w-64">
                <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por clínica o correo..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="p-3">Clínica / Inquilino</th>
                    <th className="p-3">Plan Asignado</th>
                    <th className="p-3">Estado Suscripción</th>
                    <th className="p-3 text-center">Médicos</th>
                    <th className="p-3 text-center">Pacientes</th>
                    <th className="p-3">Estado Operativo</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {consultoriosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-muted-foreground">
                        <Building2 className="size-8 mx-auto mb-2 opacity-30" />
                        <p className="font-medium text-foreground">No se encontraron clínicas inquilinas</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Prueba ajustando los filtros de búsqueda o registra una nueva clínica.</p>
                      </td>
                    </tr>
                  ) : (
                    consultoriosFiltrados.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-foreground text-xs">{c.nombre}</div>
                          <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            {c.email || 'Sin correo'} • {c.telefono || 'Sin teléfono'}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="font-bold text-[11px] border-primary/30 text-primary">
                            {c.plan}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={`text-[10px] font-semibold ${
                              c.estadoSuscripcion === 'ACTIVA'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300'
                                : 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300'
                            }`}
                          >
                            {c.estadoSuscripcion}
                          </Badge>
                        </td>
                        <td className="p-3 text-center font-bold text-foreground">{c.totalMedicos}</td>
                        <td className="p-3 text-center font-bold text-foreground">{c.totalPacientes}</td>
                        <td className="p-3">
                          {c.activo ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20">
                              <span className="size-1.5 rounded-full bg-red-500"></span>
                              Suspendido
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-2 font-medium cursor-pointer"
                              onClick={() => setSelectedTenantForPlan(c)}
                            >
                              Cambiar Plan
                            </Button>
                            <Button
                              size="sm"
                              variant={c.activo ? 'destructive' : 'default'}
                              className="text-xs h-7 px-2 font-medium cursor-pointer"
                              disabled={actionLoadingId === c.id}
                              onClick={() => handleToggleEstadoTenant(c)}
                            >
                              <Power className="size-3 mr-1" />
                              {c.activo ? 'Suspender' : 'Reactivar'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CONTENIDO DE LA PESTAÑA: BANDEJA DE TRANSFERENCIAS */}
      {activeSubTab === 'solicitudes' && (
        <Card className="border-border shadow-xs">
          <CardHeader className="bg-amber-500/5 border-b border-border/80 py-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                <CreditCard className="size-5" />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                  Bandeja de Transferencias Bancarias
                  {solicitudes.length > 0 ? (
                    <Badge className="bg-amber-500 text-white font-bold text-[10px] px-2">
                      {solicitudes.length} pendiente{solicitudes.length > 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                      Al día
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Verifica las transferencias reportadas por los clientes en tu cuenta de banco y autoriza la activación del servicio.
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="gap-1 text-xs h-7 self-start sm:self-auto">
              <RefreshCw className={`size-3 ${isLoading ? 'animate-spin' : ''}`} /> Refrescar
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            {solicitudes.length === 0 ? (
              <div className="py-12 px-6 text-center text-xs text-muted-foreground space-y-2">
                <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="size-6" />
                </div>
                <p className="font-bold text-sm text-foreground">No hay transferencias bancarias pendientes</p>
                <p className="text-xs max-w-md mx-auto">
                  Todas las solicitudes de suscripción y cambio de plan han sido procesadas. Cuando una clínica reporte un comprobante bancario, aparecerá en esta bandeja para su activación.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground text-left">
                      <th className="p-3 font-semibold">Fecha Reporte</th>
                      <th className="p-3 font-semibold">Clínica Solicitante</th>
                      <th className="p-3 font-semibold">Plan Solicitado</th>
                      <th className="p-3 font-semibold">Período</th>
                      <th className="p-3 font-semibold">Monto</th>
                      <th className="p-3 font-semibold">Nº Comprobante / Ref</th>
                      <th className="p-3 font-semibold">Banco / Notas</th>
                      <th className="p-3 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {solicitudes.map((sol) => (
                      <tr key={sol.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 text-muted-foreground whitespace-nowrap">
                          {new Date(sol.creadoEn).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-3 font-medium text-foreground">
                          <div className="font-bold">{sol.consultorio?.nombre || 'Clínica'}</div>
                          <div className="text-[10px] text-muted-foreground">{sol.consultorio?.email || 'Sin correo'}</div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="font-bold border-primary/30 text-primary">
                            {sol.plan?.nombre || sol.plan?.codigo}
                          </Badge>
                        </td>
                        <td className="p-3 capitalize text-muted-foreground">
                          {sol.periodo.toLowerCase()}
                        </td>
                        <td className="p-3 font-bold text-foreground">
                          ${Number(sol.monto).toFixed(2)}
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className="font-mono text-xs font-bold text-foreground">
                            #{sol.referenciaTransferencia}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground text-[11px] max-w-[200px] truncate">
                          {sol.bancoOrigen ? <span className="font-semibold text-foreground">{sol.bancoOrigen}: </span> : null}
                          {sol.notas || 'Sin notas adicionales'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleAprobarSolicitud(sol)}
                              disabled={actionLoadingId === sol.id}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1 px-2.5 cursor-pointer shadow-xs"
                            >
                              <Check className="size-3.5" /> Aprobar y Activar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRechazarSolicitud(sol)}
                              disabled={actionLoadingId === sol.id}
                              className="h-7 text-xs font-semibold gap-1 px-2 cursor-pointer shadow-xs"
                            >
                              <X className="size-3.5" /> Rechazar
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
      )}

      {/* CONTENIDO DE LA PESTAÑA: PLANES */}
      {activeSubTab === 'planes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Zap className="size-4.5 text-amber-500" /> Catálogo Comercial de Planes SaaS
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tarifas comerciales vigentes, límites de almacenamiento y características de cada nivel.
              </p>
            </div>
            <Badge variant="outline" className="font-medium text-xs">
              Moneda: USD ($)
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {planes.map((p) => (
              <Card
                key={p.id}
                className={`relative flex flex-col justify-between transition-all ${
                  p.destacado ? 'border-primary shadow-md bg-primary/5 ring-1 ring-primary/20' : 'border-border shadow-xs'
                }`}
              >
                {p.destacado && (
                  <div className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    Más Popular
                  </div>
                )}
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-xs font-bold">
                      {p.codigo}
                    </Badge>
                    <span className="text-xs font-semibold text-primary">
                      {distribucionPlanes[p.codigo] || 0} suscriptores
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold mt-2">{p.nombre}</CardTitle>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.descripcion}</p>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3.5">
                  <div className="flex items-baseline gap-1 border-b border-border pb-3">
                    <span className="text-3xl font-black text-foreground">${Number(p.precioMensual).toFixed(0)}</span>
                    <span className="text-xs text-muted-foreground font-medium">/ mes</span>
                    <span className="text-[11px] text-muted-foreground ml-auto font-medium">
                      (${Number(p.precioAnual).toFixed(0)} / año)
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Límite Médicos:</span>
                      <span className="font-bold text-foreground">
                        {p.maxMedicos > 100 ? 'Ilimitados' : p.maxMedicos}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Límite Pacientes:</span>
                      <span className="font-bold text-foreground">
                        {p.maxPacientes > 10000 ? 'Ilimitados' : p.maxPacientes.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Almacenamiento:</span>
                      <span className="font-bold text-foreground">
                        {p.maxAlmacenamientoMb / 1024} GB
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                    {p.caracteristicas.map((c, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{c}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* CONTENIDO DE LA PESTAÑA: MÉTRICAS & CRECIMIENTO */}
      {activeSubTab === 'metricas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <PieChart className="size-4.5 text-primary" /> Salud del Negocio SaaS & Rendimiento Global
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Indicadores financieros consolidados, cuota de planes y estabilidad técnica del ecosistema.
              </p>
            </div>
            <Badge variant="outline" className="text-[11px] font-mono border-emerald-500/40 text-emerald-600 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500"></span>
              Plataforma 100% Operativa
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Tarjeta de Proyección Financiera */}
            <Card className="border-border shadow-xs">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="size-4 text-emerald-600" />
                  Rendimiento Financiero SaaS
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Ingreso Mensual (MRR)</span>
                    <span className="text-xl font-black text-foreground">${metricas?.mrrEstimado?.toFixed(2) ?? '0.00'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground block text-[11px]">Proyección Anual (ARR)</span>
                    <span className="text-xl font-black text-primary">${arrEstimado.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Tasa de Clínicas Activas</span>
                    <span className="font-bold text-emerald-600">{tasaActivas}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, tasaActivas))}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Distribución de Planes */}
            <Card className="border-border shadow-xs">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Layers className="size-4 text-primary" />
                  Distribución de Clientes por Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-3 text-xs">
                {planes.map((p) => {
                  const subs = distribucionPlanes[p.codigo] || 0;
                  const pct = totalClinicas > 0 ? Math.round((subs / totalClinicas) * 100) : 0;
                  return (
                    <div key={p.codigo} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">{p.nombre}</span>
                        <span className="font-mono text-muted-foreground">{subs} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Integridad de Arquitectura Multi-Tenant */}
            <Card className="border-border shadow-xs">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  Aislamiento y Seguridad Tenant
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-2.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Server className="size-4 text-primary shrink-0" />
                  <span>PostgreSQL 16 Multi-Tenant</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Cada consulta médica, historia clínica y paciente se encuentra estrictamente aislado por la clave de partición <code className="text-primary font-mono font-bold">consultorioId</code>.
                </p>
                <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                  <span>Total Consultas Médicas:</span>
                  <span className="font-bold text-foreground">{metricas?.totalConsultas ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span>Total Pacientes Registrados:</span>
                  <span className="font-bold text-foreground">{metricas?.totalPacientes ?? 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Modal: Cambiar Plan de una Clínica */}
      {selectedTenantForPlan && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                <ArrowUpRight className="size-5 text-primary" /> Modificar Plan Comercial
              </h3>
              <button
                onClick={() => setSelectedTenantForPlan(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Selecciona el nuevo nivel comercial para <span className="font-bold text-foreground">{selectedTenantForPlan.nombre}</span>:
            </p>
            <div className="space-y-2">
              {['BASICO', 'PROFESIONAL', 'ENTERPRISE'].map((codigo) => (
                <label
                  key={codigo}
                  className={`flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    nuevoPlanCodigo === codigo
                      ? 'border-primary bg-primary/10 font-bold'
                      : 'border-border bg-card hover:bg-muted/40'
                  }`}
                >
                  <span className="font-semibold">Plan {codigo}</span>
                  <input
                    type="radio"
                    name="nuevoPlan"
                    value={codigo}
                    checked={nuevoPlanCodigo === codigo}
                    onChange={(e) => setNuevoPlanCodigo(e.target.value)}
                    className="accent-primary"
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button size="sm" variant="outline" onClick={() => setSelectedTenantForPlan(null)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleCambiarPlanTenant} disabled={actionLoadingId === selectedTenantForPlan.id}>
                {actionLoadingId === selectedTenantForPlan.id ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar Nueva Clínica desde SuperAdmin */}
      {showModalCrearClinica && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="max-w-xl w-full shadow-2xl border-border animate-in fade-in zoom-in-95 duration-150 my-8">
            <CardHeader className="border-b border-border flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Building2 className="size-5 text-primary" /> Registrar Nueva Clínica Inquilina
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Aprovisiona un nuevo centro médico y crea su usuario Director Médico tras confirmar su pago.
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowModalCrearClinica(false)}>
                <X className="size-4" />
              </Button>
            </CardHeader>

            <form onSubmit={handleCrearClinica}>
              <CardContent className="pt-5 space-y-4 text-xs">
                {errorNuevaClinica && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{errorNuevaClinica}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">
                    Nombre del Centro Médico o Consultorio <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Ej: Policlínica Los Ángeles, Centro Odontológico DentalCare"
                    value={formNuevaClinica.nombreConsultorio}
                    onChange={(e) =>
                      setFormNuevaClinica({ ...formNuevaClinica, nombreConsultorio: e.target.value })
                    }
                    required
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">Teléfono Institucional</label>
                    <Input
                      placeholder="Ej: +1 (809) 555-0199"
                      value={formNuevaClinica.telefono}
                      onChange={(e) =>
                        setFormNuevaClinica({ ...formNuevaClinica, telefono: e.target.value })
                      }
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">Dirección Física</label>
                    <Input
                      placeholder="Ej: Av. Principal #102"
                      value={formNuevaClinica.direccion}
                      onChange={(e) =>
                        setFormNuevaClinica({ ...formNuevaClinica, direccion: e.target.value })
                      }
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">
                    Nicho de Negocio / Especialidad de Servicio <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={formNuevaClinica.especialidadPrincipal}
                    onChange={(e) =>
                      setFormNuevaClinica({ ...formNuevaClinica, especialidadPrincipal: e.target.value })
                    }
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                  >
                    <option value="MEDICINA_GENERAL">🏥 Medicina General & Consultorios Médicos</option>
                    <option value="GINECOLOGIA">👶 Ginecología & Salud Materna</option>
                    <option value="ODONTOLOGIA">🦷 Odontología & Clínicas Dentales</option>
                    <option value="PSICOLOGIA">🧠 Psicología & Salud Mental</option>
                    <option value="ESTETICA">💆 Estética, Spa & Fisioterapia</option>
                    <option value="VETERINARIA">🐾 Veterinaria & Cuidado Animal</option>
                    <option value="SERVICIOS">💼 Servicios Profesionales / Consultoría</option>
                  </select>
                  <p className="text-[10px] text-muted-foreground">
                    Habilita automáticamente los módulos verticales correspondientes para este inquilino.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-3">
                  <span className="font-bold text-foreground block">
                    Cuenta del Administrador de la Clínica (Director Médico)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground">Nombre *</label>
                      <Input
                        placeholder="Ej: Dr. Carlos"
                        value={formNuevaClinica.adminNombre}
                        onChange={(e) =>
                          setFormNuevaClinica({ ...formNuevaClinica, adminNombre: e.target.value })
                        }
                        required
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground">Apellido</label>
                      <Input
                        placeholder="Ej: Martínez"
                        value={formNuevaClinica.adminApellido}
                        onChange={(e) =>
                          setFormNuevaClinica({ ...formNuevaClinica, adminApellido: e.target.value })
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground">Correo Electrónico *</label>
                      <Input
                        type="email"
                        placeholder="director@clinica.com"
                        value={formNuevaClinica.adminEmail}
                        onChange={(e) =>
                          setFormNuevaClinica({ ...formNuevaClinica, adminEmail: e.target.value })
                        }
                        required
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground">Contraseña Inicial *</label>
                      <Input
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={formNuevaClinica.adminPassword}
                        onChange={(e) =>
                          setFormNuevaClinica({ ...formNuevaClinica, adminPassword: e.target.value })
                        }
                        required
                        minLength={6}
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Plan Comercial Asignado</label>
                    <select
                      value={formNuevaClinica.planCodigo}
                      onChange={(e) =>
                        setFormNuevaClinica({ ...formNuevaClinica, planCodigo: e.target.value })
                      }
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                    >
                      <option value="BASICO">Plan Básico (1 consultorio)</option>
                      <option value="PROFESIONAL">Plan Profesional (Hasta 5 médicos)</option>
                      <option value="ENTERPRISE">Plan Enterprise (Ilimitado)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Ciclo Contratado</label>
                    <select
                      value={formNuevaClinica.periodo}
                      onChange={(e) =>
                        setFormNuevaClinica({ ...formNuevaClinica, periodo: e.target.value })
                      }
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                    >
                      <option value="MENSUAL">Mensual</option>
                      <option value="ANUAL">Anual</option>
                    </select>
                  </div>
                </div>
              </CardContent>

              <div className="p-4 border-t border-border flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowModalCrearClinica(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={creandoClinica} className="gap-1.5 font-semibold">
                  {creandoClinica ? 'Aprovisionando...' : 'Crear y Activar Clínica'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
