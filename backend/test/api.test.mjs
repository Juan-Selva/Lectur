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

  const ext = await api('GET', '/api/diccionario?palabra=tehuelche', { token })
  assert.equal(ext.data.fuente, 'externa')
  await api('GET', '/api/diccionario?palabra=tehuelche', { token })
  assert.equal(llamadasExternas.filter((p) => p === 'tehuelche').length, 1) // cacheada

  assert.equal((await api('GET', '/api/diccionario?palabra=zzzz', { token })).status, 404)
  assert.equal((await api('GET', '/api/diccionario?palabra=roto', { token })).status, 404) // falla externa => no encontrada
  assert.equal((await api('GET', '/api/diccionario?palabra=dos palabras', { token })).status, 400)
  assert.equal((await api('GET', '/api/diccionario', { token })).status, 400)
  assert.equal((await api('GET', '/api/diccionario?palabra=casa')).status, 401)
})

// ---------- Ampliación: gestión de alumnos, edición, historial, palabras, resumen, categorías ----------

const alumnosDe = async (token) => (await api('GET', '/api/docente/semaforo', { token })).data.alumnos
const idDe = async (token, nombre) => (await alumnosDe(token)).find((a) => a.nombre === nombre).id
const textoBase = (extra = {}) => ({
  titulo: 'Texto de prueba',
  cuerpo: 'Un texto de prueba suficientemente largo para pasar la validación.',
  preguntas: [{ enunciado: '¿Pregunta uno?', tipo: 'literal', opciones: ['a', 'b'], correcta: 1 }],
  ...extra,
})

test('categorías: textos precargados (incluida biografía) y texto propio', async () => {
  const docente = await login('docente@lectur.test')
  const textos = (await api('GET', '/api/textos', { token: docente })).data.textos
  const messi = textos.find((t) => t.titulo.startsWith('Lionel Messi'))
  assert.equal(messi.categoria, 'biografia')
  const bios = textos.filter((x) => !x.propio && x.categoria === 'biografia')
  assert.ok(bios.length >= 7)
  for (const n of ['Maradona', 'Kempes', 'Dibu', 'Di María', 'Pelé'])
    assert.ok(
      bios.some((x) => x.titulo.includes(n)),
      n,
    )
  const cats = new Set(textos.filter((t) => !t.propio).map((t) => t.categoria))
  for (const c of ['ficcion', 'historia', 'deporte', 'ciencia', 'naturaleza', 'biografia'])
    assert.ok(cats.has(c), c)

  const mal = await api('POST', '/api/textos', { token: docente, body: textoBase({ categoria: 'magia' }) })
  assert.equal(mal.status, 400)
  const ok = await api('POST', '/api/textos', { token: docente, body: textoBase({ categoria: 'deporte' }) })
  assert.equal(ok.status, 201)
  assert.equal(
    (await api('GET', `/api/textos/${ok.data.id}`, { token: docente })).data.texto.categoria,
    'deporte',
  )
})

test('editar texto propio: libre sin respuestas; preguntas bloqueadas con resultados; ajeno prohibido', async () => {
  const docente = await login('docente@lectur.test')
  const mateo = await login('mateo@lectur.test')
  const id = (await api('POST', '/api/textos', { token: docente, body: textoBase({ titulo: 'Editable' }) }))
    .data.id

  // Sin respuestas: se puede cambiar todo, incluidas las preguntas
  const nuevo = textoBase({
    titulo: 'Editable v2',
    categoria: 'ciencia',
    preguntas: [
      { enunciado: '¿Otra?', tipo: 'inferencial', opciones: ['x', 'y', 'z'], correcta: 2 },
      { enunciado: '¿Y otra más?', tipo: 'literal', opciones: ['x', 'y'], correcta: 0 },
    ],
  })
  assert.equal((await api('PUT', `/api/textos/${id}`, { token: docente, body: nuevo })).status, 200)
  const det = (await api('GET', `/api/textos/${id}`, { token: docente })).data
  assert.equal(det.texto.titulo, 'Editable v2')
  assert.equal(det.preguntas.length, 2)

  // Un alumno lo responde
  const mateoId = await idDe(docente, 'Mateo Pérez')
  await api('POST', '/api/docente/asignaciones', {
    token: docente,
    body: { textoId: id, alumnoIds: [mateoId], conCuestionario: true },
  })
  const act = (await api('GET', '/api/alumno/actividades', { token: mateo })).data.actividades.find(
    (a) => a.titulo === 'Editable v2',
  )
  const pr = (await api('GET', `/api/alumno/actividades/${act.id}`, { token: mateo })).data.preguntas
  await api('POST', `/api/alumno/actividades/${act.id}/completar`, {
    token: mateo,
    body: { respuestas: pr.map((p) => ({ preguntaId: p.id, opcion: 0 })) },
  })

  // Con resultados: el título se puede cambiar, las preguntas no
  assert.equal(
    (await api('PUT', `/api/textos/${id}`, { token: docente, body: { ...nuevo, titulo: 'Editable v3' } }))
      .status,
    200,
  )
  const cambiadas = { ...nuevo, preguntas: [nuevo.preguntas[0]] }
  assert.equal((await api('PUT', `/api/textos/${id}`, { token: docente, body: cambiadas })).status, 409)

  // Precargado o ajeno
  const pre = (await api('GET', '/api/textos', { token: docente })).data.textos.find((t) => !t.propio)
  assert.equal((await api('PUT', `/api/textos/${pre.id}`, { token: docente, body: nuevo })).status, 403)
  const otra = (
    await api('POST', '/api/auth/login', { body: { email: 'otra@lectur.test', password: 'clavesegura1' } })
  ).data.token
  assert.equal((await api('PUT', `/api/textos/${id}`, { token: otra, body: nuevo })).status, 403)
})

test('historial con detalle por pregunta (docente) y propio sin respuestas correctas (alumno)', async () => {
  const docente = await login('docente@lectur.test')
  const mateo = await login('mateo@lectur.test')
  const mateoId = await idDe(docente, 'Mateo Pérez')

  const h = (await api('GET', `/api/docente/alumnos/${mateoId}/historial`, { token: docente })).data
  const conRes = h.actividades.find((a) => a.texto.titulo === 'Mi texto propio')
  assert.equal(conRes.estado, 'completada')
  assert.equal(conRes.resultado.puntaje, 5)
  assert.equal(conRes.resultado.estado, 'amarillo')
  const fallo = conRes.resultado.preguntas.find((p) => !p.acierto)
  assert.equal(fallo.tipo, 'inferencial')
  assert.equal(fallo.elegida, 1)
  assert.equal(fallo.correcta, 0)

  const propio = (await api('GET', '/api/alumno/historial', { token: mateo })).data.historial
  const item = propio.find((x) => x.titulo === 'Mi texto propio')
  assert.deepEqual(item.aciertos, { correctas: 1, total: 2 })
  assert.equal(item.preguntas.filter((p) => p.acierto).length, 1)
  assert.ok(item.preguntas.every((p) => !('correcta' in p) && !('opciones' in p)))

  // Un docente no ve alumnos de otro
  const otra = (
    await api('POST', '/api/auth/login', { body: { email: 'otra@lectur.test', password: 'clavesegura1' } })
  ).data.token
  assert.equal((await api('GET', `/api/docente/alumnos/${mateoId}/historial`, { token: otra })).status, 404)
  assert.equal((await api('GET', '/api/alumno/historial', { token: docente })).status, 403)
})

