import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config.js'
import { HttpError } from './lib/errors.js'
import { crearServicioDiccionario } from './lib/diccionario.js'
import { authRouter } from './routes/auth.js'
import { textosRouter } from './routes/textos.js'
import { docenteRouter } from './routes/docente.js'
import { alertasRouter } from './routes/alertas.js'
import { cursosRouter } from './routes/cursos.js'
import { importarAlumnosRouter } from './routes/importarAlumnos.js'
import { docenteAlumnosRouter } from './routes/docenteAlumnos.js'
import { alumnoPracticaRouter } from './routes/alumnoPractica.js'
import { alumnoRouter } from './routes/alumno.js'
import { diccionarioRouter } from './routes/diccionario.js'

export function createApp({ pool, buscarExterno, usarExterno = config.diccionarioExterno } = {}) {
  const app = express()
  const diccionario = crearServicioDiccionario({ pool, buscarExterno, usarExterno })

  app.use(helmet())
  app.use(cors({ origin: config.corsOrigin.split(',') }))
  app.use(express.json({ limit: '100kb' }))

  app.get('/api/health', (_req, res) => res.json({ ok: true }))
  app.use('/api/auth', authRouter({ pool }))
  app.use('/api/textos', textosRouter({ pool }))
  app.use('/api/cursos', cursosRouter({ pool }))
  app.use('/api/docente', alertasRouter({ pool }))
  app.use('/api/docente', importarAlumnosRouter({ pool }))
  app.use('/api/docente', docenteRouter({ pool }))
  app.use('/api/docente', docenteAlumnosRouter({ pool }))
  app.use('/api/alumno', alumnoPracticaRouter({ pool }))
  app.use('/api/alumno', alumnoRouter({ pool }))
  app.use('/api/diccionario', diccionarioRouter({ diccionario, pool }))

  app.use((_req, _res, next) => next(new HttpError(404, 'Ruta inexistente')))
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message })
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido' })
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  })
  return app
}
