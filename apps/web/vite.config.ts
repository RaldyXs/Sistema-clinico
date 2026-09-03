import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Configuración de Vite para el frontend (@sistema-clinico/web).
 *
 * Plugins:
 * - react(): Soporte para React, JSX y Fast Refresh en desarrollo.
 * - tailwindcss(): Integración oficial de Tailwind CSS v4 para procesar
 *   las utilidades CSS en tiempo real de forma ultrarrápida.
 *
 * Resolución de rutas:
 * - alias: Mapea '@' a './src' para evitar rutas relativas largas (../../../).
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
