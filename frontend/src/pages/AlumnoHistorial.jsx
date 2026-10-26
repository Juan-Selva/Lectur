import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Categoria, Cargando, Mensaje, Tarjeta } from '../components/ui.jsx'
import Mascota from '../components/Mascota.jsx'
import { Estrellas } from '../components/Festejo.jsx'
import { fechaCorta } from '../lib/fechas.js'
import { estrellasDe } from '../lib/logros.js'
import { SIN_CATEGORIA, categoria } from '../lib/categorias.js'
import { api } from '../lib/api.js'

function Contador({ emoji, valor, texto, colores }) {
  return (
    <div className={`tarjeta flex flex-col items-center gap-1 p-4 text-center ${colores}`}>
      <span aria-hidden="true" className="text-3xl">
        {emoji}
      </span>
      <span className="titulo-juego text-3xl leading-none">{valor}</span>
      <span className="text-sm font-bold">{texto}</span>
    </div>
  )
}

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

  const estrellas = items.reduce((n, h) => n + estrellasDe(h.aciertos), 0)
  const correctas = items.reduce((n, h) => n + (h.aciertos?.correctas ?? 0), 0)

  return (
    <div className="space-y-6">
      <section className="hero flex items-center gap-4 rounded-3xl border-2 border-violet-200 bg-linear-to-br from-violet-100 via-fuchsia-50 to-sky-100 p-6">
        <span aria-hidden="true" className="animate-flotar text-6xl">
          🏆
        </span>
        <div>
          <h1 className="text-3xl">Mis logros</h1>
          <p className="font-semibold text-slate-700">Todo lo que ya leíste, en un solo lugar.</p>
        </div>
      </section>

      {items.length === 0 ? (
        <Tarjeta className="flex flex-col items-center gap-3 py-8 text-center">
          <Mascota className="size-24 animate-flotar" />
          <p className="titulo-juego text-xl">Todavía no completaste ninguna lectura.</p>
          <p className="text-slate-600">¡Tu primera estrella te está esperando!</p>
          <Link
            to="/alumno"
            className="boton-juego rounded-2xl bg-gold px-5 py-2.5 font-extrabold text-ink"
          >
            Ir a mis lecturas
          </Link>
        </Tarjeta>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Contador
            emoji="📚"
            valor={items.length}
            texto={items.length === 1 ? 'lectura' : 'lecturas'}
            colores="border-sky-100 bg-sky-50 text-sky-900"
          />
          <Contador
            emoji="⭐"
            valor={estrellas}
            texto={estrellas === 1 ? 'estrella' : 'estrellas'}
            colores="border-amber-100 bg-amber-50 text-amber-900"
          />
          <Contador
            emoji="✅"
            valor={correctas}
            texto={correctas === 1 ? 'respuesta bien' : 'respuestas bien'}
            colores="border-emerald-100 bg-emerald-50 text-emerald-900"
          />
        </div>
      )}

      <ul className="space-y-3">
        {items.map((h, i) => {
          const c = categoria(h.categoria) ?? SIN_CATEGORIA
          return (
            <li key={h.id}>
              <Tarjeta
                className="animate-aparecer space-y-3"
                style={{ animationDelay: `${Math.min(i, 10) * 0.05}s` }}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${c.fondo}`}
                  >
                    {c.emoji}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h2 className="text-lg leading-tight">{h.titulo}</h2>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      <Categoria valor={h.categoria} />
                      {fechaCorta(h.completadaEn)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {h.aciertos ? (
                      <>
                        <Estrellas cantidad={estrellasDe(h.aciertos)} tamano="text-xl" />
                        <span className="text-sm font-bold text-slate-700">
                          {h.aciertos.correctas} de {h.aciertos.total} correctas
                        </span>
                      </>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">
                        📖 Solo lectura
                      </span>
                    )}
                  </div>
                </div>
                {h.preguntas.length > 0 && (
                  <>
                    <button
                      className="rounded-xl px-2 py-1 text-sm font-bold text-brand hover:bg-brand-soft"
                      aria-expanded={abierto === h.id}
                      onClick={() => setAbierto(abierto === h.id ? null : h.id)}
                    >
                      {abierto === h.id ? '▲ Ocultar preguntas' : '▼ Ver mis respuestas'}
                    </button>
                    {abierto === h.id && (
                      <ul className="animate-aparecer space-y-2 text-sm">
                        {h.preguntas.map((p, k) => (
                          <li
                            key={k}
                            className={`flex items-start gap-2 rounded-xl px-3 py-2 ${
                              p.acierto ? 'bg-emerald-50' : 'bg-amber-50'
                            }`}
                          >
                            <span
                              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white ${
                                p.acierto ? 'bg-success' : 'bg-amber-500'
                              }`}
                              role="img"
                              aria-label={p.acierto ? 'Bien' : 'Para repasar'}
                            >
                              {p.acierto ? '✓' : '↻'}
                            </span>
                            <span className="pt-0.5">{p.enunciado}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </Tarjeta>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
