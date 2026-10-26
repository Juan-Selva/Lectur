import { useState } from 'react'
import { Boton, Mensaje, Tarjeta } from './ui.jsx'
import { api } from '../lib/api.js'

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
        <input
          aria-label="Palabra"
          autoFocus={autoFocus}
          value={palabra}
          onChange={(e) => setPalabra(e.target.value)}
          placeholder="Por ejemplo: huerto"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <Boton type="submit" disabled={buscando || !palabra.trim()}>
          {buscando ? 'Buscando…' : 'Buscar'}
        </Boton>
      </form>
      <Mensaje>{error}</Mensaje>
      {resultado && (
        <Tarjeta>
          <h2 className="text-xl font-bold capitalize text-brand-dark">{resultado.palabra}</h2>
          <p className="lectura mt-2">{resultado.significado}</p>
        </Tarjeta>
      )}
    </div>
  )
}
