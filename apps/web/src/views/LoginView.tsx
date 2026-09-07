import * as React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Lock, Mail, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export function LoginView() {
  const { login, quickLogin, isLoading } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

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
    </div>
  );
}
