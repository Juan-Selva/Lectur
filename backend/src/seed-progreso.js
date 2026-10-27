// Datos para la demo, todos en 3.° B (3.° grado). Se puede correr las veces que se quiera: siempre
// reemplaza la actividad de esos alumnos. Uso: `npm run seed:progreso`.
//  - Mateo: 12 días de racha y lecturas que mejoran de a poco (de rojo a verde, hasta las 3 estrellas).
//  - Lucas: en amarillo.
//  - Renata: en verde. Joaquín y Camila: con problemas (alertas al docente).
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { config } from './config.js'
import { createPool } from './db.js'
import { migrate } from './migrate.js'
import { seedBase, seedDemo } from './seed.js'
import { hoyEn } from './lib/racha.js'
import { mezcla } from './lib/preguntas.js'
import { calcularResultado } from './lib/semaforo.js'

const EMAIL = 'mateo@lectur.test'
const DIAS_DE_RACHA = 12
const TEXTO_PENDIENTE = 'El loro pelado' // lectura asignada que cada alumno todavía no hizo

// Los últimos `n` días de clase (lunes a viernes) hasta `hoy`, del más viejo al más nuevo.
export function diasHabiles(hoy, n) {
  const dias = []
  let t = Date.UTC(Number(hoy.slice(0, 4)), Number(hoy.slice(5, 7)) - 1, Number(hoy.slice(8, 10)))
  while (dias.length < n) {
    if (![0, 6].includes(new Date(t).getUTCDay())) dias.unshift(new Date(t).toISOString().slice(0, 10))
    t -= 86400000
  }
  return dias
}

// Cada paso es una lectura de un día. `dia`: posición entre los últimos 12 días de clase (11 = hoy);
// `asig`: lectura asignada por la docente (cuenta para el semáforo); `practica`: práctica libre de un
// texto de 3.° (cuenta para la racha); `texto`: posición entre los textos de 3.° grado;
// `nivel`: proporción de aciertos.
const PLAN_MATEO = [
  { dia: 0, tipo: 'asig', texto: 0, nivel: 0.2 }, // rojo
  { dia: 1, tipo: 'practica', texto: 0, nivel: 0.4 },
  { dia: 2, tipo: 'asig', texto: 1, nivel: 0.3 }, // rojo
  { dia: 3, tipo: 'asig', texto: 2, nivel: 0.45 }, // amarillo
  { dia: 4, tipo: 'asig', texto: 3, nivel: 0.55 }, // amarillo
  { dia: 5, tipo: 'practica', texto: 1, nivel: 0.7 },
  { dia: 6, tipo: 'asig', texto: 4, nivel: 0.65 }, // amarillo
  { dia: 7, tipo: 'asig', texto: 5, nivel: 0.8 }, // verde
  { dia: 8, tipo: 'practica', texto: 2, nivel: 0.8 },
  { dia: 9, tipo: 'asig', texto: 6, nivel: 0.85 }, // verde
  { dia: 10, tipo: 'asig', texto: 7, nivel: 1 }, // verde, 3 estrellas
  { dia: 11, tipo: 'practica', texto: 7, nivel: 1 }, // 3 estrellas
]

// Lucas: resultados parejos que quedan en amarillo (5,0 -> 6,7 -> 5,0).
const PLAN_LUCAS = [
  { dia: 8, tipo: 'asig', texto: 0, nivel: 0.5 },
  { dia: 9, tipo: 'asig', texto: 1, nivel: 0.65 },
  { dia: 10, tipo: 'practica', texto: 0, nivel: 0.5 },
  { dia: 11, tipo: 'asig', texto: 2, nivel: 0.5 },
]

// Renata: lee seguido y siempre en verde.
const PLAN_RENATA = [
  { dia: 6, tipo: 'asig', texto: 0, nivel: 0.85 },
  { dia: 7, tipo: 'asig', texto: 1, nivel: 1 },
  { dia: 8, tipo: 'asig', texto: 2, nivel: 0.85 },
  { dia: 9, tipo: 'practica', texto: 3, nivel: 1 },
  { dia: 10, tipo: 'asig', texto: 3, nivel: 1 },
  { dia: 11, tipo: 'asig', texto: 4, nivel: 0.85 },
]

