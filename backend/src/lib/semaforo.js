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
// `respuestas` es [{ preguntaId, opcion }].
export function calcularResultado(preguntas, respuestas) {
  const porPregunta = new Map(respuestas.map((r) => [r.preguntaId, r.opcion]))
  let correctas = 0
  let literalesOk = true
  let inferencialesOk = true

  const detalle = preguntas.map((p) => {
    const opcion = porPregunta.get(p.id)
    const acierto = opcion === p.correcta
    if (acierto) correctas += 1
    else if (p.tipo === 'literal') literalesOk = false
    else inferencialesOk = false
    return { preguntaId: p.id, opcion, acierto }
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
