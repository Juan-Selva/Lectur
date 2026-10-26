import { test } from 'node:test'
import assert from 'node:assert/strict'
import { estrellasDe, mensajeFinal, saludo } from '../src/lib/logros.js'
import { emojiHito } from '../src/lib/racha.js'

test('estrellas según las respuestas correctas', () => {
  assert.equal(estrellasDe(null), 0) // solo lectura
  assert.equal(estrellasDe({ correctas: 0, total: 0 }), 0)
  assert.equal(estrellasDe({ correctas: 5, total: 5 }), 3)
  assert.equal(estrellasDe({ correctas: 3, total: 5 }), 2)
  assert.equal(estrellasDe({ correctas: 2, total: 5 }), 1)
  assert.equal(estrellasDe({ correctas: 0, total: 4 }), 1) // siempre al menos una por intentarlo
})

test('el mensaje final siempre es de ánimo', () => {
  assert.equal(mensajeFinal({ correctas: 4, total: 4 }).titulo, '¡Perfecto!')
  assert.equal(mensajeFinal({ correctas: 0, total: 4 }).titulo, '¡Buen intento!')
  assert.equal(mensajeFinal(null).titulo, '¡Terminaste de leer!')
})

test('saludo según la hora', () => {
  assert.equal(saludo(9), '¡Buen día')
  assert.equal(saludo(15), '¡Buenas tardes')
  assert.equal(saludo(22), '¡Buenas noches')
})

test('medallas de racha', () => {
  assert.equal(emojiHito(30), '🏆')
  assert.equal(emojiHito(99), '🏅') // un hito nuevo del backend tiene medalla genérica
})
