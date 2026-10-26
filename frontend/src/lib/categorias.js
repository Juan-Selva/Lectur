// Cada categoría tiene su emoji y sus colores (clases completas para que Tailwind las detecte).
export const CATEGORIAS = [
  {
    valor: 'ficcion',
    etiqueta: 'Ficción',
    emoji: '🐉',
    chip: 'bg-violet-100 text-violet-800',
    fondo: 'bg-violet-100',
    borde: 'hover:border-violet-400',
  },
  {
    valor: 'historia',
    etiqueta: 'Historia',
    emoji: '🏰',
    chip: 'bg-amber-100 text-amber-800',
    fondo: 'bg-amber-100',
    borde: 'hover:border-amber-400',
  },
  {
    valor: 'deporte',
    etiqueta: 'Deporte',
    emoji: '⚽',
    chip: 'bg-orange-100 text-orange-800',
    fondo: 'bg-orange-100',
    borde: 'hover:border-orange-400',
  },
  {
    valor: 'ciencia',
    etiqueta: 'Ciencia',
    emoji: '🔬',
    chip: 'bg-cyan-100 text-cyan-800',
    fondo: 'bg-cyan-100',
    borde: 'hover:border-cyan-400',
  },
  {
    valor: 'naturaleza',
    etiqueta: 'Naturaleza',
    emoji: '🌳',
    chip: 'bg-emerald-100 text-emerald-800',
    fondo: 'bg-emerald-100',
    borde: 'hover:border-emerald-400',
  },
  {
    valor: 'biografia',
    etiqueta: 'Biografía',
    emoji: '🌟',
    chip: 'bg-pink-100 text-pink-800',
    fondo: 'bg-pink-100',
    borde: 'hover:border-pink-400',
  },
]

// Para textos sin categoría.
export const SIN_CATEGORIA = {
  valor: '',
  etiqueta: null,
  emoji: '📖',
  chip: 'bg-sky-100 text-sky-800',
  fondo: 'bg-sky-100',
  borde: 'hover:border-sky-400',
}

export const categoria = (v) => CATEGORIAS.find((c) => c.valor === v) ?? null
export const etiquetaCategoria = (v) => categoria(v)?.etiqueta ?? null
