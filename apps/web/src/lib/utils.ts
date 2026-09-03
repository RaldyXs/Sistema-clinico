import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Función utilitaria `cn` (Class Names).
 *
 * Propósito:
 * Es la utilidad central de diseño en el ecosistema Shadcn UI y React moderno.
 * Resuelve dos problemas esenciales al aplicar estilos con Tailwind CSS:
 *
 * 1. Clases condicionales (mediante `clsx`):
 *    Permite pasar booleanos, objetos o arrays para activar clases según el estado:
 *    cn('btn', isPrimary && 'btn-primary', isDisabled ? 'opacity-50' : 'opacity-100')
 *
 * 2. Resolución inteligente de conflictos (mediante `tailwind-merge`):
 *    Si un componente tiene una clase por defecto (ej. 'px-4') y desde afuera
 *    le pasamos otra que entra en conflicto (ej. 'px-6'), Tailwind normal dejaría
 *    ambas en el HTML generando comportamientos inconsistentes.
 *    `twMerge` detecta la colisión y conserva únicamente la última ('px-6').
 *
 * @param inputs - Lista de clases, condiciones, arrays u objetos de estilos.
 * @returns Cadena de texto limpia y optimizada con las clases CSS finales.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
