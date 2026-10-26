import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { autenticar, requiereRol } from '../middleware/auth.js'
import { conflict } from '../lib/errors.js'
import { cursoDelDocente } from '../lib/cursos.js'
import { generarPassword } from '../lib/passwords.js'
import { parsear } from '../lib/validar.js'

export const MAX_FILAS = 100

const importarSchema = z.object({
  cursoId: z.number().int().positive().optional(),
  confirmar: z.boolean().default(false),
  filas: z
    .array(
      z.object({
        nombre: z.string().max(200).default(''),
        email: z.string().max(200).default(''),
        curso: z.string().max(100).default(''),
        password: z.string().max(100).default(''),
      }),
    )
    .min(1, 'El archivo no tiene filas')
    .max(MAX_FILAS, `Máximo ${MAX_FILAS} alumnos por archivo`),
})

const emailValido = z.string().email().max(120)
const norm = (t) => t.trim().toLowerCase()

// Carga masiva: primero una vista previa que valida cada fila (confirmar: false) y,
// con confirmar: true, crea solo las filas válidas en una transacción.
export function importarAlumnosRouter({ pool }) {
  const r = Router()
  r.use(autenticar, requiereRol('docente'))

  r.post('/alumnos/importar', async (req, res) => {
    const d = parsear(importarSchema, req.body)
    const cursoPorDefecto = d.cursoId ? await cursoDelDocente(pool, d.cursoId, req.usuario.id) : null
    const cursos = new Map(
      (
        await pool.query('SELECT id, nombre, grado FROM cursos WHERE docente_id = $1', [req.usuario.id])
      ).rows.map((c) => [norm(c.nombre), c]),
    )
    const emails = d.filas.map((f) => norm(f.email))
    const existentes = new Set(
      (await pool.query('SELECT email FROM usuarios WHERE email = ANY($1::text[])', [emails])).rows.map(
        (x) => x.email,
      ),
    )

    const vistos = new Set()
    const filas = d.filas.map((f, indice) => {
      const errores = []
      const nombre = f.nombre.trim()
      const email = norm(f.email)
      const cursoTexto = f.curso.trim()
      const password = f.password.trim()

      if (nombre.length < 2) errores.push('Falta el nombre (mínimo 2 letras)')
      else if (nombre.length > 80) errores.push('El nombre es demasiado largo')
      if (!email) errores.push('Falta el email')
      else if (!emailValido.safeParse(email).success) errores.push('El email no es válido')
      else if (existentes.has(email)) errores.push('Ya existe una cuenta con ese email')
      else if (vistos.has(email)) errores.push('El email está repetido en el archivo')
      if (email) vistos.add(email)

      let curso = null
      if (cursoTexto) {
        curso = cursos.get(norm(cursoTexto)) ?? null
        if (!curso) errores.push(`El curso "${cursoTexto}" no existe`)
      } else if (cursoPorDefecto) {
        curso = cursoPorDefecto
      } else {
        errores.push('Falta el curso')
      }
      if (password && password.length < 8) errores.push('La contraseña debe tener al menos 8 caracteres')

      return { indice, nombre, email, curso, password, errores }
    })

    const validas = filas.filter((f) => f.errores.length === 0)
    const resumen = filas.map((f) => ({
      indice: f.indice,
      nombre: f.nombre,
      email: f.email,
      curso: f.curso?.nombre ?? null,
      estado: f.errores.length ? 'error' : 'ok',
      errores: f.errores,
    }))

    if (!d.confirmar) {
      return res.json({ filas: resumen, validas: validas.length, conErrores: filas.length - validas.length })
    }

    const creados = []
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      for (const f of validas) {
        const generada = !f.password
        const clave = generada ? generarPassword() : f.password
        await client.query(
          `INSERT INTO usuarios (nombre, email, password_hash, rol, grado, docente_id, curso_id)
           VALUES ($1, $2, $3, 'alumno', $4, $5, $6)`,
          [
            f.nombre,
            f.email,
            await bcrypt.hash(clave, 10),
            String(f.curso.grado),
            req.usuario.id,
            f.curso.id,
          ],
        )
        creados.push({
          nombre: f.nombre,
          email: f.email,
          curso: f.curso.nombre,
          password: generada ? clave : null,
        })
      }
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      if (e.code === '23505')
        throw conflict('Alguno de los emails ya fue registrado mientras importabas. Probá de nuevo.')
      throw e
    } finally {
      client.release()
    }
    res.status(201).json({ creados, omitidas: filas.length - validas.length })
  })

  return r
}
