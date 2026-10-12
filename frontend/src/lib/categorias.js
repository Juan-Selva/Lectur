export const CATEGORIAS = [
  { valor: 'ficcion', etiqueta: 'Ficción' },
  { valor: 'historia', etiqueta: 'Historia' },
  { valor: 'deporte', etiqueta: 'Deporte' },
  { valor: 'ciencia', etiqueta: 'Ciencia' },
  { valor: 'naturaleza', etiqueta: 'Naturaleza' },
  { valor: 'biografia', etiqueta: 'Biografía' },
]
export const etiquetaCategoria = (v) => CATEGORIAS.find((c) => c.valor === v)?.etiqueta ?? null
