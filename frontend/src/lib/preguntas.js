// Enunciado con palabras resaltadas: lo que va entre asteriscos (*palabra*) se muestra marcado.
export function partesEnunciado(texto) {
  return String(texto)
    .split(/\*([^*]+)\*/g)
    .map((t, i) => ({ texto: t, resaltado: i % 2 === 1 }))
    .filter((p) => p.texto !== '')
}

// Mueve el elemento `i` una posición (delta -1 sube, +1 baja). Devuelve una lista nueva.
export function mover(lista, i, delta) {
  const j = i + delta
  if (j < 0 || j >= lista.length) return lista
  const nueva = [...lista]
  ;[nueva[i], nueva[j]] = [nueva[j], nueva[i]]
  return nueva
}

export const ordenInicial = (n) => Array.from({ length: n }, (_, i) => i)

// Cuántos elementos puede tener una pregunta de ordenar.
export const MIN_ELEMENTOS = 2
export const MAX_ELEMENTOS = 6

// Una pregunta de orden se considera respondida cuando el alumno movió algo o confirmó el orden.
export const estaRespondida = (respuestas, p) => respuestas[p.id] !== undefined

// Lo que se manda a la API por cada pregunta.
export const armarRespuesta = (p, valor) =>
  p.formato === 'orden' ? { preguntaId: p.id, orden: valor } : { preguntaId: p.id, opcion: valor }