test('cancelar y reasignar actividades pendientes', async () => {
  const docente = await login('docente@lectur.test')
  const sofia = await login('sofia@lectur.test')
  const lucas = await login('lucas@lectur.test')
  const [sofiaId, lucasId] = [await idDe(docente, 'Sofía Ruiz'), await idDe(docente, 'Lucas Díaz')]
  const textoId = (
    await api('POST', '/api/textos', { token: docente, body: textoBase({ titulo: 'Para reasignar' }) })
  ).data.id
  await api('POST', '/api/docente/asignaciones', {
    token: docente,
    body: { textoId, alumnoIds: [sofiaId], conCuestionario: true },
  })
  const act = (await api('GET', '/api/alumno/actividades', { token: sofia })).data.actividades.find(
    (a) => a.titulo === 'Para reasignar',
  )

  // Reasignar a Lucas y quitar el cuestionario
  const p = await api('PATCH', `/api/docente/asignaciones/${act.id}`, {
    token: docente,
    body: { alumnoId: lucasId, conCuestionario: false },
  })
  assert.equal(p.status, 200)
  assert.ok(
    !(await api('GET', '/api/alumno/actividades', { token: sofia })).data.actividades.some(
      (a) => a.titulo === 'Para reasignar',
    ),
  )
  const deLucas = (await api('GET', '/api/alumno/actividades', { token: lucas })).data.actividades.find(
    (a) => a.titulo === 'Para reasignar',
  )
  assert.equal(deLucas.conCuestionario, false)

  assert.equal(
    (await api('PATCH', `/api/docente/asignaciones/${act.id}`, { token: docente, body: {} })).status,
    400,
  )

  // Cancelar: desaparece para el alumno y ya no se puede abrir
  assert.equal((await api('DELETE', `/api/docente/asignaciones/${act.id}`, { token: docente })).status, 204)
  assert.ok(
    !(await api('GET', '/api/alumno/actividades', { token: lucas })).data.actividades.some(
      (a) => a.id === act.id,
    ),
  )
  assert.equal((await api('GET', `/api/alumno/actividades/${act.id}`, { token: lucas })).status, 404)
  assert.equal((await api('DELETE', `/api/docente/asignaciones/${act.id}`, { token: docente })).status, 404)

  // Una actividad completada no se cancela ni se reasigna
  const sofiaAct = (await api('GET', '/api/alumno/actividades', { token: sofia })).data.actividades.find(
    (a) => a.estado === 'completada',
  )
  assert.equal(
    (await api('DELETE', `/api/docente/asignaciones/${sofiaAct.id}`, { token: docente })).status,
    404,
  )
  assert.equal(
    (
      await api('PATCH', `/api/docente/asignaciones/${sofiaAct.id}`, {
        token: docente,
        body: { alumnoId: lucasId },
      })
    ).status,
    409,
  )
})

test('palabras consultadas y resumen para familias', async () => {
  const docente = await login('docente@lectur.test')
  const mateoId = await idDe(docente, 'Mateo Pérez')

  const palabras = (await api('GET', `/api/docente/alumnos/${mateoId}/palabras`, { token: docente })).data
    .palabras
  const tehuelche = palabras.find((p) => p.palabra === 'tehuelche')
  assert.equal(tehuelche.veces, 2)
  assert.equal(palabras.find((p) => p.palabra === 'zzzz').encontrada, false)
  // el docente no genera consultas propias
  assert.ok(
    (await api('GET', '/api/docente/palabras', { token: docente })).data.palabras.some(
      (p) => p.palabra === 'tehuelche',
    ),
  )

  const r = (await api('GET', `/api/docente/alumnos/${mateoId}/resumen`, { token: docente })).data
  assert.equal(r.alumno.nombre, 'Mateo Pérez')
  assert.equal(r.conCuestionario >= 1, true)
  assert.equal(r.estado, r.promedio >= 7 ? 'verde' : r.promedio >= 4 ? 'amarillo' : 'rojo')
  assert.equal(r.porTipo.literal.total > 0, true)
  assert.ok(r.fortalezas.includes('Busca en el diccionario las palabras que no conoce.'))
  assert.ok(Array.isArray(r.sugerencias) && r.sugerencias.length > 0)
  assert.ok(r.palabras.top.length > 0)
})

test('gestión de alumnos: editar, cambiar contraseña y borrar', async () => {
  const docente = await login('docente@lectur.test')
  const nuevo = await api('POST', '/api/docente/alumnos', {
    token: docente,
    body: { nombre: 'Para Borrar', email: 'borrar@lectur.test', password: 'clavecorta1', grado: 1 },
  })
  const id = nuevo.data.alumno.id

  const ed = await api('PUT', `/api/docente/alumnos/${id}`, {
    token: docente,
    body: { nombre: 'Nombre Nuevo', email: 'nuevo@lectur.test', grado: 3 },
  })
  assert.equal(ed.data.alumno.nombre, 'Nombre Nuevo')
  assert.equal(
    (
      await api('PUT', `/api/docente/alumnos/${id}`, {
        token: docente,
        body: { nombre: 'X Y', email: 'mateo@lectur.test', grado: 3 },
      })
    ).status,
    409,
  )

  assert.equal(
    (await api('PUT', `/api/docente/alumnos/${id}/password`, { token: docente, body: { password: 'corta' } }))
      .status,
    400,
  )
  assert.equal(
    (
      await api('PUT', `/api/docente/alumnos/${id}/password`, {
        token: docente,
        body: { password: 'claveNueva99' },
      })
    ).status,
    204,
  )
  assert.equal(
    (await api('POST', '/api/auth/login', { body: { email: 'nuevo@lectur.test', password: 'clavecorta1' } }))
      .status,
    401,
  )
  assert.equal(
    (await api('POST', '/api/auth/login', { body: { email: 'nuevo@lectur.test', password: 'claveNueva99' } }))
      .status,
    200,
  )

  const otra = (
    await api('POST', '/api/auth/login', { body: { email: 'otra@lectur.test', password: 'clavesegura1' } })
  ).data.token
  assert.equal((await api('DELETE', `/api/docente/alumnos/${id}`, { token: otra })).status, 404)
  assert.equal((await api('DELETE', `/api/docente/alumnos/${id}`, { token: docente })).status, 204)
  assert.equal(
    (await api('POST', '/api/auth/login', { body: { email: 'nuevo@lectur.test', password: 'claveNueva99' } }))
      .status,
    401,
  )
  assert.ok(!(await alumnosDe(docente)).some((a) => a.id === id))

  // Borrar un alumno con resultados limpia todo en cascada
  const lucasId = await idDe(docente, 'Lucas Díaz')
  assert.equal((await api('DELETE', `/api/docente/alumnos/${lucasId}`, { token: docente })).status, 204)
})

test('observaciones del resumen', async () => {
  const { armarObservaciones } = await import('../src/lib/resumen.js')
  const vacio = armarObservaciones({
    literal: { correctas: 0, total: 0 },
    inferencial: { correctas: 0, total: 0 },
    palabrasConsultadas: 0,
    lecturasConCuestionario: 0,
  })
  assert.equal(vacio.fortalezas.length, 0)
  assert.equal(vacio.sugerencias.length, 1)
  const fuerte = armarObservaciones({
    literal: { correctas: 4, total: 5 },
    inferencial: { correctas: 1, total: 4 },
    palabrasConsultadas: 1,
    lecturasConCuestionario: 2,
  })
  assert.equal(fuerte.fortalezas.length, 1)
  assert.equal(fuerte.sugerencias.length, 1)
})

// ---------- Cursos ----------