// Joaquín: tres lecturas seguidas en rojo (alerta "rojos seguidos") y salteando días.
const PLAN_JOAQUIN = [
  { dia: 7, tipo: 'asig', texto: 0, nivel: 0.17 },
  { dia: 9, tipo: 'asig', texto: 1, nivel: 0.33 },
  { dia: 11, tipo: 'asig', texto: 2, nivel: 0.17 },
]

// Camila: venía bien, bajó fuerte en el último cuestionario (alerta "caída de puntaje") y hace días
// que no lee (alerta "sin leer").
const PLAN_CAMILA = [
  { dia: 0, tipo: 'asig', texto: 0, nivel: 0.67 },
  { dia: 1, tipo: 'asig', texto: 1, nivel: 0.83 },
  { dia: 2, tipo: 'asig', texto: 2, nivel: 0.33 },
]

// Respuestas de un alumno que acierta `k` preguntas (las primeras que le tocan) y falla el resto.
function responder(preguntas, k) {
  const ids = preguntas.map((p) => p.id)
  const aciertan = new Set(ids.slice(0, k))
  return preguntas.map((p) => {
    const ok = aciertan.has(p.id)
    if (p.formato === 'orden') {
      const n = p.opciones.length
      const perm = mezcla(p.id, n) // perm[k] = posición original del elemento que se muestra en el lugar k
      const correcto = Array.from({ length: n }, (_, i) => perm.indexOf(i))
      return { preguntaId: p.id, orden: ok ? correcto : [...correcto].reverse() }
    }
    return { preguntaId: p.id, opcion: ok ? p.correcta : (p.correcta + 1) % p.opciones.length }
  })
}

async function cursoTercero(pool, docenteId) {
  const { rows } = await pool.query(
    `INSERT INTO cursos (docente_id, nombre, grado) VALUES ($1, '3.° B', 3)
     ON CONFLICT (docente_id, nombre) DO UPDATE SET grado = 3 RETURNING id`,
    [docenteId],
  )
  return rows[0].id
}

// Borra la actividad del alumno y la reemplaza por la del plan.
async function aplicarPlan(pool, alumno, plan, hoy) {
  await pool.query('DELETE FROM asignaciones WHERE alumno_id = $1', [alumno.id])
  await pool.query('DELETE FROM practicas WHERE alumno_id = $1', [alumno.id])
  await pool.query('DELETE FROM alertas_vistas WHERE alumno_id = $1', [alumno.id])

  const textos = (
    await pool.query(`SELECT id, titulo FROM textos WHERE autor_id IS NULL AND grado = 3 ORDER BY id`)
  ).rows
  if (textos.length < 8) throw new Error('Faltan textos de 3.° grado: corré npm run seed')
  const dias = diasHabiles(hoy, DIAS_DE_RACHA)
  const cuando = (dia, hora) => `${dia} ${hora}`
  const resumen = []

  for (const paso of plan) {
    const texto = textos[paso.texto]
    const preguntas = (
      await pool.query(
        'SELECT id, tipo, formato, opciones, correcta FROM preguntas WHERE texto_id = $1 ORDER BY orden',
        [texto.id],
      )
    ).rows
    const k = Math.round(paso.nivel * preguntas.length)
    const r = calcularResultado(preguntas, responder(preguntas, k))
    const dia = dias[paso.dia]
    if (paso.tipo === 'asig') {
      const a = await pool.query(
        `INSERT INTO asignaciones (texto_id, alumno_id, docente_id, con_cuestionario, estado, creada_en, completada_en)
         VALUES ($1, $2, $3, true, 'completada', ($4::timestamp AT TIME ZONE $6), ($5::timestamp AT TIME ZONE $6))
         RETURNING id`,
        [
          texto.id,
          alumno.id,
          alumno.docente_id,
          cuando(dia, '08:30'),
          cuando(dia, '10:15'),
          config.zonaHoraria,
        ],
      )
      await pool.query(
        `INSERT INTO resultados (asignacion_id, puntaje, correctas, total, literal_completo, inferencial_completo, respuestas, creado_en)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, ($8::timestamp AT TIME ZONE $9))`,
        [
          a.rows[0].id,
          r.puntaje,
          r.correctas,
          r.total,
          r.literalCompleto,
          r.inferencialCompleto,
          JSON.stringify(r.detalle),
          cuando(dia, '10:15'),
          config.zonaHoraria,
        ],
      )
    } else {
      await pool.query(
        `INSERT INTO practicas (alumno_id, texto_id, con_cuestionario, correctas, total, respuestas, completada_en)
         VALUES ($1, $2, true, $3, $4, $5::jsonb, ($6::timestamp AT TIME ZONE $7))`,
        [
          alumno.id,
          texto.id,
          r.correctas,
          r.total,
          JSON.stringify(r.detalle),
          cuando(dia, '16:00'),
          config.zonaHoraria,
        ],
      )
    }
    resumen.push({ alumno: alumno.nombre, dia, tipo: paso.tipo, texto: texto.titulo, puntaje: r.puntaje })
  }

  // Lectura pendiente: "El loro pelado", asignada hoy y sin completar.
  const loro = await pool.query(`SELECT id, titulo FROM textos WHERE titulo = $1 AND autor_id IS NULL`, [
    TEXTO_PENDIENTE,
  ])
  if (!loro.rows[0]) throw new Error(`Falta el texto "${TEXTO_PENDIENTE}": corré npm run seed`)
  await pool.query(
    `INSERT INTO asignaciones (texto_id, alumno_id, docente_id, con_cuestionario, estado, creada_en)
     VALUES ($1, $2, $3, true, 'pendiente', ($4::timestamp AT TIME ZONE $5))`,
    [loro.rows[0].id, alumno.id, alumno.docente_id, cuando(dias.at(-1), '08:00'), config.zonaHoraria],
  )
  resumen.push({
    alumno: alumno.nombre,
    dia: dias.at(-1),
    tipo: 'pendiente',
    texto: loro.rows[0].titulo,
    puntaje: null,
  })
  return resumen
}

