// Historia de usuario 3 — Cuestionario de comprensión.
// El resultado se guarda solo en el estado de navegación (se pasa a
// /resultado vía location.state) — todavía no hay backend que lo persista.
import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import textos from '../data/textos.json'

export default function Cuestionario() {
  const { textoId } = useParams()
  const navigate = useNavigate()
  const texto = textos.find((t) => t.id === textoId)
  const [respuestas, setRespuestas] = useState({})

  if (!texto) {
    return (
      <div className="space-y-4">
        <p>No encontramos ese texto.</p>
        <Link to="/" className="text-amber-700 underline">
          Volver a elegir un texto
        </Link>
      </div>
    )
  }

  const todasRespondidas = texto.preguntas.every((p) => respuestas[p.id] !== undefined)

  function elegirOpcion(preguntaId, index) {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: index }))
  }

  function enviar() {
    const correctas = texto.preguntas.filter(
      (p) => respuestas[p.id] === p.correcta,
    ).length

    navigate('/resultado', {
      state: {
        titulo: texto.titulo,
        total: texto.preguntas.length,
        correctas,
      },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">¿Qué entendiste de "{texto.titulo}"?</h1>
        <p className="mt-1 text-slate-500">Elegí la respuesta que te parezca correcta en cada pregunta.</p>
      </div>

      <div className="space-y-5">
        {texto.preguntas.map((pregunta, i) => (
          <div key={pregunta.id} className="rounded-xl border border-neutral-700 bg-white p-4 shadow-sm">
            <p className="mb-3 font-semibold text-slate-800">
              {i + 1}. {pregunta.texto}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {pregunta.opciones.map((opcion, index) => {
                const seleccionada = respuestas[pregunta.id] === index
                return (
                  <button
                    key={index}
                    onClick={() => elegirOpcion(pregunta.id, index)}
                    className={
                      seleccionada
                        ? 'rounded-lg border-2 border-amber-500 bg-amber-100 px-3 py-2 text-left text-sm font-medium text-amber-900'
                        : 'rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-600 hover:border-amber-300'
                    }
                  >
                    {opcion}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={enviar}
        disabled={!todasRespondidas}
        className="w-full rounded-xl bg-amber-400 px-4 py-3 font-semibold text-amber-950 shadow-sm transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 sm:w-auto"
      >
        Enviar respuestas
      </button>
    </div>
  )
}