test('cursos: crear, listar, editar, duplicados, ajenos y borrado', async () => {
  const docente = await login('docente@lectur.test')
  const otra = (
    await api('POST', '/api/auth/login', { body: { email: 'otra@lectur.test', password: 'clavesegura1' } })
  ).data.token

  const lista = (await api('GET', '/api/cursos', { token: docente })).data.cursos
  const a = lista.find((c) => c.nombre === '2.° A')
  assert.equal(a.grado, 2)
  assert.equal(a.alumnos, 2)
  assert.equal((await api('GET', '/api/cursos', { token: otra })).data.cursos.length, 0)

  const nuevo = await api('POST', '/api/cursos', { token: docente, body: { nombre: '1.° C', grado: 1 } })
  assert.equal(nuevo.status, 201)
  assert.equal(
    (await api('POST', '/api/cursos', { token: docente, body: { nombre: '1.° C', grado: 1 } })).status,
    409,
  )
  assert.equal(
    (await api('POST', '/api/cursos', { token: docente, body: { nombre: '', grado: 1 } })).status,
    400,
  )
  assert.equal(
    (await api('POST', '/api/cursos', { token: docente, body: { nombre: 'X', grado: 4 } })).status,
    400,
  )
  // otro docente puede usar el mismo nombre
  assert.equal(
    (await api('POST', '/api/cursos', { token: otra, body: { nombre: '1.° C', grado: 1 } })).status,
    201,
  )

  const id = nuevo.data.curso.id
  assert.equal(
    (await api('PUT', `/api/cursos/${id}`, { token: docente, body: { nombre: '1.° D', grado: 1 } })).data
      .curso.nombre,
    '1.° D',
  )
  assert.equal(
    (await api('PUT', `/api/cursos/${id}`, { token: otra, body: { nombre: 'Robado', grado: 1 } })).status,
    404,
  )
  assert.equal(
    (await api('PUT', `/api/cursos/${id}`, { token: docente, body: { nombre: '2.° A', grado: 1 } })).status,
    409,
  )

  assert.equal((await api('DELETE', `/api/cursos/${a.id}`, { token: docente })).status, 409) // tiene alumnos
  assert.equal((await api('DELETE', `/api/cursos/${id}`, { token: otra })).status, 404)
  assert.equal((await api('DELETE', `/api/cursos/${id}`, { token: docente })).status, 204)
  assert.equal((await api('GET', '/api/cursos', { token: await login('mateo@lectur.test') })).status, 403)
})

test('cursos: alumnos con curso, mover de curso y filtro del semáforo', async () => {
  const docente = await login('docente@lectur.test')
  const otra = (
    await api('POST', '/api/auth/login', { body: { email: 'otra@lectur.test', password: 'clavesegura1' } })
  ).data.token
  const cursos = (await api('GET', '/api/cursos', { token: docente })).data.cursos
  const a = cursos.find((c) => c.nombre === '2.° A')
  const nuevoCurso = (
    await api('POST', '/api/cursos', { token: docente, body: { nombre: '3.° Z', grado: 3 } })
  ).data.curso

  // Crear con curso: el grado sale del curso
  const alta = await api('POST', '/api/docente/alumnos', {
    token: docente,
    body: {
      nombre: 'Con Curso',
      email: 'concurso@lectur.test',
      password: 'clavecorta1',
      cursoId: nuevoCurso.id,
    },
  })
  assert.equal(alta.status, 201)
  assert.equal(alta.data.alumno.grado, '3')
  assert.equal(alta.data.alumno.cursoId, nuevoCurso.id)
  // Sin curso ni grado, o con un curso ajeno
  assert.equal(
    (
      await api('POST', '/api/docente/alumnos', {
        token: docente,
        body: { nombre: 'Sin Curso', email: 'sc@lectur.test', password: 'clavecorta1' },
      })
    ).status,
    400,
  )
  assert.equal(
    (
      await api('POST', '/api/docente/alumnos', {
        token: otra,
        body: { nombre: 'Ajeno', email: 'aj@lectur.test', password: 'clavecorta1', cursoId: nuevoCurso.id },
      })
    ).status,
    404,
  )

  // Filtro del semáforo
  const todos = (await api('GET', '/api/docente/semaforo', { token: docente })).data.alumnos
  const deA = (await api('GET', `/api/docente/semaforo?cursoId=${a.id}`, { token: docente })).data.alumnos
  assert.deepEqual(deA.map((x) => x.nombre).sort(), ['Mateo Pérez', 'Sofía Ruiz'])
  assert.ok(deA.every((x) => x.curso === '2.° A' && x.cursoId === a.id))
  assert.ok(todos.length > deA.length)
  assert.equal((await api('GET', '/api/docente/semaforo?cursoId=abc', { token: docente })).status, 400)
  assert.equal((await api('GET', `/api/docente/semaforo?cursoId=${a.id}`, { token: otra })).status, 404)

  // Mover de curso (edición): el grado cambia con el curso
  const id = alta.data.alumno.id
  const mov = await api('PUT', `/api/docente/alumnos/${id}`, {
    token: docente,
    body: { nombre: 'Con Curso', email: 'concurso@lectur.test', cursoId: a.id },
  })
  assert.equal(mov.data.alumno.grado, '2')
  assert.equal(
    (await api('GET', `/api/docente/semaforo?cursoId=${a.id}`, { token: docente })).data.alumnos.length,
    3,
  )
  assert.equal(
    (await api('GET', `/api/docente/semaforo?cursoId=${nuevoCurso.id}`, { token: docente })).data.alumnos
      .length,
    0,
  )
  // Editar sin tocar el curso lo conserva
  const igual = await api('PUT', `/api/docente/alumnos/${id}`, {
    token: docente,
    body: { nombre: 'Con Curso 2', email: 'concurso@lectur.test' },
  })
  assert.equal(igual.data.alumno.cursoId, a.id)
  assert.equal(
    (await api('GET', `/api/docente/alumnos/${id}`, { token: docente })).data.alumno.curso,
    '2.° A',
  )

  // Cambiar el grado del curso actualiza el de sus alumnos
  await api('PUT', `/api/cursos/${a.id}`, { token: docente, body: { nombre: '2.° A', grado: 3 } })
  assert.equal((await api('GET', `/api/docente/alumnos/${id}`, { token: docente })).data.alumno.grado, '3')
  await api('PUT', `/api/cursos/${a.id}`, { token: docente, body: { nombre: '2.° A', grado: 2 } })

  // Borrar un curso vacío
  assert.equal((await api('DELETE', `/api/cursos/${nuevoCurso.id}`, { token: docente })).status, 204)
})

