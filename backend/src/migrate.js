import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createPool } from './db.js'

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations')

export async function migrate(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      nombre TEXT PRIMARY KEY,
      aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  const aplicadas = new Set(
    (await pool.query('SELECT nombre FROM schema_migrations')).rows.map((r) => r.nombre),
  )
  const archivos = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort()

  for (const archivo of archivos) {
    if (aplicadas.has(archivo)) continue
    const sql = await readFile(path.join(migrationsDir, archivo), 'utf8')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (nombre) VALUES ($1)', [archivo])
      await client.query('COMMIT')
      console.log(`Migración aplicada: ${archivo}`)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pool = createPool()
  migrate(pool)
    .then(() => console.log('Migraciones al día.'))
    .catch((error) => {
      console.error(error)
      process.exitCode = 1
    })
    .finally(() => pool.end())
}
