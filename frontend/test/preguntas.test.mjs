import { test } from 'node:test'
import assert from 'node:assert/strict'
import { armarRespuesta, mover, ordenInicial, partesEnunciado } from '../src/lib/preguntas.js'

test('partesEnunciado resalta lo que va entre asteriscos', () => {
  assert.deepEqual(partesEnunciado('¿Qué significa *timbre* acá?'), [
    { texto: '¿Qué significa ', resaltado: false },
    { texto: 'timbre', resaltado: true },
    { texto: ' acá?', resaltado: false },
  ])
  assert.deepEqual(partesEnunciado('Sin marcas'), [{ texto: 'Sin marcas', resaltado: false }])
  assert.deepEqual(
    partesEnunciado('*Dos* palabras *marcadas*').map((p) => p.resaltado),
    [true, false, true],
  )
  assert.deepEqual(partesEnunciado('asterisco suelto *'), [
    { texto: 'asterisco suelto *', resaltado: false },
  ])
})

test('mover sube y baja sin salirse de la lista', () => {
  assert.deepEqual(mover([0, 1, 2], 1, -1), [1, 0, 2])
  assert.deepEqual(mover([0, 1, 2], 1, 1), [0, 2, 1])
  assert.deepEqual(mover([0, 1, 2], 0, -1), [0, 1, 2])
  assert.deepEqual(mover([0, 1, 2], 2, 1), [0, 1, 2])
  const original = [0, 1, 2]
  mover(original, 0, 1)
  assert.deepEqual(original, [0, 1, 2]) // no modifica la lista recibida
  assert.deepEqual(ordenInicial(4), [0, 1, 2, 3])
})

test('armarRespuesta manda orden o opción según el formato', () => {
  assert.deepEqual(armarRespuesta({ id: 5, formato: 'orden' }, [1, 0]), {
    preguntaId: 5,
    orden: [1, 0],
  })
  assert.deepEqual(armarRespuesta({ id: 6, formato: 'opcion' }, 2), { preguntaId: 6, opcion: 2 })
  assert.deepEqual(armarRespuesta({ id: 7 }, 0), { preguntaId: 7, opcion: 0 })
})
