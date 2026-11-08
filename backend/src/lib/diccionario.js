import { createRequire } from 'node:module'
import { detallesPrimaria, inferirDetalle } from './diccionario-primaria.js'

const require = createRequire(import.meta.url)

// Minúsculas y sin tildes (se conserva la ñ, que es otra letra).
export function normalizar(palabra) {
  return palabra
    .trim()
    .toLowerCase()
    .split('ñ')
    .map((parte) => parte.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    .join('ñ')
}

export const PALABRA_VALIDA = /^\p{L}+(?:-\p{L}+)*$/u

function conTiempoLimite(promesa, ms) {
  let timer
  const limite = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Tiempo de espera agotado')), ms)
  })
  return Promise.race([promesa, limite]).finally(() => clearTimeout(timer))
}

export function extraerSinonimos(texto) {
  if (!texto) return []
  const match = String(texto).match(/(?:Sin\.|Sinónimos:)\s*([^.\n]+)/i)
  if (!match) return []
  return match[1]
    .split(/[,;]/)
    .map((s) => s.replace(/\d+$/, '').trim().toLowerCase())
    .filter((s) => s.length >= 3 && s.length <= 25 && /^\p{L}+$/u.test(s))
    .slice(0, 3)
}

export function limpiarCabeceraRae(header) {
  if (!header) return ''
  const sinHtml = header.replace(/<[^>]*>/g, '').trim()
  // Descartar flexiones de género como "gato, ta", "perro, rra", "león, na"
  const lema = sinHtml.split(/[,/]/)[0].trim()
  return normalizar(lema)
}

// Adapta definiciones de diccionarios adultos (como la RAE) para que sean comprensibles
// por un chico de primaria: quita abreviaturas gramaticales, marcas técnicas, fórmulas arcaicas
// y acepciones con términos inapropiados o regionalismos extremos.
export function adaptarParaPrimaria(texto) {
  if (!texto) return null
  const partes = String(texto)
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)

  const limpias = partes
    .map((p) => {
      // Descartar acepciones con contenido no apto para primaria
      if (/ven[eé]re|amanceba|obscen|prost|insulto/i.test(p)) return null

      let t = p
        // Quitar sinónimos y antónimos pegados al texto de la RAE
        .replace(/(?:Sin\.|Ant\.|Confr\.|Comp\.):.*$/i, '')
        // Quitar marcas de uso de la RAE (ej. "U. en m. ref. a la especie." o "U. t. c. s.")
        .replace(/\b(?:U|u)\s*\.\s*(?:en\s+m\.)?\s*(?:ref\.\s*a\s*la\s*especie|[^\n.]*)\.?/gi, '')
        // Quitar referencias cruzadas de diccionario adulto (ej. "(‖ máquina para levantar pesos)")
        .replace(/\(‖[^)]*\)/g, '')
        // Quitar numeración de acepción
        .replace(/^\d+\.\s*/, '')
        // Quitar marcas de país o región al inicio (ej. "Perú. ", "Arg. y Ur. ", "C. Rica. ")
        .replace(
          /^(?:(?:Arg|Bol|Chile|Col|C\. Rica|Cuba|Ec|El Salv|Esp|Filip|Guat|Hond|Méx|Nic|Pan|Par|Perú|P\. Rico|R\. Dom|Ur|Ven)\.?(?:\s*(?:,|y|o)\s*)?)+\s*/i,
          '',
        )
        // Quitar abreviaturas gramaticales y de registro de la RAE
        .replace(/\b(?:tr|intr|prnl|adj|adv|prep|conj|interj|pron|art|loc)\.\s*/gi, '')
        .replace(/\b(?:f|m)\.\s*/gi, '')
        .replace(/\b(?:p|u)\.\s*(?:us|t|c)\.\s*/gi, '')
        .replace(/\b(?:coloq|desus|ant|fig|p\. ext|despect|poét)\.\s*/gi, '')
        .replace(
          /\b(?:Zool|Bot|Geom|Fís|Quím|Med|Mil|Mar|Astron|Dep|Der|Filipoco|Astambién|Carpoco)\.\s*/gi,
          '',
        )
        // Simplificar términos biológicos o anatómicos a palabras familiares para primaria
        .replace(/\bdigitígrado,?\s*/gi, '')
        .replace(/\bfélidos\b/gi, 'felinos')
        .replace(/\bcánidos\b/gi, 'caninos')
        // Simplificar fórmulas típicas
        .replace(/^dicho de una persona:\s*(?:que\s*)?/i, 'Persona que ')
        .replace(/^dicho de un animal:\s*(?:que\s*)?/i, 'Animal que ')
        .replace(/^dicho de una cosa:\s*(?:que\s*)?/i, 'Cosa que ')
        .replace(/^dicho de un color:\s*/i, 'Color ')
        .replace(/^perteneciente o relativo a(?:l| la| los| las)?\s+/i, 'Que tiene que ver con ')
        .replace(/^acción y efecto de\s+/i, 'Acción de ')
        .replace(/^cualidad de\s+/i, 'Característica de ')
        .replace(/\s+/g, ' ')
        .trim()

      if (!t) return null
      // Si la definición quedó excesivamente larga (más de 160 caracteres), recortar en el primer punto
      if (t.length > 160) {
        const primerPunto = t.indexOf('.')
        if (primerPunto > 20 && primerPunto <= 150) {
          t = t.slice(0, primerPunto)
        }
      }
      t = t.replace(/[.,;:\s]+$/, '').trim()
      if (!t) return null
      t = t.charAt(0).toUpperCase() + t.slice(1)
      if (!t.endsWith('.')) t += '.'
      return t
    })
    .filter(Boolean)

  return limpias[0] ?? null
}

