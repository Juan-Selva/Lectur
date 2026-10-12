import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { autenticar, requiereRol } from '../middleware/auth.js'
import { badRequest, conflict, notFound } from '../lib/errors.js'
import { estadoPorPuntaje } from '../lib/semaforo.js'
import { parsear } from '../lib/validar.js'

const alumnoSchema = z.object({
  nombre: z.string().trim().min(2).max(80),
  email: z.string().email().max(120),
  password: z.string().min(8).max(100),
  grado: z.number().int().min(1).max(3),
})
const asignarSchema = z.object({
  textoId: z.number().int().positive(),
  alumnoIds: z.array(z.number().int().positive()).min(1).max(60),
  conCuestionario: z.boolean(),
})
const notaSchema = z.object({ texto: z.string().trim().max(500) })

export function docenteRouter({ pool }) {
  const r = Router()
  r.use(autenticar, requiereRol('docente'))

  async function alumnoDelDocente(alumnoId, docenteId) {
    const { rows } = await pool.query(
      `SELECT id, nombre, grado FROM usuarios WHERE id = $1 AND rol = 'alumno' AND docente_id = $2`,
      [alumnoId, docenteId],
    )
    if (!rows[0]) throw notFound('Alumno no encontrado')
    return rows[0]
  }

  r.post('/alumnos', async (req, res) => {
    const d = parsear(alumnoSchema, req.body)
    const hash = await bcrypt.hash(d.password, 10)
    try {
      const { rows } = await pool.query(
        `INSERT INTO usuarios (nombre, email, password_hash, rol, grado, docente_id)
         VALUES ($1, $2, $3, 'alumno', $4, $5) RETURNING id, nombre, email, grado`,
        [d.nombre, d.email.toLowerCase(), hash, d.grado, req.usuario.id],
      )
      res.status(201).json({ alumno: rows[0] })
    } catch (e) {
      if (e.code === '23505') throw conflict('Ya existe una cuenta con ese email')
      throw e
    }
  })

  // Semáforo: por alumno, último resultado con cuestionario (null => "Sin eval.").
  r.get('/semaforo', async (req, res) => {
    const { rows } = await pool.query(
      `SELECT u.id, u.nombre, u.grado,
              n.texto AS nota,
              ult.puntaje, ult.correctas, ult.total, ult.literal_completo, ult.inferencial_completo,
              ult.titulo AS ultimo_texto, ult.completada_en,
              (SELECT count(*)::int FROM asignaciones a WHERE a.alumno_id = u.id AND a.estado = 'pendiente') AS pendientes
         FROM usuarios u
         LEFT JOIN notas n ON n.alumno_id = u.id AND n.docente_id = $1
         LEFT JOIN LATERAL (
           SELECT r.puntaje, r.correctas, r.total, r.literal_completo, r.inferencial_completo,
                  t.titulo, a.completada_en
             FROM resultados r
             JOIN asignaciones a ON a.id = r.asignacion_id
             JOIN textos t ON t.id = a.texto_id
            WHERE a.alumno_id = u.id
            ORDER BY a.completada_en DESC
            LIMIT 1
         ) ult ON true
        WHERE u.rol = 'alumno' AND u.docente_id = $1
        ORDER BY u.nombre`,
      [req.usuario.id],
    )
    const alumnos = rows.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      grado: a.grado,
      nota: a.nota,
      pendientes: a.pendientes,
      estado: estadoPorPuntaje(a.puntaje),
      ultimo:
        a.puntaje === null
          ? null
          : {
              texto: a.ultimo_texto,
              puntaje: a.puntaje,
              correctas: a.correctas,
              total: a.total,
              literalCompleto: a.literal_completo,
              inferencialCompleto: a.inferencial_completo,
              fecha: a.completada_en,
            },
    }))
    res.json({ alumnos })
  })

  r.post('/asignaciones', async (req, res) => {
    const d = parsear(asignarSchema, req.body)
    const t = await pool.query(
      `SELECT id, (SELECT count(*)::int FROM preguntas WHERE texto_id = textos.id) AS preguntas
         FROM textos WHERE id = $1 AND (autor_id IS NULL OR autor_id = $2)`,
      [d.textoId, req.usuario.id],
    )
    if (!t.rows[0]) throw notFound('Texto no encontrado')
    if (d.conCuestionario && t.rows[0].preguntas === 0) {
      throw badRequest('Ese texto no tiene preguntas, asignalo sin cuestionario o agregale preguntas')
    }
    const ids = [...new Set(d.alumnoIds)]
    const propios = await pool.query(
      `SELECT id FROM usuarios WHERE rol = 'alumno' AND docente_id = $1 AND id = ANY($2::int[])`,
      [req.usuario.id, ids],
    )
    if (propios.rowCount !== ids.length) throw badRequest('Algún alumno no pertenece a tu curso')

    for (const alumnoId of ids) {
      await pool.query(
        `INSERT INTO asignaciones (texto_id, alumno_id, docente_id, con_cuestionario)
         VALUES ($1, $2, $3, $4)`,
        [d.textoId, alumnoId, req.usuario.id, d.conCuestionario],
      )
    }
    res.status(201).json({ asignadas: ids.length })
  })

  r.put('/alumnos/:id/nota', async (req, res) => {
    const alumno = await alumnoDelDocente(Number(req.params.id), req.usuario.id)
    const { texto } = parsear(notaSchema, req.body)
    if (texto === '') {
      await pool.query('DELETE FROM notas WHERE alumno_id = $1 AND docente_id = $2', [
        alumno.id,
        req.usuario.id,
      ])
      return res.json({ nota: null })
    }
    await pool.query(
      `INSERT INTO notas (alumno_id, docente_id, texto) VALUES ($1, $2, $3)
       ON CONFLICT (alumno_id, docente_id) DO UPDATE SET texto = EXCLUDED.texto, actualizado_en = now()`,
      [alumno.id, req.usuario.id, texto],
    )
    res.json({ nota: texto })
  })

  return r
}
