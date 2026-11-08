import { useEffect, useState } from 'react'
import { Boton, Mensaje, Tarjeta } from './ui.jsx'
import { api } from '../lib/api.js'

const puedeHablar = typeof window !== 'undefined' && 'speechSynthesis' in window

// Lee la palabra en voz alta con la pronunciación del navegador.
function decir(texto) {
  if (!puedeHablar) return
  const voz = new SpeechSynthesisUtterance(texto)
  voz.lang = 'es-AR'
  voz.rate = 0.85
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(voz)
}

export default function BuscadorPalabras({ autoFocus = false, palabraInicial = '' }) {
  const [palabra, setPalabra] = useState(palabraInicial)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  const [sugerencias, setSugerencias] = useState([])
  const [buscando, setBuscando] = useState(false)

  async function ejecutarBusqueda(termino) {
    const texto = termino.trim()
    if (!texto) return
    setError('')
    setSugerencias([])
    setResultado(null)
    setBuscando(true)
    try {
      const res = await api.definir(texto)
      setResultado(res)
    } catch (err) {
      setError(
        err.status === 404
          ? 'No encontramos esa palabra. Revisá cómo está escrita.'
          : err.message,
      )
      if (err.data?.sugerencias?.length) {
        setSugerencias(err.data.sugerencias)
      }
    } finally {
      setBuscando(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    ejecutarBusqueda(palabra)
  }

  function elegirPalabra(nueva) {
    setPalabra(nueva)
    ejecutarBusqueda(nueva)
  }

  useEffect(() => {
    if (!palabraInicial) return
    let cancelado = false
    api
      .definir(palabraInicial.trim())
      .then((res) => {
        if (!cancelado) setResultado(res)
      })
      .catch((err) => {
        if (!cancelado) {
          setError(
            err.status === 404
              ? 'No encontramos esa palabra. Revisá cómo está escrita.'
              : err.message,
          )
          if (err.data?.sugerencias?.length) {
            setSugerencias(err.data.sugerencias)
          }
        }
      })
    return () => {
      cancelado = true
    }
  }, [palabraInicial])

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl"
          >
            🔎
          </span>
          <input
            aria-label="Palabra"
            autoFocus={autoFocus}
            value={palabra}
            onChange={(e) => setPalabra(e.target.value)}
            placeholder="Por ejemplo: huerto, paciencia, brújula…"
            className="block w-full rounded-2xl border-2 border-slate-300 bg-white py-3.5 pl-12 pr-4 text-lg font-medium outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
        </div>
        <Boton type="submit" disabled={buscando || !palabra.trim()}>
          {buscando ? 'Buscando…' : 'Buscar'}
        </Boton>
      </form>

      {error && <Mensaje>{error}</Mensaje>}

      {sugerencias.length > 0 && (
        <div className="animate-aparecer rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/80 p-4">
          <p className="font-bold text-emerald-900">¿Quizás quisiste decir alguna de estas?</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {sugerencias.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => elegirPalabra(sug)}
                className="boton-juego rounded-xl border border-emerald-300 bg-white px-3.5 py-1.5 text-sm font-bold text-emerald-800 shadow-xs hover:bg-emerald-100"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {resultado && (
        <Tarjeta className="animate-aparecer border-2 border-emerald-200 bg-linear-to-br from-white to-emerald-50/30 p-6 shadow-xs">
          {resultado.esVariante && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800">
              <span aria-hidden="true">💡</span>
              <span>{resultado.mensajeVariante || `Te mostramos la palabra base "${resultado.palabraBase}".`}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-3xl font-extrabold capitalize text-emerald-900">
              {resultado.palabra}
            </h2>

            {puedeHablar && (
              <button
                type="button"
                onClick={() => decir(resultado.palabra)}
                className="rounded-full border-2 border-emerald-200 bg-white px-3.5 py-1 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
              >
                <span aria-hidden="true">🔊</span> Escuchar
              </button>
            )}
          </div>

          <div className="mt-4">
            <p className="lectura text-xl leading-relaxed text-slate-800">
              {resultado.significado}
            </p>
          </div>

          {resultado.ejemplo && (
            <div className="mt-4 pt-3.5 border-t border-slate-100">
              <p className="text-base text-slate-600 leading-relaxed">
                <span className="font-bold text-emerald-800 mr-2 not-italic">Por ejemplo:</span>
                <span className="italic text-slate-700">«{resultado.ejemplo}»</span>
              </p>
            </div>
          )}
        </Tarjeta>
      )}
    </div>
  )
}