test('cursos: asignar a un curso completo y filtro de palabras', async () => {
  const docente = await login('docente@lectur.test')
  const mateo = await login('mateo@lectur.test')
  const cursos = (await api('GET', '/api/cursos', { token: docente })).data.cursos
  const a = cursos.find((c) => c.nombre === '2.° A')
  const vacio = (await api('POST', '/api/cursos', { token: docente, body: { nombre: 'Vacío', grado: 1 } }))
    .data.curso
  const textoId = (
    await api('POST', '/api/textos', { token: docente, body: textoBase({ titulo: 'Para todo el curso' }) })
  ).data.id

  assert.equal(
    (
      await api('POST', '/api/docente/asignaciones', {
        token: docente,
        body: { textoId, cursoId: vacio.id, conCuestionario: false },
      })
    ).status,
    400,
  )
  assert.equal(
    (
      await api('POST', '/api/docente/asignaciones', {
        token: docente,
        body: { textoId, conCuestionario: false },
      })
    ).status,
    400,
  )
  const ok = await api('POST', '/api/docente/asignaciones', {
    token: docente,
    body: { textoId, cursoId: a.id, conCuestionario: true },
  })
  assert.equal(ok.status, 201)
  const miembros = (await api('GET', `/api/docente/semaforo?cursoId=${a.id}`, { token: docente })).data
    .alumnos.length
  assert.equal(ok.data.asignadas, miembros)
  assert.ok(
    (await api('GET', '/api/alumno/actividades', { token: mateo })).data.actividades.some(
      (x) => x.titulo === 'Para todo el curso',
    ),
  )

  // Alumnos sueltos + curso no duplican
  const dup = await api('POST', '/api/docente/asignaciones', {
    token: docente,
    body: { textoId, cursoId: a.id, alumnoIds: [await idDe(docente, 'Mateo Pérez')], conCuestionario: false },
  })
  assert.equal(dup.data.asignadas, miembros)

  // Palabras filtradas por curso
  const deA = (await api('GET', `/api/docente/palabras?cursoId=${a.id}`, { token: docente })).data.palabras
  assert.ok(deA.some((p) => p.palabra === 'tehuelche'))
  assert.equal(
    (await api('GET', `/api/docente/palabras?cursoId=${vacio.id}`, { token: docente })).data.palabras.length,
    0,
  )
  assert.equal((await api('DELETE', `/api/cursos/${vacio.id}`, { token: docente })).status, 204)
})

// ---------- Importación masiva de alumnos ----------

test('importar alumnos: vista previa, validaciones y confirmación', async () => {
  const docente = await login('docente@lectur.test')
  const otra = (
    await api('POST', '/api/auth/login', { body: { email: 'otra@lectur.test', password: 'clavesegura1' } })
  ).data.token
  const mateo = await login('mateo@lectur.test')
  const curso = (
    await api('POST', '/api/cursos', { token: docente, body: { nombre: 'Importados', grado: 1 } })
  ).data.curso
  const otroCurso = (
    await api('POST', '/api/cursos', { token: docente, body: { nombre: '3.° Q', grado: 3 } })
  ).data.curso

  const filas = [
    { nombre: 'Ana Gómez', email: 'ana.import@lectur.test', curso: '', password: '' }, // curso por defecto, clave generada
    { nombre: 'Beto Ruiz', email: 'BETO.import@lectur.test', curso: '3.° q', password: 'clavepropia1' }, // curso por nombre (sin distinguir mayúsculas)
    { nombre: 'Ana Repetida', email: 'ana.import@lectur.test' }, // repetido en el archivo
    { nombre: 'Mateo Otra Vez', email: 'mateo@lectur.test' }, // ya existe en la base
    { nombre: 'X', email: 'no-es-email' }, // nombre corto y email inválido
    { nombre: 'Curso Raro', email: 'raro.import@lectur.test', curso: 'Inexistente' },
    { nombre: 'Clave Corta', email: 'corta.import@lectur.test', password: '123' },
    { nombre: 'Sin Email', email: '' },
  ]

  // Vista previa: no crea nada
  const prev = await api('POST', '/api/docente/alumnos/importar', {
    token: docente,
    body: { cursoId: curso.id, filas },
  })
  assert.equal(prev.status, 200)
  assert.equal(prev.data.validas, 2)
  assert.equal(prev.data.conErrores, 6)
  const porIndice = (i) => prev.data.filas.find((f) => f.indice === i)
  assert.equal(porIndice(0).estado, 'ok')
  assert.equal(porIndice(0).curso, 'Importados')
  assert.equal(porIndice(1).curso, '3.° Q')
  assert.match(porIndice(2).errores.join(), /repetido en el archivo/)
  assert.match(porIndice(3).errores.join(), /Ya existe/)
  assert.ok(porIndice(4).errores.length >= 2)
  assert.match(porIndice(5).errores.join(), /no existe/)
  assert.match(porIndice(6).errores.join(), /8 caracteres/)
  assert.match(porIndice(7).errores.join(), /Falta el email/)
  assert.equal(
    (await api('POST', '/api/auth/login', { body: { email: 'ana.import@lectur.test', password: 'x' } }))
      .status,
    401,
  )
  assert.equal(
    (await api('GET', `/api/docente/semaforo?cursoId=${curso.id}`, { token: docente })).data.alumnos.length,
    0,
  )

  // Sin curso por defecto, las filas sin curso fallan
  const sinDefecto = await api('POST', '/api/docente/alumnos/importar', {
    token: docente,
    body: { filas: [filas[0]] },
  })
  assert.match(sinDefecto.data.filas[0].errores.join(), /Falta el curso/)

  // Confirmar: crea solo las válidas
  const conf = await api('POST', '/api/docente/alumnos/importar', {
    token: docente,
    body: { cursoId: curso.id, filas, confirmar: true },
  })
  assert.equal(conf.status, 201)
  assert.equal(conf.data.creados.length, 2)
  assert.equal(conf.data.omitidas, 6)
  const ana = conf.data.creados.find((c) => c.email === 'ana.import@lectur.test')
  const beto = conf.data.creados.find((c) => c.email === 'beto.import@lectur.test')
  assert.equal(ana.password.length, 8) // generada
  assert.equal(beto.password, null) // la puso el docente

  // Las cuentas funcionan, con el curso y grado correctos
  assert.equal(
    (
      await api('POST', '/api/auth/login', {
        body: { email: 'ana.import@lectur.test', password: ana.password },
      })
    ).status,
    200,
  )
  assert.equal(
    (
      await api('POST', '/api/auth/login', {
        body: { email: 'beto.import@lectur.test', password: 'clavepropia1' },
      })
    ).status,
    200,
  )
  const sem = (await api('GET', '/api/docente/semaforo', { token: docente })).data.alumnos
  assert.equal(sem.find((a) => a.nombre === 'Ana Gómez').curso, 'Importados')
  assert.equal(sem.find((a) => a.nombre === 'Beto Ruiz').grado, '3')

  // Importar de nuevo el mismo archivo: todo falla por emails existentes y no crea nada
  const otraVez = await api('POST', '/api/docente/alumnos/importar', {
    token: docente,
    body: { cursoId: curso.id, filas: filas.slice(0, 2), confirmar: true },
  })
  assert.equal(otraVez.data.creados.length, 0)

  // Permisos y límites
  assert.equal(
    (
      await api('POST', '/api/docente/alumnos/importar', {
        token: otra,
        body: { cursoId: curso.id, filas: [filas[0]] },
      })
    ).status,
    404,
  )
  assert.equal(
    (await api('POST', '/api/docente/alumnos/importar', { token: mateo, body: { filas: [filas[0]] } }))
      .status,
    403,
  )
  assert.equal(
    (
      await api('POST', '/api/docente/alumnos/importar', {
        token: docente,
        body: { cursoId: curso.id, filas: [] },
      })
    ).status,
    400,
  )
  const muchas = Array.from({ length: 101 }, (_, i) => ({
    nombre: `Alumno ${i}`,
    email: `m${i}@lectur.test`,
  }))
  assert.equal(
    (
      await api('POST', '/api/docente/alumnos/importar', {
        token: docente,
        body: { cursoId: curso.id, filas: muchas },
      })
    ).status,
    400,
  )

  // El curso borrado recién sirve cuando se vacía
  assert.equal((await api('DELETE', `/api/cursos/${otroCurso.id}`, { token: docente })).status, 409)
})

test('generador de contraseñas', async () => {
  const { generarPassword } = await import('../src/lib/passwords.js')
  const claves = new Set(Array.from({ length: 50 }, () => generarPassword()))
  assert.equal(claves.size, 50)
  for (const c of claves) assert.match(c, /^[a-km-zA-HJ-NP-Z2-9]{8}$/)
})

