import { useState } from 'react'
import { Modal } from './ui.jsx'
import BuscadorPalabras from './BuscadorPalabras.jsx'

// Botón que abre el diccionario en una ventana sobre la lectura, sin salir de la pantalla.
export default function DiccionarioRapido({ children, className, palabraInicial = '' }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setAbierto(true)} className={className}>
        {children}
      </button>
      {abierto && (
        <Modal titulo="Diccionario escolar" onCerrar={() => setAbierto(false)}>
          <p className="mb-3 text-sm text-slate-600">
            Escribí una palabra para conocer su significado con explicaciones y ejemplos para primaria.
          </p>
          <BuscadorPalabras autoFocus palabraInicial={palabraInicial} />
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cerrar y seguir leyendo
          </button>
        </Modal>
      )}
    </>
  )
}
