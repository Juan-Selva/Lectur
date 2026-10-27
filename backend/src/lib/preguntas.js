// Formatos de pregunta: 'opcion' (opción múltiple) y 'orden' (ordenar elementos).
// En las de orden, `opciones` guarda los elementos en el orden correcto. Al alumno se le entregan mezclados con
// una mezcla fija por pregunta (no depende de quién la pida), que nunca coincide con el orden correcto.
import { badRequest } from './errors.js'

export const FORMATOS = ['opcion', 'orden']
export const MAX_ELEMENTOS_ORDEN = 6

// Generador pseudoaleatorio chico (mulberry32): mismo número de pregunta -> misma mezcla.
function generador(semilla) {
  let a = semilla >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// perm[k] = posición original del elemento que se muestra en el lugar k.
export function mezcla(preguntaId, n) {
  const azar = generador(Math.imul(preguntaId, 2654435761) ^ 0x9e3779b9)
  const perm = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1))
    ;[perm[i], perm[j]] = [perm[j], perm[i]]
  }
  if (n > 1 && perm.every((v, i) => v === i)) perm.push(perm.shift()) // nunca ya ordenada
  return perm
}

// Pregunta como la ve el alumno: sin la respuesta correcta; las de orden con los elementos mezclados.
export function preguntaParaAlumno(p) {
  const base = { id: p.id, orden: p.orden, enunciado: p.enunciado, tipo: p.tipo, formato: p.formato }
  if (p.formato === 'orden') {
    return { ...base, opciones: mezcla(p.id, p.opciones.length).map((i) => p.opciones[i]) }
  }
  return { ...base, opciones: p.opciones }
}

// Un orden elegido sobre los elementos mostrados -> las posiciones originales en ese orden.
export const ordenOriginal = (p, ordenMostrado) => {
  const perm = mezcla(p.id, p.opciones.length)
  return ordenMostrado.map((k) => perm[k])
}

// Devuelve un mensaje si la respuesta no corresponde a la pregunta, o null si está bien.
export function errorDeRespuesta(p, r) {
  if (p.formato === 'orden') {
    const n = p.opciones.length
    const o = r.orden
    if (r.opcion !== undefined || !Array.isArray(o) || o.length !== n) return 'Ordená todos los elementos'
    if (new Set(o).size !== n || o.some((k) => !Number.isInteger(k) || k < 0 || k >= n))
      return 'Orden inválido'
    return null
  }
  if (r.orden !== undefined || !Number.isInteger(r.opcion) || r.opcion < 0 || r.opcion >= p.opciones.length)
    return 'Opción inexistente'
  return null
}

export function validarRespuestas(preguntas, respuestas) {
  const porId = new Map(preguntas.map((p) => [p.id, p]))
  if (respuestas.some((x) => !porId.has(x.preguntaId)))
    throw badRequest('Hay respuestas a preguntas que no son de este texto')
  if (new Set(respuestas.map((x) => x.preguntaId)).size !== preguntas.length)
    throw badRequest('Tenés que responder todas las preguntas')
  for (const x of respuestas) {
    const mensaje = errorDeRespuesta(porId.get(x.preguntaId), x)
    if (mensaje) throw badRequest(mensaje)
  }
}

// ¿Acertó? Las de orden valen completas o nada: todos los elementos en su lugar.
export function acerto(p, r) {
  if (!r) return false
  if (p.formato === 'orden') {
    return Array.isArray(r.orden) && ordenOriginal(p, r.orden).every((v, i) => v === i)
  }
  return r.opcion === p.correcta
}
