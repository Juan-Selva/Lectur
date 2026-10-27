import { acerto, ordenOriginal } from './preguntas.js'

// Regla del semáforo (tomada de la demo de Figma): puntaje sobre 10.
//   >= 7  -> verde    (En nivel)
//   >= 4  -> amarillo (A seguir)
//   < 4   -> rojo     (Atención)
export const UMBRAL_VERDE = 7
export const UMBRAL_AMARILLO = 4

export function estadoPorPuntaje(puntaje) {
  if (puntaje === null || puntaje === undefined) return null
  if (puntaje >= UMBRAL_VERDE) return 'verde'
  if (puntaje >= UMBRAL_AMARILLO) return 'amarillo'
  return 'rojo'
}

// Corrige un cuestionario. `preguntas` viene de la base (con `correcta`),
// `respuestas` es [{ preguntaId, opcion }] o, en las de ordenar, [{ preguntaId, orden }].
export function calcularResultado(preguntas, respuestas) {
  const porPregunta = new Map(respuestas.map((r) => [r.preguntaId, r]))
  let correctas = 0
  let literalesOk = true
  let inferencialesOk = true

  const detalle = preguntas.map((p) => {
    const r = porPregunta.get(p.id)
    const acierto = acerto(p, r)
    if (acierto) correctas += 1
    else if (p.tipo === 'literal') literalesOk = false
    else inferencialesOk = false
    // En las de ordenar se guarda el orden elegido, como posiciones originales de cada elemento.
    return p.formato === 'orden' && r?.orden
      ? { preguntaId: p.id, orden: ordenOriginal(p, r.orden), acierto }
      : { preguntaId: p.id, opcion: r?.opcion, acierto }
  })

  const total = preguntas.length
  const puntaje = total === 0 ? 0 : Math.round((correctas / total) * 100) / 10

  return {
    correctas,
    total,
    puntaje,
    literalCompleto: literalesOk,
    inferencialCompleto: inferencialesOk,
    detalle,
  }
}
