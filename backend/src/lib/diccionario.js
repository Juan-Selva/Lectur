import { createRequire } from 'node:module'

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

// Fuente externa por defecto: librería no oficial `rae-api`, que consulta la web
// de la RAE. Puede dejar de andar si la RAE cambia su sitio, por eso el servicio
// la trata como "mejor esfuerzo": si falla, el diccionario responde "no encontrada".
export async function buscarEnRae(palabra) {
  const { RAE } = require('rae-api')
  const rae = new RAE()
  const busqueda = await rae.searchWord(palabra)
  const resultados = busqueda.getRes()
  if (!resultados || resultados.length === 0) return null

  const exacto =
    resultados.find((r) => normalizar(r.getHeader().replace(/<[^>]*>/g, '')) === normalizar(palabra)) ??
    resultados[0]
  const ficha = await rae.fetchWord(exacto.getId())
  const definiciones = ficha
    .getDefinitions()
    .map((d) => d.getDefinition())
    .filter(Boolean)
  if (definiciones.length === 0) return null

  return { significado: definiciones.slice(0, 3).join(' | ') }
}

// Diccionario mixto: primero la base propia (definiciones simples para primer
// ciclo); si no está, la fuente externa, y lo que trae se guarda para la próxima.
export function crearServicioDiccionario({
  pool,
  buscarExterno = buscarEnRae,
  usarExterno = true,
  tiempoLimiteMs = 5000,
}) {
  return {
    async buscar(palabra) {
      const clave = normalizar(palabra)
      const propia = await pool.query(
        'SELECT palabra, significado, fuente FROM definiciones WHERE palabra_norm = $1',
        [clave],
      )
      if (propia.rows[0]) return propia.rows[0]
      if (!usarExterno) return null

      let externa = null
      try {
        externa = await conTiempoLimite(buscarExterno(palabra.trim()), tiempoLimiteMs)
      } catch (error) {
        console.warn(`Diccionario externo no disponible para "${palabra}": ${error.message}`)
        return null
      }
      if (!externa?.significado) return null

      const guardada = await pool.query(
        `INSERT INTO definiciones (palabra_norm, palabra, significado, fuente)
         VALUES ($1, $2, $3, 'externa')
         ON CONFLICT (palabra_norm) DO UPDATE SET palabra_norm = EXCLUDED.palabra_norm
         RETURNING palabra, significado, fuente`,
        [clave, palabra.trim().toLowerCase(), externa.significado],
      )
      return guardada.rows[0]
    },
  }
}