// Lematización simple para chicos de primaria (plurales, diminutivos).
export function lematizar(palabra) {
  const norm = normalizar(palabra)
  const candidatos = []

  // Plurales en -ces -> -z (luces -> luz, peces -> pez, lapices -> lapiz)
  if (norm.endsWith('ces') && norm.length >= 4) {
    candidatos.push(norm.slice(0, -3) + 'z')
  }

  // Plurales en -es (arboles -> arbol, leones -> leon, flores -> flor, meses -> mes)
  if (norm.endsWith('es') && !norm.endsWith('ces') && norm.length > 4) {
    candidatos.push(norm.slice(0, -2))
  }

  // Plurales en -s (gatos -> gato, casas -> casa, libros -> libro, mochilas -> mochila)
  if (norm.endsWith('s') && !norm.endsWith('es') && norm.length > 3) {
    candidatos.push(norm.slice(0, -1))
  }

  // Diminutivos infantiles: -itos/-itas/-ito/-ita (gatito -> gato, perrito -> perro, casita -> casa)
  if (norm.endsWith('itos') && norm.length > 5) {
    candidatos.push(norm.slice(0, -4) + 'o')
    candidatos.push(norm.slice(0, -4))
  } else if (norm.endsWith('itas') && norm.length > 5) {
    candidatos.push(norm.slice(0, -4) + 'a')
    candidatos.push(norm.slice(0, -4))
  } else if (norm.endsWith('ito') && norm.length > 4) {
    candidatos.push(norm.slice(0, -3) + 'o')
    candidatos.push(norm.slice(0, -3))
  } else if (norm.endsWith('ita') && norm.length > 4) {
    candidatos.push(norm.slice(0, -3) + 'a')
    candidatos.push(norm.slice(0, -3))
  }

  return [...new Set(candidatos)].filter((c) => c !== norm)
}

// Distancia de Levenshtein para sugerir palabras similares ante errores de tipeo.
export function distanciaLevenshtein(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const fila = Array.from({ length: a.length + 1 }, (_, i) => i)

  for (let i = 1; i <= b.length; i++) {
    let previo = i
    for (let j = 1; j <= a.length; j++) {
      const costo = b[i - 1] === a[j - 1] ? 0 : 1
      const actual = Math.min(
        fila[j] + 1,
        previo + 1,
        fila[j - 1] + costo,
      )
      fila[j - 1] = previo
      previo = actual
    }
    fila[a.length] = previo
  }

  return fila[a.length]
}

