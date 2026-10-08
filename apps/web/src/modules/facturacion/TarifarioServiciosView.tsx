import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Receipt,
  Plus,
  Stethoscope,
  FlaskConical,
  Activity,
  Layers,
} from 'lucide-react';
import { SERVICIOS_CLINICOS, type ServicioClinico } from '@/data/servicios-clinicos';

interface Props {
  onFacturarServicio?: (servicio: ServicioClinico) => void;
}

export function TarifarioServiciosView({ onFacturarServicio }: Props) {
  const [busqueda, setBusqueda] = React.useState('');
  const [categoriaActiva, setCategoriaActiva] = React.useState<'TODOS' | 'CONSULTA' | 'PROCEDIMIENTO' | 'IMAGENES' | 'LABORATORIO'>('TODOS');

  const serviciosFiltrados = React.useMemo(() => {
    return SERVICIOS_CLINICOS.filter((s) => {
      if (categoriaActiva !== 'TODOS' && s.categoria !== categoriaActiva) {
        return false;
      }
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        return (
          s.nombre.toLowerCase().includes(q) ||
          s.codigo.toLowerCase().includes(q) ||
          (s.descripcion && s.descripcion.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [busqueda, categoriaActiva]);

  const getBadgeCategoria = (cat: string) => {
    switch (cat) {
      case 'CONSULTA':
        return <Badge variant="info" className="text-[10px]">Consulta</Badge>;
      case 'PROCEDIMIENTO':
        return <Badge variant="warning" className="text-[10px]">Procedimiento</Badge>;
      case 'IMAGENES':
        return <Badge variant="secondary" className="text-[10px]">Imágenes</Badge>;
      case 'LABORATORIO':
        return <Badge variant="success" className="text-[10px]">Laboratorio</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{cat}</Badge>;
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-12">
      {/* ── Encabezado & Buscador ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border shadow-2xs">
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            Tarifario de Servicios Clínicos & Procedimientos
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
              {SERVICIOS_CLINICOS.length} prestaciones
            </span>
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Catálogo estándar de tarifas dominicanas (RD$) y porcentajes sugeridos de cobertura ARS
          </p>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            className="pl-8 text-xs h-8 bg-background"
            placeholder="Buscar por código o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* ── Tabs de Categoría ── */}
      <div className="flex items-center gap-1.5 border-b border-border pb-1 overflow-x-auto">
        {[
          { id: 'TODOS', label: 'Todos los Servicios', icon: <Layers className="size-3.5" /> },
          { id: 'CONSULTA', label: 'Consultas Médicas', icon: <Stethoscope className="size-3.5" /> },
          { id: 'PROCEDIMIENTO', label: 'Procedimientos Ginecológicos', icon: <Activity className="size-3.5" /> },
          { id: 'IMAGENES', label: 'Sonografías & Mamografía', icon: <Receipt className="size-3.5" /> },
          { id: 'LABORATORIO', label: 'Laboratorios de Rutina', icon: <FlaskConical className="size-3.5" /> },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setCategoriaActiva(item.id as any)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              categoriaActiva === item.id
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* ── Grilla de Servicios ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {serviciosFiltrados.map((srv) => {
          const montoArsEstimado = Math.round((srv.precioBaseDop * srv.coberturaSugeridaArs) / 100);
          const copagoEstimado = srv.precioBaseDop - montoArsEstimado;

          return (
            <Card
              key={srv.id}
              className="border-border/80 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between"
            >
              <CardHeader className="p-3.5 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                    {srv.codigo}
                  </span>
                  {getBadgeCategoria(srv.categoria)}
                </div>
                <CardTitle className="text-xs font-bold text-foreground mt-1 line-clamp-1" title={srv.nombre}>
                  {srv.nombre}
                </CardTitle>
                {srv.descripcion && (
                  <CardDescription className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                    {srv.descripcion}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="p-3.5 pt-0 space-y-2.5">
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-[11px]">Tarifa Base Particular:</span>
                    <strong className="font-mono text-foreground text-sm">
                      RD$ {srv.precioBaseDop.toLocaleString()}
                    </strong>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-blue-600 dark:text-blue-400">
                    <span>Cobertura ARS ({srv.coberturaSugeridaArs}%):</span>
                    <span className="font-mono">RD$ {montoArsEstimado.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-emerald-600 dark:text-emerald-400 font-bold pt-1 border-t border-border/40">
                    <span>Copago Estimado:</span>
                    <span className="font-mono">RD$ {copagoEstimado.toLocaleString()}</span>
                  </div>
                </div>

                {onFacturarServicio && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs h-7 gap-1 font-semibold hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                    onClick={() => onFacturarServicio(srv)}
                  >
                    <Plus className="size-3" /> Facturar Este Servicio
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
