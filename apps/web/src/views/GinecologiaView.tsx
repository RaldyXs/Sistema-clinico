import * as React from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Baby,
  Calculator,
  Calendar,
  Sparkles,
  HeartPulse,
} from 'lucide-react';

export function GinecologiaView() {
  // Calculadora obstétrica
  const [fur, setFur] = React.useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 120); // 120 días atrás por defecto (~17 semanas)
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
      // Fallback de cálculo Naegele local si la API estuviera offline
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

  // Cálculo fórmula Hadlock (DBP, CC, CA, LF en cm)
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

  return (
    <div className="space-y-2.5">
      <div>
        <h1 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-1.5">
          <Baby className="size-4.5 text-pink-500" />
          Especialidad de Ginecología y Obstetricia
        </h1>
        <p className="text-[11px] text-muted-foreground">
          Herramientas de cálculo gestacional, biometría fetal Hadlock y seguimiento prenatal
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* CALCULADORA OBSTÉTRICA FUR / FPP */}
        <Card className="border-pink-500/20 shadow-xs">
          <CardHeader className="border-b border-border/60 py-2 px-3">
            <CardTitle className="text-xs flex items-center gap-1.5 text-pink-600 dark:text-pink-400">
              <Calculator className="size-3.5" />
              Calculadora Obstétrica (Regla de Naegele)
            </CardTitle>
            <CardDescription className="text-[10px]">
              Determina edad gestacional exacta, fecha probable de parto y calendario ecográfico
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-2 space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3" /> Fecha de Última Regla (FUR)
              </label>
              <Input
                type="date"
                value={fur}
                onChange={(e) => setFur(e.target.value)}
                className="max-w-xs h-7 text-xs"
              />
            </div>

            {resultadoObstetrico && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 text-center">
                    <span className="text-xs text-muted-foreground block">Edad Gestacional</span>
                    <span className="text-lg font-bold text-pink-600 dark:text-pink-400">
                      {resultadoObstetrico.edadGestacionalTexto}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center">
                    <span className="text-xs text-muted-foreground block">FPP (Naegele)</span>
                    <span className="text-lg font-bold text-sky-600 dark:text-sky-400">
                      {resultadoObstetrico.fechaProbableParto}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <span className="text-xs text-muted-foreground block">Trimestre</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {resultadoObstetrico.trimestre}° Trimestre
                    </span>
                  </div>
                </div>

                {/* Hitos Ecográficos Recomendados */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-amber-500" />
                    Cronograma de Ecografías Recomendadas
                  </h4>
                  <div className="space-y-2">
                    {resultadoObstetrico.ecografiasRecomendadas?.map((eco: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border/80 text-xs"
                      >
                        <span className="font-medium text-foreground">{eco.nombre}</span>
                        <Badge variant="outline" className="font-mono">
                          {eco.semanas}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* BIOMETRÍA FETAL HADLOCK */}
        <Card className="border-sky-500/20 shadow-xs">
          <CardHeader className="border-b border-border/60 py-2 px-3">
            <CardTitle className="text-xs flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
              <HeartPulse className="size-3.5" />
              Biometría Fetal y Peso Fetal Estimado (Hadlock)
            </CardTitle>
            <CardDescription className="text-[10px]">
              Cálculo biométrico automático del PFE en gramos a partir de 4 medidas ecográficas
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-2 space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground">
                  DBP (Diámetro Biparietal) en mm
                </label>
                <Input
                  className="h-7 text-xs"
                  type="number"
                  value={dbp}
                  onChange={(e) => setDbp(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  CC (Circunferencia Cefálica) en mm
                </label>
                <Input
                  type="number"
                  value={cc}
                  onChange={(e) => setCc(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  CA (Circunferencia Abdominal) en mm
                </label>
                <Input
                  type="number"
                  value={ca}
                  onChange={(e) => setCa(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  LF (Longitud Femoral) en mm
                </label>
                <Input
                  type="number"
                  value={lf}
                  onChange={(e) => setLf(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Resultado PFE */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-sky-500/10 via-primary/5 to-emerald-500/10 border border-sky-500/30 text-center space-y-2">
              <span className="text-xs uppercase font-bold tracking-widest text-sky-600 dark:text-sky-400">
                Peso Fetal Estimado (Hadlock)
              </span>
              <div className="text-4xl font-black tracking-tight text-foreground">
                {pfeCalculado ? `${pfeCalculado.toLocaleString()} g` : '---'}
              </div>
              <p className="text-xs text-muted-foreground">
                {pfeCalculado ? `Equivalente aproximado: ${(pfeCalculado / 1000).toFixed(2)} kg` : ''}
              </p>
            </div>

            <div className="text-[11px] text-muted-foreground leading-relaxed p-3 rounded-lg bg-muted/30 border border-border">
              <strong>Fórmula Hadlock 4-parámetros:</strong> log10(PFE) = 1.3596 - 0.00386(CA × LF) + 0.007(DBP) + 0.061(CC) + 0.0424(CA) + 0.174(LF).
              Estándar de referencia en perinatología para detección de RCIU (Restricción del Crecimiento Intrauterino) y macrosomía.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