export async function seedProgresoMateo(pool, { hoy = hoyEn(config.zonaHoraria), email = EMAIL } = {}) {
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.docente_id FROM usuarios u WHERE u.email = $1 AND u.rol = 'alumno'`,
    [email],
  )
  const mateo = rows[0]
  if (!mateo) throw new Error(`No existe el alumno ${email}: corré primero npm run seed:demo`)

  // Pasa a 3.° B, el curso de 3.° grado de su docente.
  const cursoId = await cursoTercero(pool, mateo.docente_id)
  await pool.query(`UPDATE usuarios SET grado = '3', curso_id = $2 WHERE id = $1`, [mateo.id, cursoId])
  return aplicarPlan(pool, mateo, PLAN_MATEO, hoy)
}

// Lucas (amarillo) y tres alumnos nuevos de 3.°: Renata (verde), Joaquín y Camila (con problemas).
// Todos con la contraseña de la demo (lectur1234).
const ALUMNOS_TERCERO = [
  { nombre: 'Lucas Díaz', email: 'lucas@lectur.test', plan: PLAN_LUCAS },
  { nombre: 'Renata Ortiz', email: 'renata@lectur.test', plan: PLAN_RENATA },
  { nombre: 'Joaquín Romero', email: 'joaquin@lectur.test', plan: PLAN_JOAQUIN },
  { nombre: 'Camila Torres', email: 'camila@lectur.test', plan: PLAN_CAMILA },
]

export async function seedAlumnosTercero(pool, { hoy = hoyEn(config.zonaHoraria) } = {}) {
  const docente = await pool.query(
    `SELECT id FROM usuarios WHERE email = 'docente@lectur.test' AND rol = 'docente'`,
  )
  if (!docente.rows[0]) throw new Error('No existe la docente de la demo: corré primero npm run seed:demo')
  const docenteId = docente.rows[0].id
  const cursoId = await cursoTercero(pool, docenteId)
  const hash = await bcrypt.hash('lectur1234', 10)
  const resumen = []
  for (const a of ALUMNOS_TERCERO) {
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, grado, docente_id, curso_id)
       VALUES ($1, $2, $3, 'alumno', '3', $4, $5)
       ON CONFLICT (email) DO UPDATE SET grado = '3', docente_id = EXCLUDED.docente_id, curso_id = EXCLUDED.curso_id
       RETURNING id, nombre, docente_id`,
      [a.nombre, a.email, hash, docenteId, cursoId],
    )
    resumen.push(...(await aplicarPlan(pool, rows[0], a.plan, hoy)))
  }
  return resumen
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pool = createPool(config.databaseUrl)
  await migrate(pool)
  await seedBase(pool)
  await seedDemo(pool)
  const resumen = [...(await seedProgresoMateo(pool)), ...(await seedAlumnosTercero(pool))]
  await pool.end()
  console.table(resumen)
  console.log('Listo: Mateo, Lucas, Renata, Joaquín y Camila quedaron en 3.° B.')
}
