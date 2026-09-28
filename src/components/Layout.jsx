import { Outlet, Link, useLocation } from 'react-router-dom'
import { BookOpenText, LayoutDashboard } from './icons.jsx'

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-amber-50/60 text-slate-800">
      <header className="border-b border-amber-200 bg-amber-400 shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold text-amber-950">
            <BookOpenText className="h-5 w-5" />
            Lectur
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/"
              className={
                location.pathname === '/'
                  ? 'rounded-full bg-amber-950/10 px-3 py-1 font-semibold text-amber-950'
                  : 'px-3 py-1 text-amber-950/70 hover:text-amber-950'
              }
            >
              Vista alumno
            </Link>
            <Link
              to="/docente"
              className={
                location.pathname === '/docente'
                  ? 'flex items-center gap-1 rounded-full bg-amber-950/10 px-3 py-1 font-semibold text-amber-950'
                  : 'flex items-center gap-1 px-3 py-1 text-amber-950/70 hover:text-amber-950'
              }
            >
              <LayoutDashboard className="h-4 w-4" />
              Vista docente
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
