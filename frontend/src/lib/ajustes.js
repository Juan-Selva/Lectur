// Ajustes de accesibilidad de lectura: lógica pura (sin React) para poder probarla.
export const TAMANOS = [
  { id: 'normal', etiqueta: 'Normal', escala: 1 },
  { id: 'grande', etiqueta: 'Grande', escala: 1.25 },
  { id: 'muy-grande', etiqueta: 'Muy grande', escala: 1.5 },
  { id: 'enorme', etiqueta: 'Enorme', escala: 1.8 },
]

// Basado en las pautas WCAG 1.4.12 de espaciado de texto.
export const ESPACIADOS = [
  { id: 'normal', etiqueta: 'Normal', interlineado: 1.8, letras: '0em', palabras: '0em' },
  { id: 'amplio', etiqueta: 'Amplio', interlineado: 2, letras: '0.05em', palabras: '0.12em' },
  {
    id: 'muy-amplio',
    etiqueta: 'Muy amplio',
    interlineado: 2.4,
    letras: '0.1em',
    palabras: '0.2em',
  },
]

export const AJUSTES_INICIALES = { tamano: 'normal', espaciado: 'normal', contraste: 'normal' }
export const CLAVE_AJUSTES = 'lectur.accesibilidad'

const ids = (lista) => lista.map((x) => x.id)

// Acepta solo valores conocidos; cualquier otra cosa vuelve al valor inicial.
export function normalizarAjustes(crudo) {
  const c = crudo && typeof crudo === 'object' ? crudo : {}
  return {
    tamano: ids(TAMANOS).includes(c.tamano) ? c.tamano : AJUSTES_INICIALES.tamano,
    espaciado: ids(ESPACIADOS).includes(c.espaciado) ? c.espaciado : AJUSTES_INICIALES.espaciado,
    contraste: ['normal', 'alto'].includes(c.contraste) ? c.contraste : AJUSTES_INICIALES.contraste,
  }
}

// Variables CSS que usa la clase `.lectura`.
export function variablesCss(ajustes) {
  const a = normalizarAjustes(ajustes)
  const t = TAMANOS.find((x) => x.id === a.tamano)
  const e = ESPACIADOS.find((x) => x.id === a.espaciado)
  return {
    '--lectura-escala': String(t.escala),
    '--lectura-interlineado': String(e.interlineado),
    '--lectura-letras': e.letras,
    '--lectura-palabras': e.palabras,
  }
}

export function cargarAjustes(storage, prefiereContraste = false) {
  try {
    const guardado = storage.getItem(CLAVE_AJUSTES)
    if (guardado) return normalizarAjustes(JSON.parse(guardado))
  } catch {
    // almacenamiento no disponible o contenido dañado: se usan los valores iniciales
  }
  return { ...AJUSTES_INICIALES, contraste: prefiereContraste ? 'alto' : 'normal' }
}

export function guardarAjustes(storage, ajustes) {
  try {
    storage.setItem(CLAVE_AJUSTES, JSON.stringify(normalizarAjustes(ajustes)))
  } catch {
    // si no se puede guardar, los ajustes igual se aplican en esta sesión
  }
}

// Aplica los ajustes al documento (variables CSS y atributo de contraste).
export function aplicarAjustes(ajustes, raiz = document.documentElement) {
  for (const [k, v] of Object.entries(variablesCss(ajustes))) raiz.style.setProperty(k, v)
  raiz.dataset.contraste = normalizarAjustes(ajustes).contraste
}
