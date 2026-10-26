import { Router } from 'express'
import { z } from 'zod'
import { config as appConfig } from '../config.js'
import { autenticar, requiereRol } from '../middleware/auth.js'
import { cursoDelDocente, filtroCurso } from '../lib/cursos.js'
import { calcularAlertas, completarConfig, TIPOS_ALERTA } from '../lib/alertas.js'
import { hoyEn } from '../lib/racha.js'
import { fechasActivas } from '../lib/rachas.js'
import { notFound } from '../lib/errors.js'
import { parsear } from '../lib/validar.js'

const configSchema = z.object({
  rojosSeguidos: z.number().int().min(2).max(5),
  diasSinLeer: z.number().int().min(1).max(15),
  rachaMinima: z.number().int().min(2).max(30),
  caidaPuntos: z.number().min(1).max(9),
  tipos: z.object({
    rojos_seguidos: z.boolean(),
    sin_leer: z.boolean(),
    racha_rota: z.boolean(),
    caida_puntaje: z.boolean(),
  }),
})
const vistaSchema = z.object({
  alumnoId: z.number().int().positive(),
  tipo: z.enum(TIPOS_ALERTA),
  clave: z.string().min(1).max(40),
})
const SEVERIDAD = { alta: 0, media: 1 }

// Alertas al docente: se calculan en el momento y el docente puede marcarlas como vistas.
export function alertasRouter({ pool }) {
  const r = Router()
  r.use(autenticar, requiereRol('docente'))

  async function configDe(docenteId) {
    const { rows } = await pool.query('SELECT config FROM alertas_config WHERE docente_id = $1', [docenteId])
    return completarConfig(rows[0]?.config)
  }

  // Todas las alertas vigentes de los alumnos del docente (opcionalmente de un curso).
  async function calcular(docenteId, cursoId) {
    const cfg = await configDe(docenteId)
    const hoy = hoyEn(appConfig.zonaHoraria)
    const alumnos = (
      await pool.query(
        `SELECT u.id, u.nombre, c.nombre AS curso FROM usuarios u LEFT JOIN cursos c ON c.id = u.curso_id
          WHERE u.rol = 'alumno' AND u.docente_id = $1 AND ($2::int IS NULL OR u.curso_id = $2)`,
        [docenteId, cursoId],
      )
    ).rows
    const ids = alumnos.map((a) => a.id)
    if (ids.length === 0) return { alertas: [], cfg }

    const resultados = await pool.query(
      `SELECT * FROM (
         SELECT a.alumno_id, r.id, r.puntaje, to_char(a.completada_en AT TIME ZONE $2, 'YYYY-MM-DD') AS fecha,
                row_number() OVER (PARTITION BY a.alumno_id ORDER BY a.completada_en DESC, r.id DESC) AS n
           FROM resultados r JOIN asignaciones a ON a.id = r.asignacion_id
          WHERE a.alumno_id = ANY($1::int[])
       ) x WHERE n <= 5 ORDER BY alumno_id, n`,
      [ids, appConfig.zonaHoraria],
    )
    const pendientes = await pool.query(
      `SELECT alumno_id, to_char(min(creada_en) AT TIME ZONE $2, 'YYYY-MM-DD') AS desde
         FROM asignaciones WHERE estado = 'pendiente' AND alumno_id = ANY($1::int[]) GROUP BY alumno_id`,
      [ids, appConfig.zonaHoraria],
    )
    const fechas = await fechasActivas(pool, ids)
    const vistas = await pool.query(
      'SELECT alumno_id, tipo, clave FROM alertas_vistas WHERE docente_id = $1',
      [docenteId],
    )
    const vistaSet = new Set(vistas.rows.map((v) => `${v.alumno_id}|${v.tipo}|${v.clave}`))

    const alertas = []
    for (const a of alumnos) {
      const calculadas = calcularAlertas({
        resultados: resultados.rows
          .filter((x) => x.alumno_id === a.id)
          .map((x) => ({ id: x.id, puntaje: x.puntaje, fecha: x.fecha })),
        fechas: fechas.get(a.id),
        pendienteDesde: pendientes.rows.find((p) => p.alumno_id === a.id)?.desde ?? null,
        hoy,
        config: cfg,
      })
      for (const al of calculadas) {
        alertas.push({
          ...al,
          alumnoId: a.id,
          alumno: a.nombre,
          curso: a.curso,
          vista: vistaSet.has(`${a.id}|${al.tipo}|${al.clave}`),
        })
      }
    }
    alertas.sort(
      (x, y) =>
        Number(x.vista) - Number(y.vista) ||
        SEVERIDAD[x.severidad] - SEVERIDAD[y.severidad] ||
        x.alumno.localeCompare(y.alumno),
    )
    return { alertas, cfg }
  }

  r.get('/alertas', async (req, res) => {
    const cursoId = filtroCurso(req.query)
    if (cursoId) await cursoDelDocente(pool, cursoId, req.usuario.id)
    const { alertas } = await calcular(req.usuario.id, cursoId)
    res.json({ alertas, noVistas: alertas.filter((a) => !a.vista).length })
  })

  r.post('/alertas/vista', async (req, res) => {
    const d = parsear(vistaSchema, req.body)
    const propio = await pool.query(
      `SELECT 1 FROM usuarios WHERE id = $1 AND rol = 'alumno' AND docente_id = $2`,
      [d.alumnoId, req.usuario.id],
    )
    if (!propio.rowCount) throw notFound('Alumno no encontrado')
    await pool.query(
      `INSERT INTO alertas_vistas (docente_id, alumno_id, tipo, clave) VALUES ($1, $2, $3, $4)
       ON CONFLICT (docente_id, alumno_id, tipo, clave) DO NOTHING`,
      [req.usuario.id, d.alumnoId, d.tipo, d.clave],
    )
    res.status(204).end()
  })

  // Marca como vistas todas las alertas vigentes (de un curso, si se indica).
  r.post('/alertas/vistas', async (req, res) => {
    const cursoId = filtroCurso(req.query)
    if (cursoId) await cursoDelDocente(pool, cursoId, req.usuario.id)
    const { alertas } = await calcular(req.usuario.id, cursoId)
    for (const a of alertas.filter((x) => !x.vista)) {
      await pool.query(
        `INSERT INTO alertas_vistas (docente_id, alumno_id, tipo, clave) VALUES ($1, $2, $3, $4)
         ON CONFLICT (docente_id, alumno_id, tipo, clave) DO NOTHING`,
        [req.usuario.id, a.alumnoId, a.tipo, a.clave],
      )
    }
    res.json({ marcadas: alertas.filter((x) => !x.vista).length })
  })

  r.get('/alertas/config', async (req, res) => {
    res.json({ config: await configDe(req.usuario.id) })
  })

  r.put('/alertas/config', async (req, res) => {
    const c = parsear(configSchema, req.body)
    await pool.query(
      `INSERT INTO alertas_config (docente_id, config) VALUES ($1, $2::jsonb)
       ON CONFLICT (docente_id) DO UPDATE SET config = EXCLUDED.config`,
      [req.usuario.id, JSON.stringify(c)],
    )
    res.json({ config: c })
  })

  return r
}
