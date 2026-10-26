import { Router } from 'express'
import { z } from 'zod'
import { autenticar, requiereRol } from '../middleware/auth.js'
import { badRequest, notFound } from '../lib/errors.js'
import { calcularResultado } from '../lib/semaforo.js'
import { nuevoHito } from '../lib/racha.js'
import { rachaDe } from '../lib/rachas.js'
import { parsear } from '../lib/validar.js'

const completarSchema = z.object({
  respuestas: z
    .array(z.object({ preguntaId: z.number().int(), opcion: z.number().int().min(0) }))
    .default([]),
})
const ORDEN_NIVEL = { facil: 0, intermedio: 1, dificil: 2 }

// Racha y práctica libre del alumno. La práctica no entra en el semáforo, pero sí suma a la racha.
export function alumnoPracticaRouter({ pool }) {
  const r = Router()
  r.use(autenticar, requiereRol('alumno'))

  r.get('/racha', async (req, res) => {
    res.json(await rachaDe(pool, req.usuario.id))
  })

  // Catálogo: solo textos de Lectur (no los propios de ningún docente).
  r.get('/practica/textos', async (req, res) => {
    const { rows } = await pool.query(
      `SELECT t.id, t.titulo, t.nivel, t.categoria,
              (SELECT count(*)::int FROM preguntas p WHERE p.texto_id = t.id) AS cantidad_preguntas,
              (EXISTS (SELECT 1 FROM asignaciones a WHERE a.texto_id = t.id AND a.alumno_id = $1 AND a.estado = 'completada')
               OR EXISTS (SELECT 1 FROM practicas pr WHERE pr.texto_id = t.id AND pr.alumno_id = $1)) AS leido
         FROM textos t WHERE t.autor_id IS NULL ORDER BY t.id`,
      [req.usuario.id],
    )
    // Sugeridos: los 3 no leídos de las categorías que más lee (primero los más fáciles si empata).
    const porCategoria = new Map()
    for (const t of rows.filter((x) => x.leido && x.categoria)) {
      porCategoria.set(t.categoria, (porCategoria.get(t.categoria) ?? 0) + 1)
    }
    const sugeridos = new Set(
      rows
        .filter((t) => !t.leido)
        .sort(
          (a, b) =>
            (porCategoria.get(b.categoria) ?? 0) - (porCategoria.get(a.categoria) ?? 0) ||
            (ORDEN_NIVEL[a.nivel] ?? 1) - (ORDEN_NIVEL[b.nivel] ?? 1) ||
            a.id - b.id,
        )
        .slice(0, 3)
        .map((t) => t.id),
    )
    res.json({
      textos: rows.map((t) => ({
        id: t.id,
        titulo: t.titulo,
        nivel: t.nivel,
        categoria: t.categoria,
        cantidadPreguntas: t.cantidad_preguntas,
        leido: t.leido,
        sugerido: sugeridos.has(t.id),
      })),
    })
  })

  async function textoDeLectur(id) {
    const { rows } = await pool.query(
      'SELECT id, titulo, cuerpo, categoria FROM textos WHERE id = $1 AND autor_id IS NULL',
      [id],
    )
    if (!rows[0]) throw notFound('Texto no encontrado')
    return rows[0]
  }

  // Texto + preguntas SIN la respuesta correcta.
  r.get('/practica/textos/:id', async (req, res) => {
    const texto = await textoDeLectur(Number(req.params.id))
    const { rows } = await pool.query(
      'SELECT id, orden, enunciado, tipo, opciones FROM preguntas WHERE texto_id = $1 ORDER BY orden',
      [texto.id],
    )
    res.json({ texto, preguntas: rows })
  })

  // Registra la práctica. Con respuestas vacías es "solo lectura".
  r.post('/practica/textos/:id/completar', async (req, res) => {
    const texto = await textoDeLectur(Number(req.params.id))
    const { respuestas } = parsear(completarSchema, req.body)
    const antes = await rachaDe(pool, req.usuario.id)

    let resultado = null
    if (respuestas.length > 0) {
      const { rows: preguntas } = await pool.query(
        'SELECT id, tipo, opciones, correcta FROM preguntas WHERE texto_id = $1 ORDER BY orden',
        [texto.id],
      )
      if (preguntas.length === 0) throw badRequest('Este texto no tiene preguntas')
      const ids = new Set(preguntas.map((p) => p.id))
      if (respuestas.some((x) => !ids.has(x.preguntaId)))
        throw badRequest('Hay respuestas a preguntas que no son de este texto')
      if (new Set(respuestas.map((x) => x.preguntaId)).size !== preguntas.length)
        throw badRequest('Tenés que responder todas las preguntas')
      if (respuestas.some((x) => x.opcion >= preguntas.find((p) => p.id === x.preguntaId).opciones.length)) {
        throw badRequest('Opción inexistente')
      }
      resultado = calcularResultado(preguntas, respuestas)
    }

    await pool.query(
      `INSERT INTO practicas (alumno_id, texto_id, con_cuestionario, correctas, total, respuestas)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        req.usuario.id,
        texto.id,
        Boolean(resultado),
        resultado?.correctas ?? null,
        resultado?.total ?? null,
        resultado ? JSON.stringify(resultado.detalle) : null,
      ],
    )
    const despues = await rachaDe(pool, req.usuario.id)
    // Como en las lecturas asignadas, solo se informan aciertos, no las respuestas correctas ni el puntaje.
    res.status(201).json({
      aciertos: resultado ? { correctas: resultado.correctas, total: resultado.total } : null,
      racha: { actual: despues.actual, nuevoHito: nuevoHito(antes, despues) },
    })
  })

  return r
}
