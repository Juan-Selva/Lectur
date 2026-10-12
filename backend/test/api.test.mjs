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
  const montania = palabras.find((p) => p.palabra === 'montaña')
  assert.equal(montania.veces, 2)
  assert.equal(palabras.find((p) => p.palabra === 'zzzz').encontrada, false)
  // el docente no genera consultas propias
  assert.ok(
    (await api('GET', '/api/docente/palabras', { token: docente })).data.palabras.some(
      (p) => p.palabra === 'montaña',
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
