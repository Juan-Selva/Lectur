import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { config } from './config.js'
import { createPool } from './db.js'
import { migrate } from './migrate.js'
import { normalizar } from './lib/diccionario.js'
import { textos } from './seed-data.js'
import { definiciones } from './diccionario-data.js'

// Carga textos y definiciones precargados (idempotente).
export async function seedBase(pool) {
  for (const t of textos) {
    const ya = await pool.query('SELECT 1 FROM textos WHERE titulo = $1 AND autor_id IS NULL', [t.titulo])
    if (ya.rowCount) continue
    const { rows } = await pool.query(
      'INSERT INTO textos (titulo, cuerpo, nivel, categoria, autor_id) VALUES ($1, $2, $3, $4, NULL) RETURNING id',
      [t.titulo, t.cuerpo, t.nivel, t.categoria],
    )
    for (const [i, p] of t.preguntas.entries()) {
      await pool.query(
        `INSERT INTO preguntas (texto_id, orden, enunciado, tipo, opciones, correcta) VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
        [rows[0].id, i + 1, p.enunciado, p.tipo, JSON.stringify(p.opciones), p.correcta],
      )
    }
  }
  // Las definiciones propias pisan a las que se hayan guardado antes de la fuente externa,
  // y se actualizan si cambia el texto: el diccionario propio siempre tiene prioridad.
  for (const [palabra, significado] of definiciones) {
    await pool.query(
      `INSERT INTO definiciones (palabra_norm, palabra, significado, fuente) VALUES ($1, $2, $3, 'propia')
       ON CONFLICT (palabra_norm) DO UPDATE
         SET palabra = EXCLUDED.palabra, significado = EXCLUDED.significado, fuente = 'propia'`,
      [normalizar(palabra), palabra, significado],
    )
  }
}

// Docente y alumnos de demostración. Las credenciales están en el README.
export async function seedDemo(pool) {
  const hash = await bcrypt.hash('lectur1234', 10)
  const docente = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ('Valentina Gómez', 'docente@lectur.test', $1, 'docente')
     ON CONFLICT (email) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id`,
    [hash],
  )
  const cursos = {}
  for (const [nombre, grado] of [
    ['2.° A', 2],
    ['3.° B', 3],
  ]) {
    const { rows } = await pool.query(
      `INSERT INTO cursos (docente_id, nombre, grado) VALUES ($1, $2, $3)
       ON CONFLICT (docente_id, nombre) DO UPDATE SET grado = EXCLUDED.grado RETURNING id`,
      [docente.rows[0].id, nombre, grado],
    )
    cursos[nombre] = { id: rows[0].id, grado }
  }
  for (const [nombre, email, curso] of [
    ['Mateo Pérez', 'mateo@lectur.test', '2.° A'],
    ['Sofía Ruiz', 'sofia@lectur.test', '2.° A'],
    ['Lucas Díaz', 'lucas@lectur.test', '3.° B'],
  ]) {
    await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, grado, docente_id, curso_id)
       VALUES ($1, $2, $3, 'alumno', $4, $5, $6)
       ON CONFLICT (email) DO UPDATE SET curso_id = EXCLUDED.curso_id, grado = EXCLUDED.grado`,
      [nombre, email, hash, String(cursos[curso].grado), docente.rows[0].id, cursos[curso].id],
    )
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pool = createPool(config.databaseUrl)
  await migrate(pool)
  await seedBase(pool)
  if (process.argv.includes('--demo')) await seedDemo(pool)
  await pool.end()
  console.log('Datos cargados')
}
