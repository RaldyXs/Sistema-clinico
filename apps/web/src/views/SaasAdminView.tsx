import * as React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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

export function SaasAdminView() {
  const { token } = useAuth();
  const [metricas, setMetricas] = React.useState<GlobalMetricas | null>(null);
  const [distribucionPlanes, setDistribucionPlanes] = React.useState<Record<string, number>>({});
  const [consultorios, setConsultorios] = React.useState<TenantItem[]>([]);
  const [planes, setPlanes] = React.useState<PlanItem[]>([]);
  const [busqueda, setBusqueda] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  // Modal para cambiar de plan
  const [selectedTenantForPlan, setSelectedTenantForPlan] = React.useState<TenantItem | null>(null);
  const [nuevoPlanCodigo, setNuevoPlanCodigo] = React.useState('PROFESIONAL');

  const fetchData = React.useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [resDash, resTenants, resPlanes] = await Promise.all([
        fetch('http://localhost:3000/saas/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:3000/saas/consultorios', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:3000/saas/planes'),
      ]);

      if (resDash.ok) {
        const data = await resDash.json();
        setMetricas(data.metricas);
        setDistribucionPlanes(data.distribucionPlanes || {});
      }
      if (resTenants.ok) {
        const data = await resTenants.json();
        setConsultorios(data);
      }
      if (resPlanes.ok) {
        const data = await resPlanes.json();
        setPlanes(data);
      }
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
      const res = await fetch(`http://localhost:3000/saas/consultorios/${tenant.id}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activo: !tenant.activo }),
      });
      if (res.ok) {
        await fetchData();
      }
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
      const res = await fetch(`http://localhost:3000/saas/consultorios/${selectedTenantForPlan.id}/plan`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planCodigo: nuevoPlanCodigo,
          periodo: 'MENSUAL',
        }),
      });
      if (res.ok) {
        setSelectedTenantForPlan(null);
        await fetchData();
      }
    } catch (e) {
      console.error('Error cambiando plan:', e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const consultoriosFiltrados = consultorios.filter((c) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      c.plan.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Globe2 className="size-7 text-primary" />
            Panel SuperAdmin — Plataforma SaaS Multi-Tenant
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Supervisión global de clínicas clientes, ingresos mensuales recurrentes (MRR), gestión de planes comerciales y control operativo de inquilinos.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="gap-2">
          <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar Métricas
        </Button>
      </div>

      {/* Tarjetas de Métricas Globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">MRR Estimado</p>
              <p className="text-2xl font-bold mt-1 text-primary">
                ${metricas?.mrrEstimado?.toFixed(2) ?? '0.00'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <TrendingUp className="size-3 text-emerald-500 inline" /> Ingreso mensual recurrente
              </p>
            </div>
            <DollarSign className="size-8 text-primary/30" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Clínicas Inquilinas</p>
              <p className="text-2xl font-bold mt-1 text-foreground">
                {metricas?.totalConsultorios ?? 0}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                <span className="text-emerald-600 font-semibold">{metricas?.consultoriosActivos ?? 0} activas</span> •{' '}
                <span className="text-amber-600">{metricas?.consultoriosSuspendidos ?? 0} suspendidas</span>
              </p>
            </div>
            <Building2 className="size-8 text-muted-foreground/30" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Médicos en Plataforma</p>
              <p className="text-2xl font-bold mt-1 text-blue-600">
                {metricas?.totalMedicos ?? 0}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Profesionales de la salud registrados</p>
            </div>
            <Stethoscope className="size-8 text-blue-500/30" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Pacientes Atendidos</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600">
                {metricas?.totalPacientes ?? 0}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {metricas?.totalConsultas ?? 0} consultas médicas registradas
              </p>
            </div>
            <Users className="size-8 text-emerald-500/30" />
          </CardContent>
        </Card>
      </div>

      {/* Planes Comerciales */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Zap className="size-4 text-amber-500" /> Catálogo Comercial de Planes SaaS
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planes.map((p) => (
            <Card
              key={p.id}
              className={`relative flex flex-col justify-between ${
                p.destacado ? 'border-primary shadow-md bg-primary/5' : 'border-border'
              }`}
            >
              {p.destacado && (
                <div className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Más Popular
                </div>
              )}
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-xs">
                    {p.codigo}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {distribucionPlanes[p.codigo] || 0} suscriptores
                  </span>
                </div>
                <CardTitle className="text-base font-bold mt-2">{p.nombre}</CardTitle>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.descripcion}</p>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex items-baseline gap-1 border-b border-border pb-3">
                  <span className="text-2xl font-extrabold text-foreground">${Number(p.precioMensual).toFixed(0)}</span>
                  <span className="text-xs text-muted-foreground">/ mes</span>
                  <span className="text-[11px] text-muted-foreground ml-auto font-medium">
                    (${Number(p.precioAnual).toFixed(0)} / año)
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Límite Médicos:</span>
                    <span className="font-semibold text-foreground">
                      {p.maxMedicos > 100 ? 'Ilimitados' : p.maxMedicos}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Límite Pacientes:</span>
                    <span className="font-semibold text-foreground">
                      {p.maxPacientes > 10000 ? 'Ilimitados' : p.maxPacientes.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Almacenamiento:</span>
                    <span className="font-semibold text-foreground">
                      {p.maxAlmacenamientoMb / 1024} GB
                    </span>
                  </div>
                </div>

                <ul className="space-y-1 text-xs text-muted-foreground border-t border-border pt-3">
                  {p.caracteristicas.slice(0, 4).map((c, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                      <span className="truncate">{c}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Directorio Maestro de Consultorios Inquilinos */}
      <Card>
        <CardHeader className="p-4 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Directorio Maestro de Clínicas Inquilinas (Tenants)</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Administración centralizada de cuentas clientes, estado operativo y gestión de planes.
            </p>
          </div>
          <div className="relative w-72">
            <Search className="size-3.5 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por clínica o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="p-2.5">Clínica / Inquilino</th>
                  <th className="p-2.5">Plan Contratado</th>
                  <th className="p-2.5">Estado Suscripción</th>
                  <th className="p-2.5">Médicos</th>
                  <th className="p-2.5">Pacientes</th>
                  <th className="p-2.5">Estado Tenant</th>
                  <th className="p-2.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {consultoriosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron consultorios registrados.
                    </td>
                  </tr>
                ) : (
                  consultoriosFiltrados.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-2.5">
                        <div className="font-semibold text-foreground">{c.nombre}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {c.email || 'Sin correo'} • {c.telefono || 'Sin teléfono'}
                        </div>
                      </td>
                      <td className="p-2.5">
                        <Badge variant="outline" className="font-medium text-[11px]">
                          {c.plan}
                        </Badge>
                      </td>
                      <td className="p-2.5">
                        <Badge
                          className={`text-[10px] font-semibold ${
                            c.estadoSuscripcion === 'ACTIVA'
                              ? 'bg-emerald-500/15 text-emerald-700 border-emerald-200'
                              : 'bg-blue-500/15 text-blue-700 border-blue-200'
                          }`}
                        >
                          {c.estadoSuscripcion}
                        </Badge>
                      </td>
                      <td className="p-2.5 font-medium">{c.totalMedicos}</td>
                      <td className="p-2.5 font-medium">{c.totalPacientes}</td>
                      <td className="p-2.5">
                        {c.activo ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 text-[10px]">
                            Activo
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/15 text-red-700 border-red-200 text-[10px]">
                            Suspendido
                          </Badge>
                        )}
                      </td>
                      <td className="p-2.5 text-right space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2"
                          onClick={() => setSelectedTenantForPlan(c)}
                        >
                          Cambiar Plan
                        </Button>
                        <Button
                          size="sm"
                          variant={c.activo ? 'destructive' : 'default'}
                          className="text-xs h-7 px-2"
                          disabled={actionLoadingId === c.id}
                          onClick={() => handleToggleEstadoTenant(c)}
                        >
                          <Power className="size-3 mr-1" />
                          {c.activo ? 'Suspender' : 'Reactivar'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Cambiar Plan */}
      {selectedTenantForPlan && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <ArrowUpRight className="size-5 text-primary" /> Modificar Plan de Clínica
              </h3>
              <button
                onClick={() => setSelectedTenantForPlan(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Selecciona el nuevo nivel comercial para <span className="font-semibold text-foreground">{selectedTenantForPlan.nombre}</span>:
            </p>
            <div className="space-y-2">
              {['BASICO', 'PROFESIONAL', 'ENTERPRISE'].map((codigo) => (
                <label
                  key={codigo}
                  className={`flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    nuevoPlanCodigo === codigo
                      ? 'border-primary bg-primary/10 font-bold'
                      : 'border-border bg-card'
                  }`}
                >
                  <span>Plan {codigo}</span>
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
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedTenantForPlan(null)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleCambiarPlanTenant}>
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
