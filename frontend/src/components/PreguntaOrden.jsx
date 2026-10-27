import { mover, ordenInicial } from '../lib/preguntas.js'

// Pregunta de ordenar: el alumno sube y baja los elementos hasta dejarlos en orden.
// `opciones` son los elementos tal como se muestran; `valor` es el orden elegido (lugares mostrados) o undefined.
export default function PreguntaOrden({ opciones, valor, onCambiar }) {
  const actual = valor ?? ordenInicial(opciones.length)
  const boton =
    'flex size-9 items-center justify-center rounded-xl border-2 border-slate-200 bg-white font-extrabold text-brand hover:bg-brand-soft disabled:opacity-30 disabled:hover:bg-white'
  return (
    <div className="space-y-2.5">
      <ol className="grid gap-2.5">
        {actual.map((k, pos) => (
          <li
            key={k}
            className="lectura flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3"
          >
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand text-base font-extrabold text-white"
            >
              {pos + 1}
            </span>
            <span className="flex-1">{opciones[k]}</span>
            <button
              type="button"
              className={boton}
              disabled={pos === 0}
              aria-label={`Subir «${opciones[k]}»`}
              onClick={() => onCambiar(mover(actual, pos, -1))}
            >
              ▲
            </button>
            <button
              type="button"
              className={boton}
              disabled={pos === actual.length - 1}
              aria-label={`Bajar «${opciones[k]}»`}
              onClick={() => onCambiar(mover(actual, pos, 1))}
            >
              ▼
            </button>
          </li>
        ))}
      </ol>
      {valor === undefined ? (
        <button
          type="button"
          className="text-sm font-bold text-brand underline"
          onClick={() => onCambiar(actual)}
        >
          Dejar este orden
        </button>
      ) : (
        <p className="text-sm font-semibold text-emerald-700">Orden elegido ✓</p>
      )}
    </div>
  )
}
