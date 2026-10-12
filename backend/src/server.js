import { config } from './config.js'
import { createPool } from './db.js'
import { migrate } from './migrate.js'
import { createApp } from './app.js'

const pool = createPool(config.databaseUrl)
await migrate(pool)
createApp({ pool }).listen(config.port, () => console.log(`API de Lectur en http://localhost:${config.port}`))
