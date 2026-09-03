import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Variantes de estilo del componente Button mediante `cva` (Class Variance Authority).
 *
 * ¿Por qué usamos CVA?
 * En lugar de concatenar clases manualmente con if/else o ternarios frágiles,
 * CVA nos permite definir una matriz de variantes declarativa y fuertemente tipada:
 *
 * - Clases base: Se aplican siempre (flex, focus-visible, transiciones, etc.).
 * - `variants`:
 *    - `variant`: define el rol visual (primario, secundario, destructivo, contorno, fantasma, enlace).
 *    - `size`: define el tamaño y proporciones (sm, default, lg, icon).
 * - `defaultVariants`: qué estilos usar si el desarrollador no pasa ninguna prop.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

/**
 * Propiedades del componente Button.
 *
 * Extiende todas las propiedades nativas de un <button> HTML (onClick, disabled, type, etc.),
 * además de las variantes generadas por CVA y la propiedad polimórfica `asChild`.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * `asChild`: Patrón polimórfico de Radix UI.
   * Si es true, el componente delega su renderizado y eventos a su hijo directo (usando <Slot />).
   * Muy útil cuando necesitas que un enlace <a> o un <Link> de React Router
   * se vea y comporte como un botón sin violar la semántica HTML (no anidar <button> dentro de <a>).
   */
  asChild?: boolean;
}

/**
 * Componente Button de Shadcn UI adaptado para el Sistema Clínico / SaaS Base.
 *
 * Totalmente agnóstico del dominio de negocio: puede utilizarse en cualquier
 * módulo de la aplicación o en futuros proyectos.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // Si asChild es true usamos Slot, de lo contrario usamos un elemento <button> nativo
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
