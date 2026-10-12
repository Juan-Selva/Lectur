import pg from 'pg'
import { config } from './config.js'

// NUMERIC llega como string por defecto; lo convertimos a número (puntajes 0-10).
pg.types.setTypeParser(1700, (value) => (value === null ? null : Number(value)))

export function createPool(connectionString = config.databaseUrl) {
  return new pg.Pool({ connectionString })
}
