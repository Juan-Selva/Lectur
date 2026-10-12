import { Router } from 'express'
import { z } from 'zod'
import { autenticar, requiereRol } from '../middleware/auth.js'
import { forbidden, notFound, conflict } from '../lib/errors.js'
import { parsear } from '../lib/validar.js'

const preguntaSchema = z
  .object({
    enunciado: z.string().trim().min(3).max(300),
    tipo: z.enum(['literal', 'inferencial']),
    opciones: z.array(z.string().trim().min(1).max(200)).min(2).max(5),
    correcta: z.number().int().min(0),
  })
  .refine((p) => p.correcta < p.opciones.length, {
    message: 'correcta debe ser un índice de opciones',
    path: ['correcta'],
  })

const textoSchema = z.object({
  titulo: z.string().trim().min(2).max(120),
  cuerpo: z.string().trim().min(20).max(5000),
  nivel: z.enum(['facil', 'intermedio', 'dificil']).optional(),
  preguntas: z.array(preguntaSchema).max(10).default([]),
})

async function preguntasDe(pool, textoId) {
  const { rows } = await pool.query(
    'SELECT id, orden, enunciado, tipo, opciones, correcta FROM preguntas WHERE texto_id = $1 ORDER BY orden',
    [textoId],
  )
  return rows
}

export function textosRouter({ pool }) {
  const r = Router()
  r.use(autenticar, requiereRol('docente'))

  // Precargados + propios del docente ("Mis textos").
  r.get('/', async (req, res) => {
    const { rows } = await pool.query(
      `SELECT t.id, t.titulo, t.nivel, t.autor_id IS NOT NULL AS propio,
              (SELECT count(*)::int FROM preguntas p WHERE p.texto_id = t.id) AS cantidad_preguntas
         FROM textos t
        WHERE t.autor_id IS NULL OR t.autor_id = $1
        ORDER BY propio, t.id`,
      [req.usuario.id],
    )
    res.json({ textos: rows })
  })

  r.get('/:id', async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM textos WHERE id = $1', [Number(req.params.id)])
    const t = rows[0]
    if (!t || (t.autor_id !== null && t.autor_id !== req.usuario.id)) throw notFound('Texto no encontrado')
    res.json({ texto: { ...t, propio: t.autor_id !== null }, preguntas: await preguntasDe(pool, t.id) })
  })

  r.post('/', async (req, res) => {
    const d = parsear(textoSchema, req.body)
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const { rows } = await client.query(
        'INSERT INTO textos (titulo, cuerpo, nivel, autor_id) VALUES ($1, $2, $3, $4) RETURNING id',
        [d.titulo, d.cuerpo, d.nivel ?? null, req.usuario.id],
      )
      const id = rows[0].id
      for (const [i, p] of d.preguntas.entries()) {
        await client.query(
          `INSERT INTO preguntas (texto_id, orden, enunciado, tipo, opciones, correcta)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
          [id, i + 1, p.enunciado, p.tipo, JSON.stringify(p.opciones), p.correcta],
        )
      }
      await client.query('COMMIT')
      res.status(201).json({ id })
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  })

  r.delete('/:id', async (req, res) => {
    const id = Number(req.params.id)
    const { rows } = await pool.query('SELECT autor_id FROM textos WHERE id = $1', [id])
    if (!rows[0]) throw notFound('Texto no encontrado')
    if (rows[0].autor_id !== req.usuario.id) throw forbidden('Solo podés borrar tus propios textos')
    const usado = await pool.query('SELECT 1 FROM asignaciones WHERE texto_id = $1 LIMIT 1', [id])
    if (usado.rowCount) throw conflict('Este texto ya fue asignado y no se puede borrar')
    await pool.query('DELETE FROM textos WHERE id = $1', [id])
    res.status(204).end()
  })

  return r
}
