// Habilidades que mide cada pregunta (ver backend/src/lib/habilidades.js).
export const HABILIDADES = [
  {
    valor: 'dato_explicito',
    etiqueta: 'Dato explícito',
    ayuda: 'Está escrito tal cual en el texto',
  },
  {
    valor: 'inferencia',
    etiqueta: 'Inferencia',
    ayuda: 'Hay que deducirlo de lo que el texto sugiere',
  },
  {
    valor: 'estructura',
    etiqueta: 'Estructura del texto',
    ayuda: 'Inicio, nudo y desenlace; orden de los hechos',
  },
  { valor: 'idea_principal', etiqueta: 'Idea principal', ayuda: 'De qué trata el texto' },
  {
    valor: 'vocabulario_contexto',
    etiqueta: 'Vocabulario por contexto',
    ayuda: 'Qué significa una palabra en la oración',
  },
  {
    valor: 'convenciones',
    etiqueta: 'Convenciones de escritura',
    ayuda: 'Mayúsculas, puntos, oraciones y párrafos',
  },
]

export const etiquetaHabilidad = (valor) =>
  HABILIDADES.find((h) => h.valor === valor)?.etiqueta ?? valor

// Porcentaje entero de aciertos; null si no hay preguntas.
export const porcentaje = ({ correctas, total }) =>
  total > 0 ? Math.round((correctas / total) * 100) : null

// "Inferencia: 2 de 5 (40 %)"
export const textoHabilidad = (h) =>
  `${etiquetaHabilidad(h.habilidad)}: ${h.correctas} de ${h.total} (${porcentaje(h)} %)`

// Frase del semáforo del curso o grado; null si ninguna habilidad está floja.
export function fraseCurso(reforzar, ambito) {
  if (!reforzar) return null
  return `${ambito}, la habilidad que más cuesta es ${etiquetaHabilidad(reforzar.habilidad).toLowerCase()} (${porcentaje(reforzar)} % de aciertos).`
}
