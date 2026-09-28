import { Link, useLocation, Navigate } from 'react-router-dom'
import { CheckCircle2 } from '../components/icons.jsx'

export default function Resultado() {
  const { state } = useLocation()

  if (!state) {
    return <Navigate to="/" replace />
  }

  const { titulo, total, correctas } = state

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-neutral-700 bg-white p-8 text-center shadow-sm">
      <CheckCircle2 className="h-12 w-12 text-amber-500" />
      <h1 className="text-2xl font-bold text-slate-800">¡Muy bien!</h1>
      <p className="text-slate-600">
        Respondiste {correctas} de {total} preguntas de "{titulo}" correctamente.
      </p>
      <p className="max-w-sm text-sm text-slate-400">
        Este resultado, en la versión final, se va a reflejar automáticamente en el
        semáforo del docente. Por ahora esa pantalla muestra datos de ejemplo.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-xl bg-amber-400 px-4 py-2 font-semibold text-amber-950 transition hover:bg-amber-500"
      >
        Elegir otro texto
      </Link>
    </div>
  )
}
