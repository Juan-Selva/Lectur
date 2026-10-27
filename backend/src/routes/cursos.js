import { Router } from 'express'
import { z } from 'zod'
import { autenticar, requiereRol } from '../middleware/auth.js'
import { conflict } from '../lib/errors.js'
import { cursoDelDocente } from '../lib/cursos.js'
import { parsear } from '../lib/validar.js'

const cursoSchema = z.object({
  nombre: z.string().trim().min(1).max(40),
  grado: z.number().int().min(1).max(3),
})

export function cursosRouter({ pool }) {
  const r = Router()
  r.use(autenticar, requiereRol('docente'))

  r.get('/', async (req, res) => {
    const { rows } = await pool.query(
      `SELECT c.id, c.nombre, c.grado,
              (SELECT count(*)::int FROM usuarios u WHERE u.curso_id = c.id) AS alumnos
         FROM cursos c WHERE c.docente_id = $1 ORDER BY c.grado, c.nombre`,
      [req.usuario.id],
    )
    res.json({ cursos: rows })
  })

  // Alumnos de un curso (nombre y email), para consultarlos desde la pantalla de cursos.
  r.get('/:id/alumnos', async (req, res) => {
    const curso = await cursoDelDocente(pool, Number(req.params.id), req.usuario.id)
    const { rows } = await pool.query(
      `SELECT id, nombre, email, grado FROM usuarios
        WHERE rol = 'alumno' AND docente_id = $1 AND curso_id = $2 ORDER BY nombre`,
      [req.usuario.id, curso.id],
    )
    res.json({ curso: { id: curso.id, nombre: curso.nombre, grado: curso.grado }, alumnos: rows })
  })

  r.post('/', async (req, res) => {
    const d = parsear(cursoSchema, req.body)
    try {
      const { rows } = await pool.query(
        'INSERT INTO cursos (docente_id, nombre, grado) VALUES ($1, $2, $3) RETURNING id, nombre, grado',
        [req.usuario.id, d.nombre, d.grado],
      )
      res.status(201).json({ curso: rows[0] })
    } catch (e) {
      if (e.code === '23505') throw conflict('Ya tenés un curso con ese nombre')
      throw e
    }
  })

  // Al cambiar el grado del curso, los alumnos del curso toman el nuevo grado.
  r.put('/:id', async (req, res, next) => {
    try {
      const d = parsear(cursoSchema, req.body)
      await cursoDelDocente(pool, Number(req.params.id), req.usuario.id)
      const { rows } = await pool.query(
        'UPDATE cursos SET nombre = $1, grado = $2 WHERE id = $3 AND docente_id = $4 RETURNING id, nombre, grado',
        [d.nombre, d.grado, Number(req.params.id), req.usuario.id],
      )
      await pool.query('UPDATE usuarios SET grado = $1 WHERE curso_id = $2', [String(d.grado), rows[0].id])
      res.json({ curso: rows[0] })
    } catch (e) {
      next(e.code === '23505' ? conflict('Ya tenés un curso con ese nombre') : e)
    }
  })

  // Un curso con alumnos no se borra: primero hay que moverlos o eliminarlos.
  r.delete('/:id', async (req, res) => {
    const curso = await cursoDelDocente(pool, Number(req.params.id), req.usuario.id)
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM usuarios WHERE curso_id = $1', [
      curso.id,
    ])
    if (rows[0].n > 0) throw conflict('El curso tiene alumnos: movelos a otro curso antes de borrarlo')
    await pool.query('DELETE FROM cursos WHERE id = $1', [curso.id])
    res.status(204).end()
  })

  return r
}
