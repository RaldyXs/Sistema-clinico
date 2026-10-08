import * as React from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Stethoscope,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Shield,
  CreditCard,
} from 'lucide-react';

interface Props {
  onCargarAFactura: (paciente: any, medico?: any, cita?: any) => void;
}

export function FacturasPendientesView({ onCargarAFactura }: Props) {
  const [citasHoy, setCitasHoy] = React.useState<any[]>([]);
  const [pagosHoy, setPagosHoy] = React.useState<any[]>([]);
  const [cargando, setCargando] = React.useState(true);

  const cargarPendientes = React.useCallback(async () => {
    setCargando(true);
    try {
      const hoyStr = new Date().toISOString().slice(0, 10);
      const [citasRes, pagosRes] = await Promise.allSettled([
        api.get(`/citas?fecha=${hoyStr}&limite=100`),
        api.get('/caja/pagos?limite=100'),
      ]);

      const listaCitas = citasRes.status === 'fulfilled'
        ? (Array.isArray(citasRes.value) ? citasRes.value : citasRes.value?.datos || [])
        : [];
      const listaPagos = pagosRes.status === 'fulfilled'
        ? (Array.isArray(pagosRes.value) ? pagosRes.value : pagosRes.value?.datos || [])
        : [];

      setCitasHoy(listaCitas);
      setPagosHoy(listaPagos);
    } catch (err) {
      console.error('Error cargando cola de pendientes de caja:', err);
    } finally {
      setCargando(false);
    }
  }, []);

  React.useEffect(() => {
    cargarPendientes();
  }, [cargarPendientes]);

  // Identificar qué citas aún no tienen cobro registrado en caja
  const pendientes = React.useMemo(() => {
    return citasHoy.filter((c) => {
      // Si la cita fue cancelada o no asistió, no se cobra
      if (c.estado === 'CANCELADA' || c.estado === 'NO_ASISTIO') return false;

      // Verificar si ya tiene pago registrado hoy vinculado a la cita o al paciente
      const yaCobrado = pagosHoy.some(
        (p) =>
          p.estado === 'COBRADO' &&
          (p.citaId === c.id || (p.pacienteId === c.pacienteId && Math.abs(new Date(p.creadoEn).getTime() - new Date(c.fechaHoraInicio).getTime()) < 12 * 3600 * 1000))
      );

      return !yaCobrado;
    });
  }, [citasHoy, pagosHoy]);

  const getBadgeEstadoCita = (estado: string) => {
    switch (estado) {
      case 'ATENDIDA':
        return <Badge variant="success" className="text-[10px]">Consulta Finalizada</Badge>;
      case 'EN_CONSULTA':
        return <Badge variant="info" className="text-[10px]">En Consulta Ahora</Badge>;
      case 'EN_ESPERA':
        return <Badge variant="warning" className="text-[10px]">En Sala de Espera</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-card border border-border shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Cola de Pacientes Pendientes de Pago
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Pacientes con atención médica hoy que no han registrado su cobro en caja
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs py-1 px-2.5">
            {pendientes.length} {pendientes.length === 1 ? 'paciente pendiente' : 'pacientes pendientes'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={cargarPendientes}
            className="h-7 px-2 cursor-pointer"
            title="Refrescar cola"
          >
            <RefreshCw className={`size-3.5 ${cargando ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {cargando && pendientes.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-xs">
          <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-primary" />
          Verificando citas y atenciones del día...
        </div>
      ) : pendientes.length === 0 ? (
        <Card className="border-border/80 shadow-2xs">
          <CardContent className="p-12 text-center space-y-3">
            <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Todos los cobros están al día</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                No hay pacientes con citas activas de hoy pendientes de pasar por caja. Las nuevas consultas aparecerán aquí automáticamente.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pendientes.map((cita) => {
            const pac = cita.paciente;
            const prof = cita.profesional;
            const hora = new Date(cita.fechaHoraInicio).toLocaleTimeString('es-DO', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <Card
                key={cita.id}
                className="border-border/80 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <CardHeader className="p-3.5 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {pac?.nombre?.[0] || 'P'}
                        {pac?.apellido?.[0] || ''}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-foreground text-xs truncate">
                          {pac?.nombre} {pac?.apellido || ''}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground">
                          Céd: {pac?.documentoIdentidad || pac?.dni || 'S/D'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {getBadgeEstadoCita(cita.estado)}
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {hora}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-3.5 pt-0 space-y-2.5 text-xs">
                  <div className="p-2 rounded bg-muted/30 border border-border/50 text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Shield className="size-3" /> ARS / Seguro:
                      </span>
                      <strong className="text-foreground">{pac?.ars || 'Particular'}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Stethoscope className="size-3" /> Médico:
                      </span>
                      <span>Dr(a). {prof?.nombre} {prof?.apellido || ''}</span>
                    </div>

                    {cita.motivo && (
                      <div className="text-muted-foreground truncate pt-0.5 border-t border-border/40">
                        Motivo: <span className="text-foreground font-medium">{cita.motivo}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    className="w-full text-xs h-8 gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-xs"
                    onClick={() => onCargarAFactura(pac, prof, cita)}
                  >
                    <CreditCard className="size-3.5" />
                    Cargar a Caja y Cobrar
                    <ArrowRight className="size-3.5 ml-auto" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
