/**
 * Componente principal de la aplicación web.
 *
 * Por ahora solamente muestra una pantalla básica para confirmar que
 * React, TypeScript y Vite están funcionando correctamente.
 *
 * Más adelante este componente contendrá la estructura principal
 * de navegación y las rutas del Sistema Clínico.
 */
function App() {
  return (
    <main className="app">
      <section className="welcome">
        <h1>Sistema Clínico</h1>

        <p>
          Plataforma de gestión clínica multi-consultorio y
          multi-especialidad.
        </p>

        <p className="status">
          Frontend React funcionando correctamente.
        </p>
      </section>
    </main>
  )
}

// Exportamos App para que main.tsx pueda importarlo y renderizarlo.
export default App