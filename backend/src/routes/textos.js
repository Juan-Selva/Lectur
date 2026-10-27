import { Router } from 'express'
import { z } from 'zod'
import { autenticar, requiereRol } from '../middleware/auth.js'
import { forbidden, notFound, conflict } from '../lib/errors.js'
import { parsear } from '../lib/validar.js'
import { filtroGrado } from '../lib/cursos.js'
import { HABILIDADES, TIPO_DE_HABILIDAD, habilidadPorDefecto } from '../lib/habilidades.js'
import { FORMATOS, MAX_ELEMENTOS_ORDEN } from '../lib/preguntas.js'

export const CATEGORIAS = ['ficcion', 'historia', 'deporte', 'ciencia', 'naturaleza', 'biografia']

const preguntaSchema = z
  .object({
    enunciado: z.string().trim().min(3).max(300),
    // Se manda la habilidad; si solo viene el tipo (clientes viejos) se asume dato explícito o inferencia.
    habilidad: z.enum(HABILIDADES).optional(),
    tipo: z.enum(['literal', 'inferencial']).optional(),
    // 'opcion': opción múltiple. 'orden': los elementos van en el orden correcto y el alumno los recibe mezclados.
    formato: z.enum(FORMATOS).default('opcion'),
    opciones: z.array(z.string().trim().min(1).max(200)).min(2).max(MAX_ELEMENTOS_ORDEN),
    correcta: z.number().int().min(0).optional(),
  })
  .superRefine((p, ctx) => {
    if (p.formato === 'opcion') {
      if (p.opciones.length > 5)
        ctx.addIssue({ code: 'custom', path: ['opciones'], message: 'Hasta 5 opciones' })
      if (p.correcta === undefined || p.correcta >= p.opciones.length)
        ctx.addIssue({
          code: 'custom',
          path: ['correcta'],
          message: 'correcta debe ser un índice de opciones',
        })
    } else if (new Set(p.opciones.map((o) => o.toLowerCase())).size !== p.opciones.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['opciones'],
        message: 'Los elementos a ordenar no pueden repetirse',
      })
    }
  })
  .refine((p) => p.habilidad !== undefined || p.tipo !== undefined, {
    message: 'Indicá la habilidad de la pregunta',
    path: ['habilidad'],
  })
  // El tipo (literal / inferencial) siempre sale de la habilidad.
  .transform((p) => {
    const habilidad = p.habilidad ?? habilidadPorDefecto(p.tipo)
    return {
      ...p,
      habilidad,
      tipo: TIPO_DE_HABILIDAD[habilidad],
      correcta: p.formato === 'orden' ? 0 : p.correcta,
    }
  })

const textoSchema = z.object({
  titulo: z.string().trim().min(2).max(120),
  // Mínimo bajo a propósito: los textos de 1.º grado pueden ser una sola oración corta.
  cuerpo: z.string().trim().min(10).max(5000),
  nivel: z.enum(['facil', 'intermedio', 'dificil']).optional(),
  categoria: z.enum(CATEGORIAS).optional(),
  // Quién escribió el texto (opcional)
  autor: z.string().trim().max(120).nullable().optional(),
  // 1, 2 o 3; sin valor (null) = sirve para todos los grados
  grado: z.number().int().min(1).max(3).nullable().optional(),
  preguntas: z.array(preguntaSchema).max(10).default([]),
})

async function preguntasDe(pool, textoId) {
  const { rows } = await pool.query(
    'SELECT id, orden, enunciado, tipo, habilidad, formato, opciones, correcta FROM preguntas WHERE texto_id = $1 ORDER BY orden',
    [textoId],
  )
  return rows
}

