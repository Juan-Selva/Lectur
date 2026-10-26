import { config } from '../config.js'
import { calcularRacha, hoyEn } from './racha.js'

// Días con actividad (asignaciones completadas y prácticas) de cada alumno, en la zona horaria configurada.
export async function fechasActivas(pool, alumnoIds) {
  const porAlumno = new Map(alumnoIds.map((id) => [id, []]))
  if (alumnoIds.length === 0) return porAlumno
  const { rows } = await pool.query(
    `SELECT alumno_id, to_char(t AT TIME ZONE $2, 'YYYY-MM-DD') AS dia
       FROM (
         SELECT alumno_id, completada_en AS t FROM asignaciones WHERE estado = 'completada' AND alumno_id = ANY($1::int[])
         UNION ALL
         SELECT alumno_id, completada_en AS t FROM practicas WHERE alumno_id = ANY($1::int[])
       ) x
      GROUP BY 1, 2`,
    [alumnoIds, config.zonaHoraria],
  )
  for (const r of rows) porAlumno.get(r.alumno_id).push(r.dia)
  return porAlumno
}

export async function rachasDe(pool, alumnoIds) {
  const hoy = hoyEn(config.zonaHoraria)
  const fechas = await fechasActivas(pool, alumnoIds)
  return new Map(alumnoIds.map((id) => [id, calcularRacha(fechas.get(id), hoy)]))
}

export async function rachaDe(pool, alumnoId) {
  return (await rachasDe(pool, [alumnoId])).get(alumnoId)
}
