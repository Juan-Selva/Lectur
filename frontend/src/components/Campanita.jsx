import { Link } from 'react-router-dom'
import { useAlertas } from '../lib/alertas.jsx'

export default function Campanita() {
  const { noVistas } = useAlertas()
  return (
    <Link
      to="/docente/alertas"
      aria-label={noVistas > 0 ? `Alertas: ${noVistas} sin ver` : 'Alertas: ninguna sin ver'}
      className="relative inline-flex size-9 items-center justify-center rounded-lg border border-slate-300 bg-white hover:bg-slate-50"
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="currentColor">
        <path d="M12 2a6 6 0 0 0-6 6v3.6c0 .5-.2 1-.5 1.4L4 14.600a1 1 0 0 0 .8 1.600h14.400a1 1 0 0 0 .8-1.600l-1.500-1.600a2 2 0 0 1-.5-1.400V8a6 6 0 0 0-6-6Zm0 20a3 3 0 0 0 2.800-2H9.200A3 3 0 0 0 12 22Z" />
      </svg>
      {noVistas > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-danger px-1 text-xs font-bold text-white">
          {noVistas > 99 ? '99+' : noVistas}
        </span>
      )}
    </Link>
  )
}