// ---------- Racha y práctica libre ----------

test('racha: días seguidos, fines de semana, riesgo y mejor racha', async () => {
  const { calcularRacha, nuevoHito, hoyEn } = await import('../src/lib/racha.js')
  // 2026-10-12 es lunes
  const racha = (fechas, hoy) => calcularRacha(fechas, hoy)

  const vacia = racha([], '2026-10-14')
  assert.equal(vacia.actual, 0)
  assert.equal(vacia.mejor, 0)
  assert.equal(vacia.enRiesgo, false)

  const tres = racha(['2026-10-12', '2026-10-13', '2026-10-14'], '2026-10-14')
  assert.equal(tres.actual, 3)
  assert.equal(tres.activaHoy, true)
  assert.deepEqual(
    tres.hitos.map((h) => h.logrado),
    [true, false, false, false],
  )
  assert.equal(tres.proximoHito, 7)

  // Hoy todavía no leyó: la racha sigue viva pero en riesgo
  const viva = racha(['2026-10-12', '2026-10-13', '2026-10-14'], '2026-10-15')
  assert.equal(viva.actual, 3)
  assert.equal(viva.activaHoy, false)
  assert.equal(viva.enRiesgo, true)

  // Faltó un día de semana: se corta
  assert.equal(racha(['2026-10-12', '2026-10-13'], '2026-10-16').actual, 0)

  // El fin de semana sin leer no corta (viernes -> lunes)
  assert.equal(racha(['2026-10-15', '2026-10-16', '2026-10-19'], '2026-10-19').actual, 3)
  const lunesSinLeer = racha(['2026-10-16'], '2026-10-19')
  assert.equal(lunesSinLeer.actual, 1)
  assert.equal(lunesSinLeer.enRiesgo, true)
  // Un sábado sin leer no es riesgo
  assert.equal(racha(['2026-10-16'], '2026-10-17').enRiesgo, false)
  // Si lee en el fin de semana, suma
  assert.equal(racha(['2026-10-16', '2026-10-17', '2026-10-19'], '2026-10-19').actual, 3)

  // Mejor racha histórica
  const hist = racha(
    ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-20'],
    '2026-10-20',
  )
  assert.equal(hist.actual, 1)
  assert.equal(hist.mejor, 5)
  assert.equal(hist.ultimos7.length, 7)
  assert.equal(hist.ultimos7.at(-1).fecha, '2026-10-20')
  assert.equal(hist.ultimos7.at(-1).activo, true)

  assert.equal(nuevoHito({ mejor: 2 }, { mejor: 3 }), 3)
  assert.equal(nuevoHito({ mejor: 3 }, { mejor: 3 }), null)
  assert.equal(nuevoHito({ mejor: 6 }, { mejor: 7 }), 7)

  // El día se cuenta en hora argentina, no en UTC
  assert.equal(hoyEn('America/Argentina/Buenos_Aires', new Date('2026-10-13T02:30:00Z')), '2026-10-12')
  assert.equal(hoyEn('America/Argentina/Buenos_Aires', new Date('2026-10-13T03:30:00Z')), '2026-10-13')
})

test('práctica libre: catálogo, lectura, corrección y que no toque el semáforo', async () => {
  const docente = await login('docente@lectur.test')
  const sofia = await login('sofia@lectur.test')
  const otra = (
    await api('POST', '/api/auth/login', { body: { email: 'otra@lectur.test', password: 'clavesegura1' } })
  ).data.token

  const propio = (
    await api('POST', '/api/textos', {
      token: docente,
      body: textoBase({ titulo: 'Texto privado del docente' }),
    })
  ).data.id
  const antesSem = (await alumnosDe(docente)).find((a) => a.nombre === 'Sofía Ruiz')

  // Catálogo: solo textos de Lectur, con 3 sugeridos
  const cat = (await api('GET', '/api/alumno/practica/textos', { token: sofia })).data.textos
  assert.ok(cat.length >= 12)
  assert.ok(!cat.some((t) => t.titulo === 'Texto privado del docente'))
  assert.equal(cat.filter((t) => t.sugerido).length, 3)
  assert.ok(cat.every((t) => !t.sugerido || !t.leido))
  assert.equal((await api('GET', '/api/alumno/practica/textos', { token: docente })).status, 403)

  // Lectura: sin la respuesta correcta; un texto propio de un docente no es accesible
  const objetivo = cat.find((t) => t.cantidadPreguntas > 0 && !t.leido)
  const det = await api('GET', `/api/alumno/practica/textos/${objetivo.id}`, { token: sofia })
  assert.equal(det.status, 200)
  assert.ok(det.data.preguntas.length > 0)
  assert.ok(det.data.preguntas.every((p) => !('correcta' in p)))
  assert.equal((await api('GET', `/api/alumno/practica/textos/${propio}`, { token: sofia })).status, 404)
  assert.equal(
    (await api('POST', `/api/alumno/practica/textos/${propio}/completar`, { token: sofia, body: {} })).status,
    404,
  )

  // Corrección: incompleta, opción inexistente, y completa
  const [p1, ...resto] = det.data.preguntas
  const completar = (body) =>
    api('POST', `/api/alumno/practica/textos/${objetivo.id}/completar`, { token: sofia, body })
  assert.equal(
    (await completar({ respuestas: [{ preguntaId: p1.id, opcion: 0 }] })).status,
    resto.length ? 400 : 201,
  )
  const mala = det.data.preguntas.map((p) => ({ preguntaId: p.id, opcion: 99 }))
  assert.equal((await completar({ respuestas: mala })).status, 400)
  const ok = await completar({ respuestas: det.data.preguntas.map((p) => ({ preguntaId: p.id, opcion: 0 })) })
  assert.equal(ok.status, 201)
  assert.equal(ok.data.aciertos.total, det.data.preguntas.length)
  assert.ok(!('puntaje' in ok.data) && !JSON.stringify(ok.data).includes('correcta"'))
  assert.ok(ok.data.racha.actual >= 1)

  // Solo lectura (sin respuestas)
  const otroTexto = cat.find((t) => t.id !== objetivo.id)
  const lectura = await api('POST', `/api/alumno/practica/textos/${otroTexto.id}/completar`, {
    token: sofia,
    body: {},
  })
  assert.equal(lectura.status, 201)
  assert.equal(lectura.data.aciertos, null)

  // Lo leído queda marcado y deja de sugerirse
  const cat2 = (await api('GET', '/api/alumno/practica/textos', { token: sofia })).data.textos
  assert.equal(cat2.find((t) => t.id === objetivo.id).leido, true)
  assert.equal(cat2.find((t) => t.id === objetivo.id).sugerido, false)

  // NO toca el semáforo ni el historial de asignaciones
  const despuesSem = (await alumnosDe(docente)).find((a) => a.nombre === 'Sofía Ruiz')
  assert.equal(despuesSem.estado, antesSem.estado)
  assert.deepEqual(despuesSem.ultimo, antesSem.ultimo)
  assert.ok(
    !(await api('GET', '/api/alumno/historial', { token: sofia })).data.historial.some(
      (h) => h.id === objetivo.id && h.titulo === objetivo.titulo,
    ),
  )

  // El docente ve las lecturas libres de su alumno, y solo él
  const sofiaId = await idDe(docente, 'Sofía Ruiz')
  const prac = (await api('GET', `/api/docente/alumnos/${sofiaId}/practicas`, { token: docente })).data
    .practicas
  assert.equal(prac.length, 2)
  assert.equal(prac.find((p) => p.titulo === objetivo.titulo).aciertos.total, det.data.preguntas.length)
  assert.equal((await api('GET', `/api/docente/alumnos/${sofiaId}/practicas`, { token: otra })).status, 404)
  assert.equal((await api('GET', `/api/docente/alumnos/${sofiaId}/practicas`, { token: sofia })).status, 403)
  assert.equal(
    (await api('GET', `/api/docente/alumnos/${sofiaId}/resumen`, { token: docente })).data.practicas,
    2,
  )
})

