import { Router } from 'express'
import { z } from 'zod'
import { autenticar, requiereRol } from '../middleware/auth.js'
import { badRequest, conflict, notFound } from '../lib/errors.js'
import { calcularResultado } from '../lib/semaforo.js'
import { parsear } from '../lib/validar.js'

const completarSchema = z.object({
  respuestas: z
    .array(z.object({ preguntaId: z.number().int(), opcion: z.number().int().min(0) }))
    .default([]),
})

export function alumnoRouter({ pool }) {
  const r = Router()
  r.use(autenticar, requiereRol('alumno'))

  async function propia(id, alumnoId) {
    const { rows } = await pool.query(
      `SELECT a.*, t.titulo, t.cuerpo FROM asignaciones a JOIN textos t ON t.id = a.texto_id
        WHERE a.id = $1 AND a.alumno_id = $2 AND a.estado <> 'cancelada'`,
      [id, alumnoId],
    )
    if (!rows[0]) throw notFound('Actividad no encontrada')
    return rows[0]
  }

  r.get('/actividades', async (req, res) => {
    const { rows } = await pool.query(
      `SELECT a.id, t.titulo, t.categoria, a.con_cuestionario, a.estado, a.creada_en, a.completada_en,
              r.correctas, r.total
         FROM asignaciones a
         JOIN textos t ON t.id = a.texto_id
         LEFT JOIN resultados r ON r.asignacion_id = a.id
        WHERE a.alumno_id = $1 AND a.estado <> 'cancelada'
        ORDER BY (a.estado = 'pendiente') DESC, a.creada_en DESC`,
      [req.usuario.id],
    )
    // No se expone el puntaje ni el semáforo al alumno, solo aciertos.
    res.json({
      actividades: rows.map((a) => ({
        id: a.id,
        titulo: a.titulo,
        categoria: a.categoria,
        conCuestionario: a.con_cuestionario,
        estado: a.estado,
        completadaEn: a.completada_en,
        aciertos: a.correctas === null ? null : { correctas: a.correctas, total: a.total },
      })),
    })
  })

  // Historial propio: qué leyó, cuándo y en qué preguntas acertó. No expone las respuestas correctas.
  r.get('/historial', async (req, res) => {
    const { rows } = await pool.query(
      `SELECT a.id, a.texto_id, t.titulo, t.categoria, a.con_cuestionario, a.completada_en,
              r.correctas, r.total, r.respuestas
         FROM asignaciones a
         JOIN textos t ON t.id = a.texto_id
         LEFT JOIN resultados r ON r.asignacion_id = a.id
        WHERE a.alumno_id = $1 AND a.estado = 'completada'
        ORDER BY a.completada_en DESC`,
      [req.usuario.id],
    )
    const ids = [...new Set(rows.filter((x) => x.respuestas).map((x) => x.texto_id))]
    const pregs = ids.length
      ? (
          await pool.query(
            'SELECT id, texto_id, enunciado, tipo FROM preguntas WHERE texto_id = ANY($1::int[]) ORDER BY orden',
            [ids],
          )
        ).rows
      : []
    res.json({
      historial: rows.map((x) => {
        const ok = new Map((x.respuestas ?? []).map((p) => [p.preguntaId, p.acierto]))
        return {
          id: x.id,
          titulo: x.titulo,
          categoria: x.categoria,
          completadaEn: x.completada_en,
          conCuestionario: x.con_cuestionario,
          aciertos: x.respuestas ? { correctas: x.correctas, total: x.total } : null,
          preguntas: pregs
            .filter((p) => p.texto_id === x.texto_id)
            .map((p) => ({ enunciado: p.enunciado, tipo: p.tipo, acierto: ok.get(p.id) === true })),
        }
      }),
    })
  })

  // Texto + preguntas SIN la respuesta correcta.
  r.get('/actividades/:id', async (req, res) => {
    const a = await propia(Number(req.params.id), req.usuario.id)
    let preguntas = []
    if (a.con_cuestionario) {
      const q = await pool.query(
        'SELECT id, orden, enunciado, tipo, opciones FROM preguntas WHERE texto_id = $1 ORDER BY orden',
        [a.texto_id],
      )
      preguntas = q.rows
    }
    res.json({
      actividad: {
        id: a.id,
        titulo: a.titulo,
        cuerpo: a.cuerpo,
        conCuestionario: a.con_cuestionario,
        estado: a.estado,
      },
      preguntas,
    })
  })

  r.post('/actividades/:id/completar', async (req, res) => {
    const a = await propia(Number(req.params.id), req.usuario.id)
    if (a.estado === 'completada') throw conflict('Esta actividad ya está completada')
    const { respuestas } = parsear(completarSchema, req.body)

    if (!a.con_cuestionario) {
      await pool.query(`UPDATE asignaciones SET estado = 'completada', completada_en = now() WHERE id = $1`, [
        a.id,
      ])
      return res.json({ completada: true, aciertos: null })
    }

    const { rows: preguntas } = await pool.query(
      'SELECT id, tipo, opciones, correcta FROM preguntas WHERE texto_id = $1 ORDER BY orden',
      [a.texto_id],
    )
    const ids = new Set(preguntas.map((p) => p.id))
    if (respuestas.some((x) => !ids.has(x.preguntaId)))
      throw badRequest('Hay respuestas a preguntas que no son de este texto')
    if (new Set(respuestas.map((x) => x.preguntaId)).size !== preguntas.length) {
      throw badRequest('Tenés que responder todas las preguntas')
    }
    if (respuestas.some((x) => x.opcion >= preguntas.find((p) => p.id === x.preguntaId).opciones.length)) {
      throw badRequest('Opción inexistente')
    }

    const res_ = calcularResultado(preguntas, respuestas)
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        `INSERT INTO resultados (asignacion_id, puntaje, correctas, total, literal_completo, inferencial_completo, respuestas)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
        [
          a.id,
          res_.puntaje,
          res_.correctas,
          res_.total,
          res_.literalCompleto,
          res_.inferencialCompleto,
          JSON.stringify(res_.detalle),
        ],
      )
      await client.query(
        `UPDATE asignaciones SET estado = 'completada', completada_en = now() WHERE id = $1`,
        [a.id],
      )
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
    res.json({ completada: true, aciertos: { correctas: res_.correctas, total: res_.total } })
  })

  return r
}
