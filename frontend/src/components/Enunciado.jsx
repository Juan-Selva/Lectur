import { partesEnunciado } from '../lib/preguntas.js'

// Enunciado de una pregunta; lo que va entre *asteriscos* se resalta.
export default function Enunciado({ texto }) {
  return partesEnunciado(texto).map((p, i) =>
    p.resaltado ? (
      <mark key={i} className="rounded bg-gold/40 px-1 text-inherit">
        {p.texto}
      </mark>
    ) : (
      <span key={i}>{p.texto}</span>
    ),
  )
}
