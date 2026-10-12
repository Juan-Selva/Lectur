import { NavLink, Outlet } from 'react-router-dom'
import logo from '../assets/logo.png'
import { useAuth } from '../lib/auth.jsx'

const link = ({ isActive }) =>
  `rounded-lg px-3 py-1.5 text-sm font-semibold ${isActive ? 'bg-brand-soft text-brand-dark' : 'text-slate-600 hover:bg-slate-100'}`

export default function Layout() {
  const { usuario, salir } = useAuth()
  const esDocente = usuario.rol === 'docente'
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 px-4 py-3">
          <img src={logo} alt="Lectur" className="h-9 w-auto" />
          <nav className="flex gap-1" aria-label="Principal">
            {esDocente ? (
              <>
                <NavLink to="/docente" end className={link}>
                  Semáforo
                </NavLink>
                <NavLink to="/docente/asignar" className={link}>
                  Asignar
                </NavLink>
                <NavLink to="/docente/palabras" className={link}>
                  Palabras
                </NavLink>
                <NavLink to="/docente/textos" className={link}>
                  Textos
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/alumno" end className={link}>
                  Mis lecturas
                </NavLink>
                <NavLink to="/alumno/historial" className={link}>
                  Historial
                </NavLink>
                <NavLink to="/alumno/diccionario" className={link}>
                  Diccionario
                </NavLink>
              </>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-slate-600 sm:inline">{usuario.nombre}</span>
            <button onClick={salir} className="font-semibold text-brand hover:underline">
              Salir
            </button>
          </div>
        </div>
        <div className="h-1 bg-gold" />
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