test('racha por API: actividad real, hitos y visibilidad para el docente', async () => {
  const docente = await login('docente@lectur.test')
  const otra = (
    await api('POST', '/api/auth/login', { body: { email: 'otra@lectur.test', password: 'clavesegura1' } })
  ).data.token
  const alta = await api('POST', '/api/docente/alumnos', {
    token: docente,
    body: { nombre: 'Racha Test', email: 'racha@lectur.test', password: 'clavecorta1', grado: 1 },
  })
  const id = alta.data.alumno.id
  const token = (
    await api('POST', '/api/auth/login', { body: { email: 'racha@lectur.test', password: 'clavecorta1' } })
  ).data.token
  const texto = (await api('GET', '/api/alumno/practica/textos', { token })).data.textos[0]

  const inicial = (await api('GET', '/api/alumno/racha', { token })).data
  assert.equal(inicial.actual, 0)
  assert.equal(inicial.mejor, 0)
  assert.equal(inicial.ultimos7.length, 7)

  // Actividad de ayer y anteayer: la racha vale 2 y está en riesgo si hoy no leyó (días de semana)
  for (const dias of [1, 2]) {
    await pool.query(
      `INSERT INTO practicas (alumno_id, texto_id, con_cuestionario, completada_en) VALUES ($1, $2, false, now() - ($3 || ' days')::interval)`,
      [id, texto.id, String(dias)],
    )
  }
  const viva = (await api('GET', '/api/alumno/racha', { token })).data
  assert.equal(viva.actual, 2)
  assert.equal(viva.activaHoy, false)

  // Al leer hoy llega a 3 y se desbloquea el primer hito
  const hoy = await api('POST', `/api/alumno/practica/textos/${texto.id}/completar`, { token, body: {} })
  assert.equal(hoy.data.racha.actual, 3)
  assert.equal(hoy.data.racha.nuevoHito, 3)
  const ahora = (await api('GET', '/api/alumno/racha', { token })).data
  assert.equal(ahora.activaHoy, true)
  assert.equal(ahora.enRiesgo, false)
  assert.deepEqual(
    ahora.hitos.map((h) => h.logrado),
    [true, false, false, false],
  )
  assert.equal(ahora.proximoHito, 7)

  // Otra lectura el mismo día no suma días
  const otraVez = await api('POST', `/api/alumno/practica/textos/${texto.id}/completar`, { token, body: {} })
  assert.equal(otraVez.data.racha.actual, 3)
  assert.equal(otraVez.data.racha.nuevoHito, null)

  // El docente la ve en la ficha y en el semáforo; otro docente no
  const ficha = await api('GET', `/api/docente/alumnos/${id}/racha`, { token: docente })
  assert.equal(ficha.data.actual, 3)
  assert.deepEqual((await alumnosDe(docente)).find((a) => a.id === id).racha, { actual: 3, mejor: 3 })
  assert.equal((await api('GET', `/api/docente/alumnos/${id}/racha`, { token: otra })).status, 404)
  assert.equal((await api('GET', '/api/alumno/racha', { token: docente })).status, 403)

  // Completar una lectura asignada también informa la racha
  const textoId = (
    await api('POST', '/api/textos', { token: docente, body: textoBase({ titulo: 'Asignada con racha' }) })
  ).data.id
  await api('POST', '/api/docente/asignaciones', {
    token: docente,
    body: { textoId, alumnoIds: [id], conCuestionario: false },
  })
  const act = (await api('GET', '/api/alumno/actividades', { token })).data.actividades.find(
    (a) => a.titulo === 'Asignada con racha',
  )
  const fin = await api('POST', `/api/alumno/actividades/${act.id}/completar`, { token, body: {} })
  assert.equal(fin.data.racha.actual, 3)
})

// ---------- Alertas al docente ----------

test('alertas: lógica pura de cada tipo', async () => {
  const { calcularAlertas, completarConfig } = await import('../src/lib/alertas.js')
  // 2026-10-19 es lunes
  const base = { resultados: [], fechas: [], pendienteDesde: null, hoy: '2026-10-19' }
  const tipos = (p) => calcularAlertas({ ...base, ...p }).map((a) => a.tipo)

  assert.deepEqual(tipos({}), []) // sin datos no hay alertas

  // Dos rojos seguidos
  const rojos = [
    { id: 9, puntaje: 2, fecha: '2026-10-16' },
    { id: 8, puntaje: 3.3, fecha: '2026-10-14' },
  ]
  const a = calcularAlertas({ ...base, resultados: rojos })
  assert.deepEqual(
    a.map((x) => x.tipo),
    ['rojos_seguidos'],
  )
  assert.equal(a[0].clave, '9')
  assert.equal(a[0].severidad, 'alta')
  assert.deepEqual(
    tipos({
      resultados: [
        { id: 9, puntaje: 2, fecha: '2026-10-16' },
        { id: 8, puntaje: 4.5, fecha: '2026-10-14' },
      ],
    }),
    [],
  ) // 4.5 no es rojo y la baja es chica
  assert.deepEqual(tipos({ resultados: [rojos[0]] }), []) // un solo resultado no alcanza
  // Con el umbral en 3 hacen falta tres
  assert.deepEqual(tipos({ resultados: rojos, config: { rojosSeguidos: 3 } }), [])
  // Resultados viejos (más de 30 días) no avisan
  assert.deepEqual(
    tipos({
      resultados: [
        { id: 1, puntaje: 1, fecha: '2026-08-01' },
        { id: 0, puntaje: 1, fecha: '2026-07-30' },
      ],
    }),
    [],
  )

  // Caída de puntaje (y no se duplica con rojos seguidos)
  const caida = [
    { id: 5, puntaje: 4.5, fecha: '2026-10-16' },
    { id: 4, puntaje: 9, fecha: '2026-10-14' },
  ]
  assert.deepEqual(tipos({ resultados: caida }), ['caida_puntaje'])
  assert.deepEqual(
    tipos({
      resultados: [
        { id: 5, puntaje: 7.5, fecha: '2026-10-16' },
        { id: 4, puntaje: 10, fecha: '2026-10-14' },
      ],
    }),
    [],
  ) // sigue en nivel
  assert.deepEqual(
    tipos({
      resultados: [
        { id: 5, puntaje: 1, fecha: '2026-10-16' },
        { id: 4, puntaje: 9, fecha: '2026-10-14' },
      ],
    }),
    ['caida_puntaje'],
  )

  // Sin leer: días de clase desde la última lectura (viernes -> lunes son 1)
  assert.deepEqual(tipos({ fechas: ['2026-10-16'] }), [])
  assert.deepEqual(tipos({ fechas: ['2026-10-14'], hoy: '2026-10-19' }), ['sin_leer']) // mié -> lun: jue, vie, lun = 3
  const larga = calcularAlertas({ ...base, fechas: ['2026-10-02'] })
  assert.equal(larga.find((x) => x.tipo === 'sin_leer').severidad, 'alta')
  assert.deepEqual(tipos({ fechas: ['2026-10-14'], config: { diasSinLeer: 4 } }), [])
  // Nunca leyó pero tiene una lectura asignada hace tiempo
  const nunca = calcularAlertas({ ...base, pendienteDesde: '2026-10-08' })
  assert.equal(nunca[0].tipo, 'sin_leer')
  assert.match(nunca[0].detalle, /todavía no completó ninguna/)
  assert.deepEqual(tipos({ pendienteDesde: '2026-10-19' }), []) // asignada hoy: no hay alerta

  // Racha rota: tenía 3+ días seguidos y se cortó
  const rota = calcularAlertas({
    ...base,
    fechas: ['2026-10-08', '2026-10-09', '2026-10-12', '2026-10-13'],
    hoy: '2026-10-16',
  })
  assert.ok(rota.some((x) => x.tipo === 'racha_rota' && /4 días/.test(x.detalle)))
  assert.ok(!tipos({ fechas: ['2026-10-12', '2026-10-13'], hoy: '2026-10-16' }).includes('racha_rota')) // racha de 2: no llega al mínimo
  assert.ok(
    !tipos({ fechas: ['2026-10-14', '2026-10-15', '2026-10-16'], hoy: '2026-10-19' }).includes('racha_rota'),
  ) // sigue viva por el fin de semana
  assert.ok(
    !tipos({ fechas: ['2026-09-01', '2026-09-02', '2026-09-03'], hoy: '2026-10-19' }).includes('racha_rota'),
  ) // demasiado vieja

  // Tipos desactivados
  const todos = { resultados: rojos, fechas: ['2026-10-02'] }
  assert.deepEqual(tipos({ ...todos, config: { tipos: { rojos_seguidos: false, sin_leer: false } } }), [])
  assert.equal(completarConfig({ diasSinLeer: 7 }).diasSinLeer, 7)
  assert.equal(completarConfig({ diasSinLeer: 7 }).rojosSeguidos, 2)
})

