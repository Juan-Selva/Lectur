import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  AJUSTES_INICIALES,
  CLAVE_AJUSTES,
  aplicarAjustes,
  cargarAjustes,
  guardarAjustes,
  normalizarAjustes,
  variablesCss,
} from '../src/lib/ajustes.js'

const memoria = (inicial = {}) => {
  const datos = { ...inicial }
  return { getItem: (k) => datos[k] ?? null, setItem: (k, v) => (datos[k] = v), datos }
}

test('normalizar: acepta valores conocidos y descarta el resto', () => {
  assert.deepEqual(normalizarAjustes(undefined), AJUSTES_INICIALES)
  assert.deepEqual(normalizarAjustes('basura'), AJUSTES_INICIALES)
  assert.deepEqual(
    normalizarAjustes({ tamano: 'enorme', espaciado: 'muy-amplio', contraste: 'alto' }),
    {
      tamano: 'enorme',
      espaciado: 'muy-amplio',
      contraste: 'alto',
    },
  )
  assert.deepEqual(
    normalizarAjustes({ tamano: '999px', espaciado: 'x', contraste: '<script>' }),
    AJUSTES_INICIALES,
  )
})

test('variables CSS: escala, interlineado y espaciados', () => {
  assert.deepEqual(variablesCss(AJUSTES_INICIALES), {
    '--lectura-escala': '1',
    '--lectura-interlineado': '1.8',
    '--lectura-letras': '0em',
    '--lectura-palabras': '0em',
  })
  const v = variablesCss({ tamano: 'muy-grande', espaciado: 'muy-amplio' })
  assert.equal(v['--lectura-escala'], '1.5')
  assert.equal(v['--lectura-interlineado'], '2.4')
  assert.equal(v['--lectura-letras'], '0.1em')
})

test('guardar y cargar: ida y vuelta, datos dañados y almacenamiento roto', () => {
  const m = memoria()
  guardarAjustes(m, { tamano: 'grande', espaciado: 'amplio', contraste: 'alto' })
  assert.deepEqual(cargarAjustes(m), { tamano: 'grande', espaciado: 'amplio', contraste: 'alto' })

  assert.deepEqual(cargarAjustes(memoria({ [CLAVE_AJUSTES]: '{no es json' })), AJUSTES_INICIALES)
  assert.deepEqual(
    cargarAjustes(memoria({ [CLAVE_AJUSTES]: '{"tamano":"raro"}' })),
    AJUSTES_INICIALES,
  )

  const roto = {
    getItem: () => {
      throw new Error('bloqueado')
    },
    setItem: () => {
      throw new Error('bloqueado')
    },
  }
  assert.deepEqual(cargarAjustes(roto), AJUSTES_INICIALES)
  assert.doesNotThrow(() => guardarAjustes(roto, AJUSTES_INICIALES))
})

test('sin preferencia guardada se respeta el pedido de alto contraste del sistema', () => {
  assert.equal(cargarAjustes(memoria(), true).contraste, 'alto')
  assert.equal(cargarAjustes(memoria(), false).contraste, 'normal')
  // una preferencia guardada manda sobre la del sistema
  const m = memoria()
  guardarAjustes(m, { ...AJUSTES_INICIALES, contraste: 'normal' })
  assert.equal(cargarAjustes(m, true).contraste, 'normal')
})

test('aplicar: escribe las variables y el atributo de contraste', () => {
  const props = {}
  const raiz = { style: { setProperty: (k, v) => (props[k] = v) }, dataset: {} }
  aplicarAjustes({ tamano: 'grande', espaciado: 'amplio', contraste: 'alto' }, raiz)
  assert.equal(props['--lectura-escala'], '1.25')
  assert.equal(props['--lectura-interlineado'], '2')
  assert.equal(raiz.dataset.contraste, 'alto')
})
