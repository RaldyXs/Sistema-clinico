import * as React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Building2,
  Sparkles,
} from 'lucide-react';

export function LoginView() {
  const { login, quickLogin, isLoading } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  // Modal Onboarding
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [nombreClinica, setNombreClinica] = React.useState('');
  const [telefonoClinica, setTelefonoClinica] = React.useState('');
  const [adminNombre, setAdminNombre] = React.useState('');
  const [adminApellido, setAdminApellido] = React.useState('');
  const [adminEmail, setAdminEmail] = React.useState('');
  const [adminPassword, setAdminPassword] = React.useState('');
  const [planSeleccionado, setPlanSeleccionado] = React.useState('PROFESIONAL');
  const [isOnboardingLoading, setIsOnboardingLoading] = React.useState(false);
  const [onboardingError, setOnboardingError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  const handleQuickLogin = async (type: 'carlos' | 'elena') => {
    setError(null);
    try {
      await quickLogin(type);
    } catch (err: any) {
      setError(err.message || 'Error en acceso rápido');
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingError(null);
    setIsOnboardingLoading(true);

    try {
      const res = await fetch('http://localhost:3000/saas/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreConsultorio: nombreClinica,
          telefono: telefonoClinica || undefined,
          adminNombre,
          adminApellido: adminApellido || undefined,
          adminEmail,
          adminPassword,
          planCodigo: planSeleccionado,
          periodo: 'MENSUAL',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al aprovisionar clínica');
      }

      // Guardamos tokens y perfil en localStorage e iniciamos sesión automáticamente
      localStorage.setItem('token_clinico', data.accessToken);
      localStorage.setItem(
        'usuario_clinico',
        JSON.stringify({
          ...data.usuario,
          consultorioId: data.consultorio.id,
          consultorio: data.consultorio,
        }),
      );

      window.location.reload();
    } catch (err: any) {
      setOnboardingError(err.message);
    } finally {
      setIsOnboardingLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/40 relative overflow-hidden">
      {/* Círculos decorativos de fondo */}
      <div className="absolute -top-32 -left-32 size-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-sky-500/10 blur-3xl" />

      <Card className="w-full max-w-md shadow-xl border-border/80 relative z-10 backdrop-blur-xs">
        <CardHeader className="text-center space-y-2 pb-6 border-b border-border/60">
          <div className="mx-auto size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
            <Activity className="size-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Sistema Clínico</CardTitle>
          <CardDescription className="text-sm">
            Plataforma SaaS de Gestión Médica y Salud Femenina
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Mail className="size-3.5" /> Correo Electrónico
              </label>
              <Input
                type="email"
                placeholder="doctor@clinica.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Lock className="size-3.5" /> Contraseña
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Iniciando sesión...' : 'Entrar a la Clínica'}
            </Button>
          </form>

          {/* Botón Onboarding / Crear Clínica */}
          <div className="pt-1">
            <Button
              type="button"
              variant="outline"
              className="w-full border-primary/40 text-primary hover:bg-primary/10 flex items-center justify-center gap-2 text-xs font-semibold"
              onClick={() => setShowOnboarding(true)}
            >
              <Sparkles className="size-4" /> Registrar Nueva Clínica (14 Días Gratis)
            </Button>
          </div>

          {/* Acceso rápido de prueba / Multi-tenant demo */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="size-4 text-emerald-500" />
              <span>Acceso Rápido Multi-Tenant (Demo)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Prueba el aislamiento estricto cambiando entre dos consultorios independientes:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-start text-xs h-auto py-2 px-3 border-sky-500/30 hover:bg-sky-500/10 text-left"
                onClick={() => handleQuickLogin('carlos')}
                disabled={isLoading}
              >
                <UserCheck className="size-3.5 text-sky-600 mr-1.5 shrink-0" />
                <div>
                  <div className="font-semibold text-foreground">Dr. Carlos</div>
                  <div className="text-[10px] text-muted-foreground">Centro Médico Del Sol</div>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-start text-xs h-auto py-2 px-3 border-emerald-500/30 hover:bg-emerald-500/10 text-left"
                onClick={() => handleQuickLogin('elena')}
                disabled={isLoading}
              >
                <UserCheck className="size-3.5 text-emerald-600 mr-1.5 shrink-0" />
                <div>
                  <div className="font-semibold text-foreground">Dra. Elena</div>
                  <div className="text-[10px] text-muted-foreground">Clínica San Rafael</div>
                </div>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Onboarding Público */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="size-6 text-primary" />
                <div>
                  <h3 className="font-bold text-lg">Onboarding — Nueva Clínica SaaS</h3>
                  <p className="text-xs text-muted-foreground">Aprovisiona tu propio consultorio en segundos con 14 días gratis</p>
                </div>
              </div>
              <button
                onClick={() => setShowOnboarding(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {onboardingError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{onboardingError}</span>
              </div>
            )}

            <form onSubmit={handleOnboardingSubmit} className="space-y-4 text-xs">
              {/* Selector de Plan */}
              <div>
                <label className="font-semibold text-foreground block mb-1.5">1. Selecciona tu Plan Comercial</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: 'BASICO', name: 'Básico', price: '$29/m' },
                    { code: 'PROFESIONAL', name: 'Profesional', price: '$79/m', popular: true },
                    { code: 'ENTERPRISE', name: 'Enterprise', price: '$199/m' },
                  ].map((p) => (
                    <div
                      key={p.code}
                      onClick={() => setPlanSeleccionado(p.code)}
                      className={`p-2.5 rounded-lg border text-center cursor-pointer transition-all ${
                        planSeleccionado === p.code
                          ? 'border-primary bg-primary/10 shadow-xs'
                          : 'border-border bg-card'
                      }`}
                    >
                      <div className="font-bold text-foreground">{p.name}</div>
                      <div className="text-[11px] text-primary font-semibold">{p.price}</div>
                      {p.popular && <Badge className="text-[9px] py-0 px-1 mt-1">Popular</Badge>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Datos de la Clínica */}
              <div className="space-y-2">
                <label className="font-semibold text-foreground block">2. Datos de la Clínica o Consultorio</label>
                <Input
                  placeholder="Nombre de la clínica (ej: Policlínica Los Ángeles)"
                  value={nombreClinica}
                  onChange={(e) => setNombreClinica(e.target.value)}
                  required
                />
                <Input
                  placeholder="Teléfono institucional"
                  value={telefonoClinica}
                  onChange={(e) => setTelefonoClinica(e.target.value)}
                />
              </div>

              {/* Cuenta Administrador */}
              <div className="space-y-2">
                <label className="font-semibold text-foreground block">3. Cuenta Administrador (Primer Médico o Director)</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Nombre"
                    value={adminNombre}
                    onChange={(e) => setAdminNombre(e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Apellido"
                    value={adminApellido}
                    onChange={(e) => setAdminApellido(e.target.value)}
                  />
                </div>
                <Input
                  type="email"
                  placeholder="Correo electrónico administrativo"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="Contraseña (mínimo 6 caracteres)"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowOnboarding(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={isOnboardingLoading}>
                  {isOnboardingLoading ? 'Aprovisionando...' : 'Crear y Comenzar Prueba'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
