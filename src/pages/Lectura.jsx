// Historia de usuario 2 — Lectura autónoma en la app.
import { useNavigate, useParams, Link } from 'react-router-dom'
import textos from '../data/textos.json'
import { ArrowLeft } from '../components/icons.jsx'

export default function Lectura() {
  const { textoId } = useParams()
  const navigate = useNavigate()
  const texto = textos.find((t) => t.id === textoId)

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

  const parrafos = texto.cuerpo.split('\n\n')
  const esAvanzado = texto.nivel === 'avanzado'

  return (
    <div className="space-y-6">
      <Link to="/" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Elegir otro texto
      </Link>

      <div
        className={
          esAvanzado
            ? 'rounded-2xl border-2 border-neutral-700 bg-amber-50 p-6 shadow-sm'
            : 'rounded-2xl border border-neutral-700 bg-white p-6 shadow-sm'
        }
      >
        {esAvanzado && (
          <span className="mb-3 inline-block rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-semibold text-amber-950">
            Nivel avanzado — texto más largo
          </span>
        )}
        <h1 className="mb-4 text-2xl font-bold text-slate-800">{texto.titulo}</h1>
        <div className="space-y-4">
          {parrafos.map((parrafo, i) => (
            <p key={i} className="text-lg leading-relaxed text-slate-700">
              {parrafo}
            </p>
          ))}
        </div>
      </div>

      <button
        onClick={() => navigate(`/cuestionario/${texto.id}`)}
        className="w-full rounded-xl bg-amber-400 px-4 py-3 font-semibold text-amber-950 shadow-sm transition hover:bg-amber-500 sm:w-auto"
      >
        Ya leí el texto, quiero responder las preguntas
      </button>
    </div>
  )
}
