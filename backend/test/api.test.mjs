import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import EmbeddedPostgres from 'embedded-postgres'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret'

const { createPool } = await import('../src/db.js')
const { migrate } = await import('../src/migrate.js')
const { createApp } = await import('../src/app.js')
const { seedBase, seedDemo } = await import('../src/seed.js')
const { estadoPorPuntaje, calcularResultado } = await import('../src/lib/semaforo.js')
const { normalizar } = await import('../src/lib/diccionario.js')

let pg, pool, server, base, dir
const llamadasExternas = []
const externo = async (p) => {
  llamadasExternas.push(p)
  if (p === 'zzzz') return null
  if (p === 'roto') throw new Error('RAE caída')
  return { significado: 'Definición externa de ' + p }
}

async function api(metodo, ruta, { token, body } = {}) {
  const res = await fetch(base + ruta, {
    method: metodo,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const texto = await res.text()
  return { status: res.status, data: texto ? JSON.parse(texto) : null }
}
const login = async (email) =>
  (await api('POST', '/api/auth/login', { body: { email, password: 'lectur1234' } })).data.token

before(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'lectur-pg-'))
  pg = new EmbeddedPostgres({
    databaseDir: dir,
    user: 'postgres',
    password: 'postgres',
    port: 54329,
    persistent: false,
  })
  await pg.initialise()
  await pg.start()
  await pg.createDatabase('lectur_test')
  pool = createPool('postgres://postgres:postgres@localhost:54329/lectur_test')
  await migrate(pool)
  await seedBase(pool)
  await seedDemo(pool)
  const app = createApp({ pool, buscarExterno: externo, usarExterno: true })
  await new Promise((r) => (server = app.listen(0, r)))
  base = `http://localhost:${server.address().port}`
})

after(async () => {
  server?.close()
  await pool?.end()
  await pg?.stop()
  rmSync(dir, { recursive: true, force: true })
})

test('semáforo: umbrales de la demo', () => {
  assert.equal(estadoPorPuntaje(10), 'verde')
  assert.equal(estadoPorPuntaje(7), 'verde')
  assert.equal(estadoPorPuntaje(6.9), 'amarillo')
  assert.equal(estadoPorPuntaje(4), 'amarillo')
  assert.equal(estadoPorPuntaje(3.9), 'rojo')
  assert.equal(estadoPorPuntaje(null), null)
})

test('corrección: puntaje y literal/inferencial', () => {
  const preg = [
    { id: 1, tipo: 'literal', correcta: 0 },
    { id: 2, tipo: 'inferencial', correcta: 1 },
    { id: 3, tipo: 'inferencial', correcta: 2 },
  ]
  const r = calcularResultado(preg, [
    { preguntaId: 1, opcion: 0 },
    { preguntaId: 2, opcion: 1 },
    { preguntaId: 3, opcion: 0 },
  ])
  assert.equal(r.correctas, 2)
  assert.equal(r.puntaje, 6.7)
  assert.equal(r.literalCompleto, true)
  assert.equal(r.inferencialCompleto, false)
})

test('normalizar conserva la ñ y saca tildes', () => {
  assert.equal(normalizar('  Cañón '), 'cañon')
  assert.equal(normalizar('Árbol'), 'arbol')
})

test('login: credenciales y rutas por rol', async () => {
  assert.equal(
    (await api('POST', '/api/auth/login', { body: { email: 'mateo@lectur.test', password: 'mal' } })).status,
    401,
  )
  assert.equal((await api('GET', '/api/textos')).status, 401)
  const alumno = await login('mateo@lectur.test')
  const docente = await login('docente@lectur.test')
  assert.equal((await api('GET', '/api/textos', { token: alumno })).status, 403)
  assert.equal((await api('GET', '/api/alumno/actividades', { token: docente })).status, 403)
  assert.equal((await api('GET', '/api/auth/me', { token: alumno })).data.usuario.rol, 'alumno')
})