export async function buscarSugerencias(pool, palabra, limite = 4) {
  const norm = normalizar(palabra)
  if (norm.length < 2) return []

  try {
    const { rows } = await pool.query(
      `SELECT palabra, palabra_norm FROM definiciones
       WHERE abs(length(palabra_norm) - length($1)) <= 2`,
      [norm],
    )
    if (!rows.length) return []

    const candidatas = rows
      .map((r) => ({
        palabra: r.palabra,
        dist: distanciaLevenshtein(norm, r.palabra_norm),
      }))
      .filter((r) => r.dist > 0 && r.dist <= 2)
      .sort((a, b) => a.dist - b.dist)

    const unicas = []
    const vistas = new Set()
    for (const c of candidatas) {
      if (!vistas.has(c.palabra)) {
        vistas.add(c.palabra)
        unicas.push(c.palabra)
        if (unicas.length >= limite) break
      }
    }
    return unicas
  } catch {
    return []
  }
}

// Palabras destacadas para que chicos de primaria exploren el diccionario con un toque.
export const PALABRAS_DESTACADAS = [
  { palabra: 'huerto', emoji: '🌿', pista: 'Lugar donde crecen verduras y frutas' },
  { palabra: 'brújula', emoji: '🧭', pista: 'Señala hacia dónde caminar' },
  { palabra: 'león', emoji: '🦁', pista: 'Gran felino con melena' },
  { palabra: 'valiente', emoji: '✨', pista: 'Quien se anima con coraje' },
  { palabra: 'biblioteca', emoji: '📚', pista: 'Lugar lleno de libros e historias' },
  { palabra: 'telescopio', emoji: '🔭', pista: 'Para mirar las estrellas de cerca' },
  { palabra: 'dinosaurio', emoji: '🦕', pista: 'Gigante que vivió hace millones de años' },
  { palabra: 'paciencia', emoji: '💛', pista: 'Saber esperar con tranquilidad' },
  { palabra: 'aventura', emoji: '🚀', pista: 'Un viaje emocionante y nuevo' },
  { palabra: 'arcoíris', emoji: '🌈', pista: 'Arco de colores en el cielo' },
  { palabra: 'amistad', emoji: '🤝', pista: 'El cariño entre grandes amigos' },
  { palabra: 'colmena', emoji: '🍯', pista: 'La casita dulce de las abejas' },
]

// Fuente externa por defecto: librería no oficial `rae-api`, que consulta la web
// de la RAE. Se procesa con `adaptarParaPrimaria` para garantizar comprensión infantil.
export async function buscarEnRae(palabra) {
  const { RAE } = require('rae-api')
  const rae = new RAE()
  const busqueda = await rae.searchWord(palabra)
  const resultados = busqueda.getRes()
  if (!resultados || resultados.length === 0) return null

  const norm = normalizar(palabra)
  // Coincidencia exacta con el lema principal (descartando desinencias de género como "gato, ta" o "león, na")
  const exacto =
    resultados.find((r) => limpiarCabeceraRae(r.getHeader()) === norm) ??
    resultados[0]
  const ficha = await rae.fetchWord(exacto.getId())
  const definiciones = ficha
    .getDefinitions()
    .map((d) => d.getDefinition())
    .filter(Boolean)
  if (definiciones.length === 0) return null

  // Priorizamos acepciones generales (que no comiencen con restricción de país como "Perú.")
  const acepcionesGenerales = definiciones.filter(
    (d) =>
      !/^(?:(?:Arg|Bol|Chile|Col|C\. Rica|Cuba|Ec|El Salv|Esp|Filip|Guat|Hond|Méx|Nic|Pan|Par|Perú|P\. Rico|R\. Dom|Ur|Ven)\.?(?:\s*(?:,|y|o)\s*)?)+/i.test(
        d,
      ),
  )
  const listaAcepciones = acepcionesGenerales.length > 0 ? acepcionesGenerales : definiciones

  let adaptado = null
  let sinonimosExtraidos = []
  for (const cruda of listaAcepciones) {
    adaptado = adaptarParaPrimaria(cruda)
    if (adaptado) {
      sinonimosExtraidos = extraerSinonimos(cruda)
      break
    }
  }

  if (!adaptado) return null
  return {
    significado: adaptado,
    sinonimos: sinonimosExtraidos.length ? sinonimosExtraidos.join(', ') : null,
  }
}

