import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { autenticar, requiereRol } from '../middleware/auth.js'
import { badRequest, conflict, notFound } from '../lib/errors.js'
import { estadoPorPuntaje } from '../lib/semaforo.js'
import { armarObservaciones } from '../lib/resumen.js'
import { parsear } from '../lib/validar.js'

const editarSchema = z.object({
  nombre: z.string().trim().min(2).max(80),
  email: z.string().email().max(120),
  grado: z.number().int().min(1).max(3),
})
const passwordSchema = z.object({ password: z.string().min(8).max(100) })
const reasignarSchema = z
  .object({
    alumnoId: z.number().int().positive().optional(),
    conCuestionario: z.boolean().optional(),
  })
  .refine((d) => d.alumnoId !== undefined || d.conCuestionario !== undefined, {
    message: 'No hay nada para cambiar',
  })

// Gestión de alumnos, historial, palabras consultadas, resumen para familias y actividades.
export function docenteAlumnosRouter({ pool }) {
  const r = Router()
  r.use(autenticar, requiereRol('docente'))

  async function alumnoDelDocente(id, docenteId) {
    const { rows } = await pool.query(
      `SELECT id, nombre, email, grado FROM usuarios WHERE id = $1 AND rol = 'alumno' AND docente_id = $2`,
      [id, docenteId],
    )
    if (!rows[0]) throw notFound('Alumno no encontrado')
    return rows[0]
  }

  r.get('/alumnos/:id', async (req, res) => {
    res.json({ alumno: await alumnoDelDocente(Number(req.params.id), req.usuario.id) })
  })

  r.put('/alumnos/:id', async (req, res) => {
    const a = await alumnoDelDocente(Number(req.params.id), req.usuario.id)
    const d = parsear(editarSchema, req.body)
    try {
      const { rows } = await pool.query(
        'UPDATE usuarios SET nombre = $1, email = $2, grado = $3 WHERE id = $4 RETURNING id, nombre, email, grado',
        [d.nombre, d.email.toLowerCase(), d.grado, a.id],
      )
      res.json({ alumno: rows[0] })
    } catch (e) {
      if (e.code === '23505') throw conflict('Ya existe una cuenta con ese email')
      throw e
    }
  })

  r.put('/alumnos/:id/password', async (req, res) => {
    const a = await alumnoDelDocente(Number(req.params.id), req.usuario.id)
    const { password } = parsear(passwordSchema, req.body)
    await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [
      await bcrypt.hash(password, 10),
      a.id,
    ])
    res.status(204).end()
  })

  // Borra al alumno y, en cascada, sus asignaciones, resultados, notas y consultas.
  r.delete('/alumnos/:id', async (req, res) => {
    const a = await alumnoDelDocente(Number(req.params.id), req.usuario.id)
    await pool.query('DELETE FROM usuarios WHERE id = $1', [a.id])
    res.status(204).end()
  })

  // Historial completo con el detalle de cada pregunta (qué respondió y qué falló).
  r.get('/alumnos/:id/historial', async (req, res) => {
    const a = await alumnoDelDocente(Number(req.params.id), req.usuario.id)
    const { rows } = await pool.query(
      `SELECT a.id, a.texto_id, t.titulo, t.categoria, a.con_cuestionario, a.estado, a.creada_en, a.completada_en,
              r.puntaje, r.correctas, r.total, r.literal_completo, r.inferencial_completo, r.respuestas
         FROM asignaciones a
         JOIN textos t ON t.id = a.texto_id
         LEFT JOIN resultados r ON r.asignacion_id = a.id
        WHERE a.alumno_id = $1 AND a.docente_id = $2 AND a.estado <> 'cancelada'
        ORDER BY a.creada_en DESC, a.id DESC`,
      [a.id, req.usuario.id],
    )
    const textoIds = [...new Set(rows.filter((x) => x.respuestas).map((x) => x.texto_id))]
    const pregs = textoIds.length
      ? (
          await pool.query(
            'SELECT id, texto_id, orden, enunciado, tipo, opciones, correcta FROM preguntas WHERE texto_id = ANY($1::int[]) ORDER BY orden',
            [textoIds],
          )
        ).rows
      : []

    const actividades = rows.map((x) => {
      let resultado = null
      if (x.respuestas) {
        const elegidas = new Map(x.respuestas.map((p) => [p.preguntaId, p.opcion]))
        resultado = {
          puntaje: x.puntaje,
          estado: estadoPorPuntaje(x.puntaje),
          correctas: x.correctas,
          total: x.total,
          literalCompleto: x.literal_completo,
          inferencialCompleto: x.inferencial_completo,
          preguntas: pregs
            .filter((p) => p.texto_id === x.texto_id)
            .map((p) => ({
              enunciado: p.enunciado,
              tipo: p.tipo,
              opciones: p.opciones,
              correcta: p.correcta,
              elegida: elegidas.get(p.id) ?? null,
              acierto: elegidas.get(p.id) === p.correcta,
            })),
        }
      }
      return {
        id: x.id,
        texto: { id: x.texto_id, titulo: x.titulo, categoria: x.categoria },
        conCuestionario: x.con_cuestionario,
        estado: x.estado,
        creadaEn: x.creada_en,
        completadaEn: x.completada_en,
        resultado,
      }
    })
    res.json({ alumno: a, actividades })
  })

  const palabrasDe = async (alumnoId) =>
    (
      await pool.query(
        `SELECT min(palabra) AS palabra, count(*)::int AS veces, max(creada_en) AS ultima, bool_and(encontrada) AS encontrada
           FROM consultas WHERE alumno_id = $1
          GROUP BY palabra_norm ORDER BY veces DESC, ultima DESC LIMIT 50`,
        [alumnoId],
      )
    ).rows

  r.get('/alumnos/:id/palabras', async (req, res) => {
    const a = await alumnoDelDocente(Number(req.params.id), req.usuario.id)
    res.json({ palabras: await palabrasDe(a.id) })
  })

  // Palabras más consultadas por todo el curso.
  r.get('/palabras', async (req, res) => {
    const { rows } = await pool.query(
      `SELECT min(c.palabra) AS palabra, count(*)::int AS veces, count(DISTINCT c.alumno_id)::int AS alumnos
         FROM consultas c JOIN usuarios u ON u.id = c.alumno_id
        WHERE u.docente_id = $1
        GROUP BY c.palabra_norm ORDER BY veces DESC, alumnos DESC LIMIT 20`,
      [req.usuario.id],
    )
    res.json({ palabras: rows })
  })

  r.get('/alumnos/:id/resumen', async (req, res) => {
    const a = await alumnoDelDocente(Number(req.params.id), req.usuario.id)
    const { rows: hechas } = await pool.query(
      `SELECT a.id, a.completada_en, a.con_cuestionario, t.titulo, t.categoria,
              r.puntaje, r.correctas, r.total, r.respuestas, a.texto_id
         FROM asignaciones a
         JOIN textos t ON t.id = a.texto_id
         LEFT JOIN resultados r ON r.asignacion_id = a.id
        WHERE a.alumno_id = $1 AND a.docente_id = $2 AND a.estado = 'completada'
        ORDER BY a.completada_en DESC`,
      [a.id, req.usuario.id],
    )
    const conResultado = hechas.filter((h) => h.puntaje !== null)

    const tipoPorPregunta = new Map(
      (
        await pool.query('SELECT id, tipo FROM preguntas WHERE texto_id = ANY($1::int[])', [
          [...new Set(conResultado.map((h) => h.texto_id))],
        ])
      ).rows.map((p) => [p.id, p.tipo]),
    )
    const porTipo = { literal: { correctas: 0, total: 0 }, inferencial: { correctas: 0, total: 0 } }
    for (const h of conResultado) {
      for (const p of h.respuestas) {
        const t = tipoPorPregunta.get(p.preguntaId)
        if (!t) continue
        porTipo[t].total += 1
        if (p.acierto) porTipo[t].correctas += 1
      }
    }

    const palabras = await palabrasDe(a.id)
    const nota = (
      await pool.query('SELECT texto FROM notas WHERE alumno_id = $1 AND docente_id = $2', [
        a.id,
        req.usuario.id,
      ])
    ).rows[0]
    const promedio = conResultado.length
      ? Math.round((conResultado.reduce((s, h) => s + h.puntaje, 0) / conResultado.length) * 10) / 10
      : null

    res.json({
      alumno: a,
      docente: req.usuario.nombre,
      fecha: new Date().toISOString(),
      lecturas: hechas.length,
      conCuestionario: conResultado.length,
      promedio,
      estado: conResultado.length ? estadoPorPuntaje(conResultado[0].puntaje) : null,
      porTipo,
      ultimas: conResultado.slice(0, 5).map((h) => ({
        titulo: h.titulo,
        categoria: h.categoria,
        fecha: h.completada_en,
        correctas: h.correctas,
        total: h.total,
        estado: estadoPorPuntaje(h.puntaje),
      })),
      palabras: {
        total: palabras.reduce((s, p) => s + p.veces, 0),
        top: palabras.slice(0, 5).map((p) => p.palabra),
      },
      nota: nota?.texto ?? null,
      ...armarObservaciones({
        literal: porTipo.literal,
        inferencial: porTipo.inferencial,
        palabrasConsultadas: palabras.length,
        lecturasConCuestionario: conResultado.length,
      }),
    })
  })

  // Reasignar una actividad pendiente a otro alumno y/o cambiar si lleva cuestionario.
  r.patch('/asignaciones/:id', async (req, res) => {
    const d = parsear(reasignarSchema, req.body)
    const { rows } = await pool.query(
      `SELECT a.*, (SELECT count(*)::int FROM preguntas WHERE texto_id = a.texto_id) AS preguntas
         FROM asignaciones a WHERE a.id = $1 AND a.docente_id = $2`,
      [Number(req.params.id), req.usuario.id],
    )
    const act = rows[0]
    if (!act || act.estado === 'cancelada') throw notFound('Actividad no encontrada')
    if (act.estado !== 'pendiente') throw conflict('Solo se pueden cambiar actividades pendientes')

    const alumnoId = d.alumnoId ?? act.alumno_id
    const con = d.conCuestionario ?? act.con_cuestionario
    if (d.alumnoId !== undefined) await alumnoDelDocente(alumnoId, req.usuario.id)
    if (con && act.preguntas === 0) throw badRequest('Ese texto no tiene preguntas')
    await pool.query('UPDATE asignaciones SET alumno_id = $1, con_cuestionario = $2 WHERE id = $3', [
      alumnoId,
      con,
      act.id,
    ])
    res.json({ id: act.id, alumnoId, conCuestionario: con })
  })

  r.delete('/asignaciones/:id', async (req, res) => {
    const { rows } = await pool.query(
      `UPDATE asignaciones SET estado = 'cancelada'
        WHERE id = $1 AND docente_id = $2 AND estado = 'pendiente' RETURNING id`,
      [Number(req.params.id), req.usuario.id],
    )
    if (!rows[0]) throw notFound('No hay una actividad pendiente con ese número')
    res.status(204).end()
  })

  return r
}