test('alertas por API: se generan, se marcan como vistas, se configuran y respetan permisos', async () => {
  const docente = await login('docente@lectur.test')
  const otra = (
    await api('POST', '/api/auth/login', { body: { email: 'otra@lectur.test', password: 'clavesegura1' } })
  ).data.token
  const mateo = await login('mateo@lectur.test')
  const curso = (await api('POST', '/api/cursos', { token: docente, body: { nombre: 'Alertas', grado: 2 } }))
    .data.curso
  const nuevo = async (nombre, email) =>
    (
      await api('POST', '/api/docente/alumnos', {
        token: docente,
        body: { nombre, email, password: 'clavecorta1', cursoId: curso.id },
      })
    ).data.alumno.id
  const loginA = async (email) =>
    (await api('POST', '/api/auth/login', { body: { email, password: 'clavecorta1' } })).data.token
  const alertasDe = async (nombre, params = '') =>
    (await api('GET', `/api/docente/alertas${params}`, { token: docente })).data.alertas.filter(
      (a) => a.alumno === nombre,
    )

  // Textos de Lectur con preguntas, para asignar
  const lectur = (await api('GET', '/api/textos', { token: docente })).data.textos.filter(
    (t) => !t.propio && t.cantidad_preguntas > 0,
  )
  const preguntasDe = async (textoId) =>
    (await pool.query('SELECT id, correcta, opciones FROM preguntas WHERE texto_id = $1', [textoId])).rows
  const resolver = async (alumnoId, token, textoId, bien) => {
    await api('POST', '/api/docente/asignaciones', {
      token: docente,
      body: { textoId, alumnoIds: [alumnoId], conCuestionario: true },
    })
    const acts = (await api('GET', '/api/alumno/actividades', { token })).data.actividades.filter(
      (a) => a.estado === 'pendiente',
    )
    const act = acts[0]
    const pregs = await preguntasDe(textoId)
    const respuestas = pregs.map((p) => ({
      preguntaId: p.id,
      opcion: bien ? p.correcta : (p.correcta + 1) % p.opciones.length,
    }))
    const r = await api('POST', `/api/alumno/actividades/${act.id}/completar`, {
      token,
      body: { respuestas },
    })
    assert.equal(r.status, 200)
  }

  // 1) Dos rojos seguidos
  const rojoId = await nuevo('Alerta Rojos', 'rojos@lectur.test')
  const rojoTok = await loginA('rojos@lectur.test')
  await resolver(rojoId, rojoTok, lectur[0].id, false)
  assert.equal((await alertasDe('Alerta Rojos')).filter((a) => a.tipo === 'rojos_seguidos').length, 0) // con uno solo no
  await resolver(rojoId, rojoTok, lectur[1].id, false)
  const rojos = (await alertasDe('Alerta Rojos')).find((a) => a.tipo === 'rojos_seguidos')
  assert.ok(rojos)
  assert.equal(rojos.severidad, 'alta')
  assert.equal(rojos.vista, false)
  assert.equal(rojos.curso, 'Alertas')

  // 2) Caída de puntaje: bien y después mal
  const caidaId = await nuevo('Alerta Caída', 'caida@lectur.test')
  const caidaTok = await loginA('caida@lectur.test')
  await resolver(caidaId, caidaTok, lectur[0].id, true)
  await resolver(caidaId, caidaTok, lectur[1].id, false)
  const tiposCaida = (await alertasDe('Alerta Caída')).map((a) => a.tipo)
  assert.ok(tiposCaida.includes('caida_puntaje'))
  assert.ok(!tiposCaida.includes('rojos_seguidos'))

  // 3) Nunca leyó y tiene una lectura asignada hace diez días
  const nuncaId = await nuevo('Alerta Nunca', 'nunca@lectur.test')
  const textoId = (
    await api('POST', '/api/textos', { token: docente, body: textoBase({ titulo: 'Asignada hace tiempo' }) })
  ).data.id
  await api('POST', '/api/docente/asignaciones', {
    token: docente,
    body: { textoId, alumnoIds: [nuncaId], conCuestionario: false },
  })
  assert.equal((await alertasDe('Alerta Nunca')).length, 0) // recién asignada: sin alerta
  await pool.query(`UPDATE asignaciones SET creada_en = now() - interval '10 days' WHERE alumno_id = $1`, [
    nuncaId,
  ])
  assert.ok((await alertasDe('Alerta Nunca')).some((a) => a.tipo === 'sin_leer' && /ninguna/.test(a.detalle)))

  // 4) Racha rota: leyó 3 días seguidos hace unos días y se cortó
  const rotaId = await nuevo('Alerta Racha', 'rotaracha@lectur.test')
  for (const d of [12, 11, 10]) {
    await pool.query(
      `INSERT INTO practicas (alumno_id, texto_id, con_cuestionario, completada_en) VALUES ($1, $2, false, now() - ($3 || ' days')::interval)`,
      [rotaId, lectur[0].id, String(d)],
    )
  }
  const tiposRota = (await alertasDe('Alerta Racha')).map((a) => a.tipo)
  assert.ok(tiposRota.includes('racha_rota'))
  assert.ok(tiposRota.includes('sin_leer'))

  // Filtro por curso y aislamiento entre docentes
  const delCurso = (await api('GET', `/api/docente/alertas?cursoId=${curso.id}`, { token: docente })).data
    .alertas
  assert.ok(delCurso.length >= 4 && delCurso.every((a) => a.curso === 'Alertas'))
  assert.equal((await api('GET', `/api/docente/alertas?cursoId=${curso.id}`, { token: otra })).status, 404)
  assert.equal((await api('GET', '/api/docente/alertas', { token: otra })).data.alertas.length, 0)
  assert.equal((await api('GET', '/api/docente/alertas', { token: mateo })).status, 403)

  // Marcar como vista: baja el contador y se conserva en la lista
  const antes = (await api('GET', '/api/docente/alertas', { token: docente })).data.noVistas
  assert.equal(
    (
      await api('POST', '/api/docente/alertas/vista', {
        token: docente,
        body: { alumnoId: rojoId, tipo: rojos.tipo, clave: rojos.clave },
      })
    ).status,
    204,
  )
  const despues = (await api('GET', '/api/docente/alertas', { token: docente })).data
  assert.equal(despues.noVistas, antes - 1)
  assert.equal((await alertasDe('Alerta Rojos')).find((a) => a.tipo === 'rojos_seguidos').vista, true)
  assert.equal(
    (
      await api('POST', '/api/docente/alertas/vista', {
        token: otra,
        body: { alumnoId: rojoId, tipo: rojos.tipo, clave: rojos.clave },
      })
    ).status,
    404,
  )
  assert.equal(
    (
      await api('POST', '/api/docente/alertas/vista', {
        token: docente,
        body: { alumnoId: rojoId, tipo: 'inventada', clave: '1' },
      })
    ).status,
    400,
  )

  // Si el problema se repite (nuevo resultado en rojo), vuelve a avisar con otra clave
  await resolver(rojoId, rojoTok, lectur[2].id, false)
  const nueva = (await alertasDe('Alerta Rojos')).find((a) => a.tipo === 'rojos_seguidos')
  assert.notEqual(nueva.clave, rojos.clave)
  assert.equal(nueva.vista, false)

  // Configuración: validar, guardar y que cambie lo que se alerta
  const cfg = (await api('GET', '/api/docente/alertas/config', { token: docente })).data.config
  assert.equal(cfg.rojosSeguidos, 2)
  assert.equal(
    (await api('PUT', '/api/docente/alertas/config', { token: docente, body: { ...cfg, diasSinLeer: 0 } }))
      .status,
    400,
  )
  assert.equal(
    (await api('PUT', '/api/docente/alertas/config', { token: docente, body: { ...cfg, rojosSeguidos: 4 } }))
      .status,
    200,
  )
  assert.equal((await alertasDe('Alerta Rojos')).filter((a) => a.tipo === 'rojos_seguidos').length, 0) // tiene 3 rojos, ahora hacen falta 4
  await api('PUT', '/api/docente/alertas/config', {
    token: docente,
    body: { ...cfg, tipos: { ...cfg.tipos, sin_leer: false, racha_rota: false } },
  })
  assert.equal((await alertasDe('Alerta Nunca')).length, 0)
  assert.equal((await api('GET', '/api/docente/alertas/config', { token: otra })).data.config.diasSinLeer, 3) // la config es por docente

  // Marcar todas como vistas
  await api('PUT', '/api/docente/alertas/config', { token: docente, body: cfg })
  const pendientes = (await api('GET', '/api/docente/alertas', { token: docente })).data.noVistas
  assert.ok(pendientes > 0)
  const todas = await api('POST', '/api/docente/alertas/vistas', { token: docente })
  assert.equal(todas.data.marcadas, pendientes)
  assert.equal((await api('GET', '/api/docente/alertas', { token: docente })).data.noVistas, 0)
})

