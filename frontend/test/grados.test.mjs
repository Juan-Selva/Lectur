import { test } from 'node:test'
import assert from 'node:assert/strict'
import { etiquetaGrado, gradoDeSelect, textosDeGrado } from '../src/lib/grados.js'

const textos = [
  { id: 1, grado: 1 },
  { id: 2, grado: 2 },
  { id: 3, grado: 3 },
  { id: 4, grado: null },
]

test('etiquetaGrado', () => {
  assert.equal(etiquetaGrado(2), '2.º grado')
  assert.equal(etiquetaGrado(null), 'Todos los grados')
})

test('textosDeGrado incluye los del grado y los de todos los grados', () => {
  assert.deepEqual(
    textosDeGrado(textos, 2).map((t) => t.id),
    [2, 4],
  )
  assert.deepEqual(
    textosDeGrado(textos, 1).map((t) => t.id),
    [1, 4],
  )
  assert.equal(textosDeGrado(textos, null).length, 4)
})

test('gradoDeSelect convierte el valor del select', () => {
  assert.equal(gradoDeSelect(''), null)
  assert.equal(gradoDeSelect('3'), 3)
  assert.equal(gradoDeSelect(undefined), null)
})
