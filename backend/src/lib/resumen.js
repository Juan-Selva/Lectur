// Arma fortalezas y sugerencias para el resumen de familias a partir de datos reales.
// Es una regla simple y explicable, no una evaluación diagnóstica.
import { ETIQUETAS_HABILIDAD, FRASE_FAMILIA } from './habilidades.js'

const UMBRAL = 0.7

export function armarObservaciones({
  literal,
  inferencial,
  palabrasConsultadas,
  lecturasConCuestionario,
  reforzar = null,
}) {
  const fortalezas = []
  const sugerencias = []

  if (lecturasConCuestionario === 0) {
    return {
      fortalezas,
      sugerencias: [
        'Todavía no hay cuestionarios resueltos, por lo que aún no se puede evaluar la comprensión.',
      ],
    }
  }

  if (literal.total > 0) {
    if (literal.correctas / literal.total >= UMBRAL) {
      fortalezas.push('Comprende bien lo que el texto dice de forma directa.')
    } else {
      sugerencias.push('Practicar releer el texto y buscar en él la respuesta a cada pregunta.')
    }
  }
  if (inferencial.total > 0) {
    if (inferencial.correctas / inferencial.total >= UMBRAL) {
      fortalezas.push('Entiende lo que el texto sugiere sin decirlo directamente.')
    } else {
      sugerencias.push(
        'Conversar en casa sobre por qué pasan las cosas en los cuentos y qué sienten los personajes.',
      )
    }
  }
  if (reforzar) {
    // La sugerencia de la habilidad que más cuesta va primero.
    sugerencias.unshift(
      `Para reforzar (${ETIQUETAS_HABILIDAD[reforzar.habilidad].toLowerCase()}): ${FRASE_FAMILIA[reforzar.habilidad]}`,
    )
  }
  if (palabrasConsultadas >= 3) {
    fortalezas.push('Busca en el diccionario las palabras que no conoce.')
    sugerencias.push('Charlar sobre el significado de las palabras nuevas y usarlas en frases.')
  }
  return { fortalezas, sugerencias }
}