test('flujo completo: texto propio, asignación, cuestionario, semáforo y nota', async () => {
  const docente = await login('docente@lectur.test')
  const mateo = await login('mateo@lectur.test')
  const sofia = await login('sofia@lectur.test')

  const semaforo0 = await api('GET', '/api/docente/semaforo', { token: docente })
  assert.equal(semaforo0.data.alumnos.length, 3)
  assert.ok(semaforo0.data.alumnos.every((a) => a.estado === null))

  // Texto propio con preguntas
  const nuevo = await api('POST', '/api/textos', {
    token: docente,
    body: {
      titulo: 'Mi texto propio',
      cuerpo: 'Este es un texto escrito por la docente para practicar la lectura en clase.',
      preguntas: [
        {
          enunciado: '¿Quién escribió el texto?',
          tipo: 'literal',
          opciones: ['La docente', 'Un alumno'],
          correcta: 0,
        },
        {
          enunciado: '¿Para qué sirve?',
          tipo: 'inferencial',
          opciones: ['Para practicar', 'Para dormir'],
          correcta: 0,
        },
      ],
    },
  })
  assert.equal(nuevo.status, 201)
  const propioId = nuevo.data.id

  const lista = (await api('GET', '/api/textos', { token: docente })).data.textos
  assert.ok(lista.some((t) => t.id === propioId && t.propio))
  assert.ok(lista.some((t) => !t.propio))

  // El texto propio es privado: otra docente no lo ve
  const otra = await api('POST', '/api/auth/registro-docente', {
    body: { nombre: 'Otra Docente', email: 'otra@lectur.test', password: 'clavesegura1' },
  })
  assert.equal((await api('GET', `/api/textos/${propioId}`, { token: otra.data.token })).status, 404)
  assert.ok(
    !(await api('GET', '/api/textos', { token: otra.data.token })).data.textos.some((t) => t.id === propioId),
  )

  // Asignaciones: Mateo con cuestionario, Sofía sin
  const ids = semaforo0.data.alumnos.reduce((m, a) => ({ ...m, [a.nombre]: a.id }), {})
  assert.equal(
    (
      await api('POST', '/api/docente/asignaciones', {
        token: docente,
        body: { textoId: propioId, alumnoIds: [ids['Mateo Pérez']], conCuestionario: true },
      })
    ).status,
    201,
  )
  assert.equal(
    (
      await api('POST', '/api/docente/asignaciones', {
        token: docente,
        body: { textoId: propioId, alumnoIds: [ids['Sofía Ruiz']], conCuestionario: false },
      })
    ).status,
    201,
  )
  // Texto sin preguntas no puede ir con cuestionario
  const sinPreg = await api('POST', '/api/textos', {
    token: docente,
    body: { titulo: 'Sin preguntas', cuerpo: 'Un texto sin preguntas para leer con tranquilidad en casa.' },
  })
  assert.equal(
    (
      await api('POST', '/api/docente/asignaciones', {
        token: docente,
        body: { textoId: sinPreg.data.id, alumnoIds: [ids['Mateo Pérez']], conCuestionario: true },
      })
    ).status,
    400,
  )

  // Vista del alumno: no se filtra `correcta`
  const acts = (await api('GET', '/api/alumno/actividades', { token: mateo })).data.actividades
  assert.equal(acts.length, 1)
  const detalle = await api('GET', `/api/alumno/actividades/${acts[0].id}`, { token: mateo })
  assert.equal(detalle.data.preguntas.length, 2)
  assert.ok(detalle.data.preguntas.every((p) => !('correcta' in p)))

  // Un alumno no accede a la actividad de otro
  assert.equal((await api('GET', `/api/alumno/actividades/${acts[0].id}`, { token: sofia })).status, 404)

  // Respuestas incompletas -> 400; correctas a medias -> 5 (amarillo)
  const [p1, p2] = detalle.data.preguntas
  assert.equal(
    (
      await api('POST', `/api/alumno/actividades/${acts[0].id}/completar`, {
        token: mateo,
        body: { respuestas: [{ preguntaId: p1.id, opcion: 0 }] },
      })
    ).status,
    400,
  )
  const fin = await api('POST', `/api/alumno/actividades/${acts[0].id}/completar`, {
    token: mateo,
    body: {
      respuestas: [
        { preguntaId: p1.id, opcion: 0 },
        { preguntaId: p2.id, opcion: 1 },
      ],
    },
  })
  assert.equal(fin.status, 200)
  assert.deepEqual(fin.data.aciertos, { correctas: 1, total: 2 })
  assert.ok(!('puntaje' in fin.data))
  assert.equal(
    (
      await api('POST', `/api/alumno/actividades/${acts[0].id}/completar`, {
        token: mateo,
        body: { respuestas: [] },
      })
    ).status,
    409,
  )

  // Sofía completa sin cuestionario
  const actS = (await api('GET', '/api/alumno/actividades', { token: sofia })).data.actividades[0]
  assert.equal(
    (await api('POST', `/api/alumno/actividades/${actS.id}/completar`, { token: sofia, body: {} })).data
      .aciertos,
    null,
  )

  // Semáforo docente
  const sem = (await api('GET', '/api/docente/semaforo', { token: docente })).data.alumnos
  const m = sem.find((a) => a.nombre === 'Mateo Pérez')
  assert.equal(m.estado, 'amarillo')
  assert.equal(m.ultimo.puntaje, 5)
  assert.equal(m.ultimo.literalCompleto, true)
  assert.equal(m.ultimo.inferencialCompleto, false)
  assert.equal(sem.find((a) => a.nombre === 'Sofía Ruiz').estado, null) // "Sin eval."

  // Notas: crear, editar, borrar; no a alumnos ajenos
  const notaUrl = `/api/docente/alumnos/${ids['Mateo Pérez']}/nota`
  assert.equal(
    (await api('PUT', notaUrl, { token: docente, body: { texto: 'Practicar inferencias' } })).data.nota,
    'Practicar inferencias',
  )
  assert.equal(
    (await api('GET', '/api/docente/semaforo', { token: docente })).data.alumnos.find(
      (a) => a.id === ids['Mateo Pérez'],
    ).nota,
    'Practicar inferencias',
  )
  assert.equal((await api('PUT', notaUrl, { token: docente, body: { texto: '' } })).data.nota, null)
  assert.equal((await api('PUT', notaUrl, { token: otra.data.token, body: { texto: 'x' } })).status, 404)

  // Texto asignado no se puede borrar
  assert.equal((await api('DELETE', `/api/textos/${propioId}`, { token: docente })).status, 409)
  assert.equal((await api('DELETE', `/api/textos/${sinPreg.data.id}`, { token: docente })).status, 204)
})

test('diccionario: base propia, externo con caché y fallos', async () => {
  const token = await login('mateo@lectur.test')
  const propia = await api('GET', '/api/diccionario?palabra=Paraguas', { token })
  assert.equal(propia.data.fuente, 'propia')
  assert.equal(llamadasExternas.length, 0)

  const ext = await api('GET', '/api/diccionario?palabra=montaña', { token })
  assert.equal(ext.data.fuente, 'externa')
  await api('GET', '/api/diccionario?palabra=montaña', { token })
  assert.equal(llamadasExternas.filter((p) => p === 'montaña').length, 1) // cacheada

  assert.equal((await api('GET', '/api/diccionario?palabra=zzzz', { token })).status, 404)
  assert.equal((await api('GET', '/api/diccionario?palabra=roto', { token })).status, 404) // falla externa => no encontrada
  assert.equal((await api('GET', '/api/diccionario?palabra=dos palabras', { token })).status, 400)
  assert.equal((await api('GET', '/api/diccionario', { token })).status, 400)
  assert.equal((await api('GET', '/api/diccionario?palabra=casa')).status, 401)
})
