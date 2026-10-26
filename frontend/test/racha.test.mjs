import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nombreHito } from '../src/lib/racha.js'

test('nombres de las insignias de racha', () => {
  assert.equal(nombreHito(3), '3 días')
  assert.equal(nombreHito(7), 'Una semana')
  assert.equal(nombreHito(30), 'Un mes')
  assert.equal(nombreHito(50), '50 días') // un hito nuevo del backend no rompe la pantalla
})
