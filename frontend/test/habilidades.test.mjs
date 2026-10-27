import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  HABILIDADES,
  etiquetaHabilidad,
  fraseCurso,
  porcentaje,
  textoHabilidad,
} from '../src/lib/habilidades.js'

test('hay seis habilidades y cada una tiene etiqueta', () => {
  assert.equal(HABILIDADES.length, 6)
  assert.equal(etiquetaHabilidad('inferencia'), 'Inferencia')
  assert.equal(etiquetaHabilidad('otra'), 'otra')
})

test('porcentaje y texto de una habilidad', () => {
  assert.equal(porcentaje({ correctas: 2, total: 5 }), 40)
  assert.equal(porcentaje({ correctas: 0, total: 0 }), null)
  assert.equal(
    textoHabilidad({ habilidad: 'inferencia', correctas: 2, total: 5 }),
    'Inferencia: 2 de 5 (40 %)',
  )
})

test('frase del curso: solo si hay una habilidad floja', () => {
  assert.equal(fraseCurso(null, 'En 2.° A'), null)
  assert.equal(
    fraseCurso({ habilidad: 'idea_principal', correctas: 3, total: 8 }, 'En 2.° A'),
    'En 2.° A, la habilidad que más cuesta es idea principal (38 % de aciertos).',
  )
})
