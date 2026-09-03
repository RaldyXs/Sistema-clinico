import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Activity, CheckCircle2, Moon, Sun } from 'lucide-react';

/**
 * Componente principal de la aplicación web (@sistema-clinico/web).
 *
 * En esta fase (Tarea 5 — Fundamentos), sirve para validar visualmente que:
 * 1. Tailwind CSS está procesando estilos y utilidades correctamente.
 * 2. Los tokens semánticos (bg-background, text-foreground, border-border) funcionan.
 * 3. El componente Shadcn UI `Button` responde a variantes y eventos.
 * 4. Los Path Aliases (@/components/ui/button) resuelven sin problemas.
 */
function App() {
  const [isDark, setIsDark] = React.useState(false);
  const [clickCount, setClickCount] = React.useState(0);

  // Alterna la clase 'dark' en el elemento raíz <html> para probar el tema oscuro
  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground transition-colors duration-200">
      <div className="max-w-md w-full border border-border bg-card text-card-foreground rounded-xl p-8 shadow-sm space-y-6">
        {/* Cabecera con icono de estado */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
            <Activity className="size-3.5 text-primary animate-pulse" />
            <span>Infraestructura Visual Activa</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>

        {/* Título y descripción */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Sistema Clínico</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Plataforma SaaS multi-consultorio y multi-especialidad.
            Infraestructura base con Tailwind CSS y componentes Shadcn UI listos para producción.
          </p>
        </div>

        {/* Demostración de componentes y variantes de botón */}
        <div className="space-y-3 pt-2 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Validación de componentes Shadcn UI
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              onClick={() => setClickCount(c => c + 1)}
            >
              <CheckCircle2 className="size-4" />
              <span>Clics: {clickCount}</span>
            </Button>
            <Button variant="outline">
              Variante Outline
            </Button>
            <Button variant="secondary">
              Variante Secondary
            </Button>
          </div>
        </div>

        {/* Footer técnico */}
        <div className="text-xs text-muted-foreground pt-2 border-t border-border flex items-center justify-between">
          <span>React 19 • Vite 8 • Tailwind v4</span>
          <span className="text-emerald-500 font-medium">● 0 errores</span>
        </div>
      </div>
    </main>
  );
}

export default App;