// Diccionario mixto enriquecido para primaria:
// 1. Base propia con definiciones, ejemplos y sinónimos.
// 2. Lematización infantil (plurales, diminutivos) hacia palabras base.
// 3. Fuente externa con adaptación pedagógica para lenguaje infantil.
export function crearServicioDiccionario({
  pool,
  buscarExterno = buscarEnRae,
  usarExterno = true,
  tiempoLimiteMs = 5000,
}) {
  return {
    async buscar(palabra) {
      const clave = normalizar(palabra)

      // 1. Base propia
      const propia = await pool.query(
        'SELECT palabra, significado, fuente, ejemplo, sinonimos, categoria FROM definiciones WHERE palabra_norm = $1',
        [clave],
      )
      if (propia.rows[0]) {
        const item = propia.rows[0]
        // Si una entrada externa previa guardó marcas residuales de la RAE (ej. "Perú. ...", "Sin.:..."),
        // la saneamos pedagógicamente para que no se muestre al alumno.
        if (
          item.fuente === 'externa' &&
          (item.significado?.includes('Sin.:') ||
            /^(?:Perú|Arg|Col|Esp|Chile|Bol|C\. Rica|Cuba|Ec|El Salv|Filip|Guat|Hond|Méx|Nic|Pan|Par|P\. Rico|R\. Dom|Ur|Ven)\./i.test(
              item.significado,
            ))
        ) {
          const limpio = adaptarParaPrimaria(item.significado)
          if (limpio && limpio !== item.significado) {
            item.significado = limpio
            pool
              .query('UPDATE definiciones SET significado = $1 WHERE palabra_norm = $2', [limpio, clave])
              .catch(() => {})
          }
        }
        const detalle = detallesPrimaria[clave] ?? inferirDetalle(item.palabra, item.significado)
        return {
          ...item,
          ejemplo: item.ejemplo ?? detalle.ejemplo,
          sinonimos: item.sinonimos ?? detalle.sinonimos,
          categoria: item.categoria ?? detalle.categoria,
        }
      }

      // 2. Lematización infantil: si buscó un plural o diminutivo, mostrar la palabra base
      const variantes = lematizar(palabra)
      for (const variante of variantes) {
        const encontrada = await pool.query(
          'SELECT palabra, significado, fuente, ejemplo, sinonimos, categoria FROM definiciones WHERE palabra_norm = $1',
          [variante],
        )
        if (encontrada.rows[0]) {
          const base = encontrada.rows[0]
          const detalle = detallesPrimaria[variante] ?? inferirDetalle(base.palabra, base.significado)
          return {
            ...base,
            palabra: palabra.trim().toLowerCase(),
            palabraBase: base.palabra,
            esVariante: true,
            mensajeVariante: `Te mostramos la definición de "${base.palabra}".`,
            ejemplo: base.ejemplo ?? detalle.ejemplo,
            sinonimos: base.sinonimos ?? detalle.sinonimos,
            categoria: base.categoria ?? detalle.categoria,
          }
        }
      }

      // 3. Si no está en base propia y no se permite externo
      if (!usarExterno) return null

      // 4. Fuente externa adaptada para primaria
      let externa = null
      try {
        externa = await conTiempoLimite(buscarExterno(palabra.trim()), tiempoLimiteMs)
      } catch (error) {
        console.warn(`Diccionario externo no disponible para "${palabra}": ${error.message}`)
        return null
      }
      if (!externa?.significado) return null

      const significadoAdaptado =
        adaptarParaPrimaria(externa.significado, palabra) ?? externa.significado

      const detalleInferido = inferirDetalle(palabra, significadoAdaptado)

      const guardada = await pool.query(
        `INSERT INTO definiciones (palabra_norm, palabra, significado, fuente, ejemplo, sinonimos, categoria)
         VALUES ($1, $2, $3, 'externa', $4, $5, $6)
         ON CONFLICT (palabra_norm) DO UPDATE
           SET palabra_norm = EXCLUDED.palabra_norm,
               significado = COALESCE(EXCLUDED.significado, definiciones.significado)
         RETURNING palabra, significado, fuente, ejemplo, sinonimos, categoria`,
        [
          clave,
          palabra.trim().toLowerCase(),
          significadoAdaptado,
          externa.ejemplo ?? detalleInferido.ejemplo,
          externa.sinonimos ?? detalleInferido.sinonimos,
          externa.categoria ?? detalleInferido.categoria,
        ],
      )
      return guardada.rows[0]
    },

    async sugerir(palabra) {
      return buscarSugerencias(pool, palabra)
    },

    destacadas() {
      return PALABRAS_DESTACADAS
    },
  }
}