test('diccionario local: calidad de los datos y cobertura del vocabulario de los textos', async () => {
  const { definiciones } = await import('../src/diccionario-data.js')
  const { textos } = await import('../src/seed-data.js')
  assert.ok(definiciones.length >= 300)
  const vistas = new Set()
  for (const [palabra, significado] of definiciones) {
    const n = normalizar(palabra)
    assert.ok(!vistas.has(n), `duplicada: ${palabra}`)
    vistas.add(n)
    assert.ok(
      significado.length >= 12 && significado.length <= 140,
      `largo de "${palabra}": ${significado.length}`,
    )
    assert.ok(significado.endsWith('.'), `"${palabra}" no termina en punto`)
    if (n.length >= 4)
      assert.ok(
        !normalizar(significado)
          .split(/[^a-zñ]+/)
          .includes(n),
        `"${palabra}" se define con sí misma`,
      )
  }
  for (const t of textos) {
    assert.ok(t.vocabulario?.length, `${t.titulo} sin vocabulario`)
    for (const w of t.vocabulario) assert.ok(vistas.has(normalizar(w)), `falta "${w}" (${t.titulo})`)
  }
})

test('diccionario local: palabras nuevas se resuelven sin llamar al servicio externo', async () => {
  const token = await login('mateo@lectur.test')
  const antes = llamadasExternas.length
  for (const p of ['izar', 'desventaja', 'ensalada', 'olímpico']) {
    const r = await api('GET', `/api/diccionario?palabra=${encodeURIComponent(p)}`, { token })
    assert.equal(r.status, 200, p)
    assert.equal(r.data.fuente, 'propia', p)
  }
  assert.equal(llamadasExternas.length, antes)
})

test('términos: se aceptan al primer ingreso y hay que enviar acepto: true', async () => {
  const docente = await login('docente@lectur.test')
  await api('POST', '/api/docente/alumnos', {
    token: docente,
    body: { nombre: 'Familia Acepta', email: 'acepta@lectur.test', password: 'clavecorta1', grado: 1 },
  })
  const entrada = await api('POST', '/api/auth/login', {
    body: { email: 'acepta@lectur.test', password: 'clavecorta1' },
  })
  const token = entrada.data.token
  assert.equal(entrada.data.usuario.terminosAceptados, false)
  assert.equal((await api('POST', '/api/auth/aceptar-terminos', { token, body: {} })).status, 400)
  assert.equal(
    (await api('POST', '/api/auth/aceptar-terminos', { token, body: { acepto: false } })).status,
    400,
  )
  assert.equal((await api('POST', '/api/auth/aceptar-terminos', { body: { acepto: true } })).status, 401)
  const ok = await api('POST', '/api/auth/aceptar-terminos', { token, body: { acepto: true } })
  assert.equal(ok.status, 200)
  assert.equal(ok.data.usuario.terminosAceptados, true)
  assert.equal((await api('GET', '/api/auth/me', { token })).data.usuario.terminosAceptados, true)
  const fila = (
    await pool.query('SELECT acepto_terminos_version, acepto_terminos_en FROM usuarios WHERE email = $1', [
      'acepta@lectur.test',
    ])
  ).rows[0]
  assert.equal(fila.acepto_terminos_version, 1)
  assert.ok(fila.acepto_terminos_en)
})

test('borrar solo los datos de lectura de un alumno conserva la cuenta', async () => {
  const docente = await login('docente@lectur.test')
  const nuevo = await api('POST', '/api/docente/alumnos', {
    token: docente,
    body: { nombre: 'Datos Borrables', email: 'datos@lectur.test', password: 'clavecorta1', grado: 1 },
  })
  const id = nuevo.data.alumno.id
  const alumno = (
    await api('POST', '/api/auth/login', { body: { email: 'datos@lectur.test', password: 'clavecorta1' } })
  ).data.token
  await api('GET', '/api/diccionario?palabra=paraguas', { token: alumno })
  const antes = (await api('GET', `/api/docente/alumnos/${id}/palabras`, { token: docente })).data.palabras
  assert.ok(antes.length > 0)

  assert.equal((await api('DELETE', `/api/docente/alumnos/${id}/datos`, { token: alumno })).status, 403)
  assert.equal((await api('DELETE', `/api/docente/alumnos/${id}/datos`, { token: docente })).status, 204)

  const despues = (await api('GET', `/api/docente/alumnos/${id}/palabras`, { token: docente })).data.palabras
  assert.equal(despues.length, 0)
  assert.equal(
    (await api('POST', '/api/auth/login', { body: { email: 'datos@lectur.test', password: 'clavecorta1' } }))
      .status,
    200,
  )
})
