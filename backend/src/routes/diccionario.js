import { Router } from 'express'
import { autenticar } from '../middleware/auth.js'
import { badRequest, notFound } from '../lib/errors.js'
import { PALABRA_VALIDA } from '../lib/diccionario.js'

export function diccionarioRouter({ diccionario }) {
  const r = Router()
  r.use(autenticar)

  r.get('/', async (req, res) => {
    const palabra = String(req.query.palabra ?? '').trim()
    if (!palabra || palabra.length > 40 || !PALABRA_VALIDA.test(palabra)) {
      throw badRequest('Escribí una sola palabra, solo con letras')
    }
    const def = await diccionario.buscar(palabra)
    if (!def) throw notFound('No encontramos esa palabra')
    res.json(def)
  })

  return r
}
