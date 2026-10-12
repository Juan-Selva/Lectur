import { Router } from 'express'
import { autenticar } from '../middleware/auth.js'
import { badRequest, notFound } from '../lib/errors.js'
import { PALABRA_VALIDA, normalizar } from '../lib/diccionario.js'

export function diccionarioRouter({ diccionario, pool }) {
  const r = Router()
  r.use(autenticar)

  r.get('/', async (req, res) => {
    const palabra = String(req.query.palabra ?? '').trim()
    if (!palabra || palabra.length > 40 || !PALABRA_VALIDA.test(palabra)) {
      throw badRequest('Escribí una sola palabra, solo con letras')
    }
    const def = await diccionario.buscar(palabra)

    // Se registra cada consulta de un alumno (la haya encontrado o no) para que el docente la vea.
    if (req.usuario.rol === 'alumno') {
      await pool.query(
        'INSERT INTO consultas (alumno_id, palabra_norm, palabra, encontrada) VALUES ($1, $2, $3, $4)',
        [req.usuario.id, normalizar(palabra), palabra.toLowerCase(), Boolean(def)],
      )
    }
    if (!def) throw notFound('No encontramos esa palabra')
    res.json(def)
  })

  return r
}