export function textosRouter({ pool }) {
  const r = Router()
  r.use(autenticar, requiereRol('docente'))

  // Precargados + propios del docente ("Mis textos"). Con ?grado=N, los de ese grado y los de todos los grados.
  r.get('/', async (req, res) => {
    const grado = filtroGrado(req.query)
    const { rows } = await pool.query(
      `SELECT t.id, t.titulo, t.nivel, t.categoria, t.grado, t.autor_id IS NOT NULL AS propio,
              (SELECT count(*)::int FROM preguntas p WHERE p.texto_id = t.id) AS cantidad_preguntas
         FROM textos t
        WHERE (t.autor_id IS NULL OR t.autor_id = $1)
          AND ($2::int IS NULL OR t.grado IS NULL OR t.grado = $2)
        ORDER BY propio, t.id`,
      [req.usuario.id, grado],
    )
    res.json({ textos: rows })
  })

  r.get('/:id', async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM textos WHERE id = $1', [Number(req.params.id)])
    const t = rows[0]
    if (!t || (t.autor_id !== null && t.autor_id !== req.usuario.id)) throw notFound('Texto no encontrado')
    res.json({ texto: { ...t, propio: t.autor_id !== null }, preguntas: await preguntasDe(pool, t.id) })
  })

  // Copia un texto de Lectur (o uno propio) a "Mis textos", con todas sus preguntas, para poder editarla.
  r.post('/:id/duplicar', async (req, res) => {
    const id = Number(req.params.id)
    const { rows } = await pool.query('SELECT * FROM textos WHERE id = $1', [id])
    const t = rows[0]
    if (!t || (t.autor_id !== null && t.autor_id !== req.usuario.id)) throw notFound('Texto no encontrado')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const copia = await client.query(
        'INSERT INTO textos (titulo, cuerpo, nivel, categoria, grado, autor, autor_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [
          `Copia de ${t.titulo}`.slice(0, 120),
          t.cuerpo,
          t.nivel,
          t.categoria,
          t.grado,
          t.autor,
          req.usuario.id,
        ],
      )
      await client.query(
        `INSERT INTO preguntas (texto_id, orden, enunciado, tipo, habilidad, formato, opciones, correcta)
         SELECT $1, orden, enunciado, tipo, habilidad, formato, opciones, correcta
           FROM preguntas WHERE texto_id = $2 ORDER BY orden`,
        [copia.rows[0].id, id],
      )
      await client.query('COMMIT')
      res.status(201).json({ id: copia.rows[0].id })
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  })

  r.post('/', async (req, res) => {
    const d = parsear(textoSchema, req.body)
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const { rows } = await client.query(
        'INSERT INTO textos (titulo, cuerpo, nivel, categoria, grado, autor, autor_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [
          d.titulo,
          d.cuerpo,
          d.nivel ?? null,
          d.categoria ?? null,
          d.grado ?? null,
          d.autor || null,
          req.usuario.id,
        ],
      )
      const id = rows[0].id
      for (const [i, p] of d.preguntas.entries()) {
        await client.query(
          `INSERT INTO preguntas (texto_id, orden, enunciado, tipo, habilidad, formato, opciones, correcta)
           VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
          [id, i + 1, p.enunciado, p.tipo, p.habilidad, p.formato, JSON.stringify(p.opciones), p.correcta],
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

  // Edita un texto propio. Las preguntas solo se pueden cambiar si nadie lo respondió todavía,
  // para no alterar resultados ya guardados.
  r.put('/:id', async (req, res) => {
    const id = Number(req.params.id)
    const { rows } = await pool.query('SELECT autor_id FROM textos WHERE id = $1', [id])
    if (!rows[0]) throw notFound('Texto no encontrado')
    if (rows[0].autor_id !== req.usuario.id) throw forbidden('Solo podés editar tus propios textos')
    const d = parsear(textoSchema, req.body)

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        'UPDATE textos SET titulo = $1, cuerpo = $2, nivel = $3, categoria = $4, grado = $5, autor = $6 WHERE id = $7',
        [d.titulo, d.cuerpo, d.nivel ?? null, d.categoria ?? null, d.grado ?? null, d.autor || null, id],
      )
      const actuales = await preguntasDe(client, id)
      const igual =
        actuales.length === d.preguntas.length &&
        actuales.every((a, i) => {
          const n = d.preguntas[i]
          return (
            a.enunciado === n.enunciado &&
            a.tipo === n.tipo &&
            a.habilidad === n.habilidad &&
            a.formato === n.formato &&
            a.correcta === n.correcta &&
            JSON.stringify(a.opciones) === JSON.stringify(n.opciones)
          )
        })
      if (!igual) {
        const usado = await client.query(
          `SELECT 1 FROM resultados r JOIN asignaciones a ON a.id = r.asignacion_id WHERE a.texto_id = $1 LIMIT 1`,
          [id],
        )
        if (usado.rowCount) {
          throw conflict('Este texto ya tiene respuestas de alumnos, no se pueden cambiar sus preguntas')
        }
        if (d.preguntas.length === 0) {
          const pend = await client.query(
            `SELECT 1 FROM asignaciones WHERE texto_id = $1 AND estado = 'pendiente' AND con_cuestionario LIMIT 1`,
            [id],
          )
          if (pend.rowCount)
            throw conflict(
              'Hay actividades pendientes con cuestionario: cancelalas antes de quitar las preguntas',
            )
        }
        await client.query('DELETE FROM preguntas WHERE texto_id = $1', [id])
        for (const [i, p] of d.preguntas.entries()) {
          await client.query(
            `INSERT INTO preguntas (texto_id, orden, enunciado, tipo, habilidad, formato, opciones, correcta)
             VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
            [id, i + 1, p.enunciado, p.tipo, p.habilidad, p.formato, JSON.stringify(p.opciones), p.correcta],
          )
        }
      }
      await client.query('COMMIT')
      res.json({ id })
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
