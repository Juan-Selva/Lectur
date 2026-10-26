import { useState } from 'react'
import { Boton, Mensaje, Tarjeta } from './ui.jsx'
import { api } from '../lib/api.js'

const puedeHablar = typeof window !== 'undefined' && 'speechSynthesis' in window

// Lee la palabra en voz alta con la voz que trae el navegador.
function decir(texto) {
  const voz = new SpeechSynthesisUtterance(texto)
  voz.lang = 'es-AR'
  voz.rate = 0.85
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(voz)
}

// Buscador del diccionario. Lo usan la pantalla Diccionario y la ventana rápida de la lectura.
export default function BuscadorPalabras({ autoFocus = false }) {
  const [palabra, setPalabra] = useState('')
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  const [buscando, setBuscando] = useState(false)

  async function buscar(e) {
    e.preventDefault()
    setError('')
    setResultado(null)
    setBuscando(true)
    try {
      setResultado(await api.definir(palabra.trim()))
    } catch (err) {
      setError(
        err.status === 404 ? 'No encontramos esa palabra. Revisá cómo está escrita.' : err.message,
      )
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={buscar} className="flex gap-2">
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
            placeholder="Por ejemplo: huerto"
            className="block w-full rounded-2xl border-2 border-slate-300 bg-white py-3 pl-12 pr-4 text-lg outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
        </div>
        <Boton type="submit" disabled={buscando || !palabra.trim()}>
          {buscando ? 'Buscando…' : 'Buscar'}
        </Boton>
      </form>
      <Mensaje>{error}</Mensaje>
      {resultado && (
        <Tarjeta className="animate-aparecer border-emerald-200 bg-linear-to-br from-white to-emerald-50">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-3xl capitalize text-emerald-800">{resultado.palabra}</h2>
            {puedeHablar && (
              <button
                type="button"
                onClick={() => decir(resultado.palabra)}
                className="rounded-full border-2 border-emerald-200 bg-white px-3 py-1 text-sm font-bold text-emerald-800 hover:bg-emerald-50"
              >
                <span aria-hidden="true">🔊</span> Escuchar
              </button>
            )}
          </div>
          <p className="lectura mt-2">{resultado.significado}</p>
        </Tarjeta>
      )}
    </div>
  )
}
