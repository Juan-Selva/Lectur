import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { autenticar, firmarToken } from '../middleware/auth.js'
import { HttpError, conflict } from '../lib/errors.js'
import { parsear } from '../lib/validar.js'

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })
const registroSchema = z.object({
  nombre: z.string().trim().min(2).max(80),
  email: z.string().email().max(120),
  password: z.string().min(8).max(100),
})

const publico = (u) => ({ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, grado: u.grado })

export function authRouter({ pool }) {
  const r = Router()

  r.post('/login', async (req, res) => {
    const { email, password } = parsear(loginSchema, req.body)
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.toLowerCase()])
    const u = rows[0]
    if (!u || !(await bcrypt.compare(password, u.password_hash))) {
      throw new HttpError(401, 'Email o contraseña incorrectos')
    }
    res.json({ token: firmarToken(u), usuario: publico(u) })
  })

  r.post('/registro-docente', async (req, res) => {
    const d = parsear(registroSchema, req.body)
    const hash = await bcrypt.hash(d.password, 10)
    try {
      const { rows } = await pool.query(
        `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, 'docente') RETURNING *`,
        [d.nombre, d.email.toLowerCase(), hash],
      )
      res.status(201).json({ token: firmarToken(rows[0]), usuario: publico(rows[0]) })
    } catch (e) {
      if (e.code === '23505') throw conflict('Ya existe una cuenta con ese email')
      throw e
    }
  })

  r.get('/me', autenticar, async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE id = $1', [req.usuario.id])
    if (!rows[0]) throw new HttpError(401, 'Usuario inexistente')
    res.json({ usuario: publico(rows[0]) })
  })

  return r
}
