// Historia de usuario 1 — Asignación de texto según nivel.
// Por ahora es una selección manual simplificada (no hay lógica de
// asignación automática todavía): el alumno o el docente elige el nivel
// y el sistema le muestra un texto fijo guardado en JSON local.
import { useNavigate } from 'react-router-dom'
import textos from '../data/textos.json'

const nivelLabel = {
  basico: 'Básico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
}

export default function SeleccionTexto() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">¡Hola! Elegí tu texto de hoy</h1>
        <p className="mt-1 text-slate-500">
          Cada texto tiene un nivel distinto. En esta demo lo elegís vos, pero en la
          versión final Lectur te va a asignar uno automáticamente según tu nivel.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {textos.map((texto) => (
          <button
            key={texto.id}
            onClick={() => navigate(`/leer/${texto.id}`)}
            className="flex flex-col items-start rounded-xl border border-neutral-700 bg-white p-4 text-left shadow-sm transition hover:border-neutral-700 hover:shadow-md"
          >
            <span className="mb-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              {nivelLabel[texto.nivel]}
            </span>
            <span className="font-semibold text-slate-800">{texto.titulo}</span>
            <span className="mt-1 text-sm text-slate-500">
              {texto.cuerpo.replace(/\n+/g, ' ').slice(0, 60)}...
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
