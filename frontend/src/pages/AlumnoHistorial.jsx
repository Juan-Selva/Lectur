import { useEffect, useState } from 'react'
import { Categoria, Cargando, Mensaje, Tarjeta } from '../components/ui.jsx'
import { fechaCorta } from '../lib/fechas.js'
import { api } from '../lib/api.js'

export default function AlumnoHistorial() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [abierto, setAbierto] = useState(null)

  useEffect(() => {
    api
      .historial()
      .then((r) => setItems(r.historial))
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <Mensaje>{error}</Mensaje>
  if (!items) return <Cargando />

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Mi historial</h1>
      {items.length === 0 && (
        <Tarjeta className="text-slate-600">Todavía no completaste ninguna lectura.</Tarjeta>
      )}
      {items.map((h) => (
        <Tarjeta key={h.id} className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <h2 className="text-lg font-bold">{h.titulo}</h2>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Categoria valor={h.categoria} />
                {fechaCorta(h.completadaEn)}
              </div>
            </div>
            <span className="text-sm font-semibold text-slate-700">
              {h.aciertos
                ? `${h.aciertos.correctas} de ${h.aciertos.total} correctas`
                : 'Solo lectura'}
            </span>
          </div>
          {h.preguntas.length > 0 && (
            <>
              <button
                className="text-sm font-semibold text-brand hover:underline"
                onClick={() => setAbierto(abierto === h.id ? null : h.id)}
              >
                {abierto === h.id ? 'Ocultar preguntas' : 'Ver mis respuestas'}
              </button>
              {abierto === h.id && (
                <ul className="space-y-1 text-sm">
                  {h.preguntas.map((p, i) => (
                    <li key={i} className="flex gap-2">
                      <span
                        className={p.acierto ? 'font-bold text-success' : 'font-bold text-danger'}
                        aria-label={p.acierto ? 'Bien' : 'Para repasar'}
                      >
                        {p.acierto ? '✓' : '✗'}
                      </span>
                      {p.enunciado}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Tarjeta>
      ))}
    </div>
  )
}
