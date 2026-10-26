import { Link, NavLink, Outlet } from 'react-router-dom'
import AjustesLectura from './AjustesLectura.jsx'
import logo from '../assets/logo.png'
import { useAuth } from '../lib/auth.jsx'

const SECCIONES = [
  {
    to: '/alumno',
    end: true,
    emoji: '📚',
    texto: 'Mis lecturas',
    activo: 'bg-sky-100 text-sky-900 ring-sky-400',
  },
  {
    to: '/alumno/practica',
    emoji: '🎯',
    texto: 'Practicar',
    activo: 'bg-orange-100 text-orange-900 ring-orange-400',
  },
  {
    to: '/alumno/historial',
    emoji: '🏆',
    texto: 'Mis logros',
    activo: 'bg-violet-100 text-violet-900 ring-violet-400',
  },
  {
    to: '/alumno/diccionario',
    emoji: '🔍',
    texto: 'Diccionario',
    activo: 'bg-emerald-100 text-emerald-900 ring-emerald-400',
  },
]

function Seccion({ s, abajo = false }) {
  return (
    <NavLink
      to={s.to}
      end={s.end}
      className={({ isActive }) =>
        `group flex items-center rounded-2xl font-bold transition ${
          abajo ? 'flex-col gap-0.5 px-1 py-1.5 text-xs' : 'gap-1.5 px-3 py-2 text-[0.95rem]'
        } ${isActive ? `ring-2 ${s.activo}` : 'text-slate-600 hover:bg-slate-100'}`
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden="true"
            className={`${abajo ? 'text-2xl' : 'text-xl'} inline-block transition-transform group-hover:scale-125 ${isActive ? 'animate-saltito' : ''}`}
          >
            {s.emoji}
          </span>
          {s.texto}
        </>
      )}
    </NavLink>
  )
}

// Fondo con burbujas de colores y algunos dibujitos que flotan.
function FondoDecorado() {
  const dibujos = [
    { e: '⭐', c: 'left-[4%] top-[18%]', d: '0s' },
    { e: '📖', c: 'right-[6%] top-[26%]', d: '1s' },
    { e: '✏️', c: 'left-[8%] top-[62%]', d: '2s' },
    { e: '🌈', c: 'right-[4%] top-[72%]', d: '0.5s' },
    { e: '☁️', c: 'left-[46%] top-[90%]', d: '1.5s' },
  ]
  return (
    <div
      aria-hidden="true"
      className="decorativo pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -left-24 -top-24 size-80 rounded-full bg-sky-200/50 blur-3xl" />
      <div className="absolute -right-20 top-1/3 size-72 rounded-full bg-pink-200/50 blur-3xl" />
      <div className="absolute -bottom-24 left-1/4 size-96 rounded-full bg-amber-200/50 blur-3xl" />
      {dibujos.map((x) => (
        <span
          key={x.e}
          className={`absolute hidden animate-flotar text-4xl opacity-30 lg:block ${x.c}`}
          style={{ animationDelay: x.d }}
        >
          {x.e}
        </span>
      ))}
    </div>
  )
}

export default function LayoutAlumno() {
  const { usuario, salir } = useAuth()
  const inicial = usuario.nombre?.trim()[0]?.toUpperCase() ?? '?'
  return (
    <div className="tema-alumno relative isolate min-h-screen bg-linear-to-b from-sky-50 via-white to-amber-50">
      <FondoDecorado />
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
          <Link to="/alumno" aria-label="Ir a mis lecturas" className="shrink-0">
            <img src={logo} alt="Lectur" className="h-9 w-auto transition hover:scale-105" />
          </Link>
          <nav className="hidden gap-1.5 sm:flex" aria-label="Principal">
            {SECCIONES.map((s) => (
              <Seccion key={s.to} s={s} />
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2.5">
            <AjustesLectura compacto />
            <span
              className="flex size-10 items-center justify-center rounded-full bg-linear-to-br from-amber-300 to-pink-400 text-lg font-extrabold text-white shadow-sm ring-2 ring-white"
              title={usuario.nombre}
              aria-hidden="true"
            >
              {inicial}
            </span>
            <button
              onClick={salir}
              className="rounded-xl px-2 py-1 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-ink"
            >
              Salir
            </button>
          </div>
        </div>
        <div className="decorativo h-1.5 bg-linear-to-r from-sky-400 via-amber-300 to-pink-400" />
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:pb-8">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-24 text-center text-xs text-slate-500 sm:pb-6 print:hidden">
        <Link to="/privacidad" className="hover:underline">
          Privacidad
        </Link>{' '}
        ·{' '}
        <Link to="/terminos" className="hover:underline">
          Términos de uso
        </Link>
      </footer>

      {/* En pantallas chicas la navegación va abajo, como en las apps */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 gap-1 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur sm:hidden print:hidden"
      >
        {SECCIONES.map((s) => (
          <Seccion key={s.to} s={s} abajo />
        ))}
      </nav>
    </div>
  )
}
