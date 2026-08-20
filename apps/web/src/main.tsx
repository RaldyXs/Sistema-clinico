// StrictMode ayuda a detectar posibles problemas durante el desarrollo.
import { StrictMode } from 'react'

// createRoot permite montar nuestra aplicación React dentro del navegador.
import { createRoot } from 'react-dom/client'

// Importamos los estilos globales de la aplicación.
import './index.css'

// Importamos el componente principal del Sistema Clínico.
import App from './App.tsx'

/**
 * Buscamos el elemento HTML cuyo id es "root".
 *
 * Ese elemento se encuentra en:
 *
 * apps/web/index.html
 *
 * React utilizará ese elemento como punto de entrada para renderizar
 * toda la aplicación.
 */
const rootElement = document.getElementById('root')

/**
 * Si por alguna razón el elemento "root" no existe,
 * detenemos la ejecución mostrando un error claro.
 *
 * Esto evita utilizar el operador "!" sin validar realmente
 * que el elemento existe.
 */
if (!rootElement) {
  throw new Error(
    'No se encontró el elemento root donde debe montarse la aplicación.',
  )
}

/**
 * Creamos la raíz de React y renderizamos la aplicación.
 *
 * StrictMode solamente añade comprobaciones adicionales durante
 * desarrollo. No genera elementos visibles en pantalla.
 */
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)