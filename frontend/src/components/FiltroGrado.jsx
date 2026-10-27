import { GRADOS } from '../lib/grados.js'

// Filtro por grado: "Todos" o 1.º / 2.º / 3.º. `valor` es null o el número de grado.
export default function FiltroGrado({ valor, onCambiar }) {
  const chip = (g, etiqueta) => (
    <button
      key={etiqueta}
      type="button"
      onClick={() => onCambiar(g)}
      aria-pressed={valor === g}
      className={`rounded-full border px-3 py-1 text-sm font-semibold ${valor === g ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}
    >
      {etiqueta}
    </button>
  )
  return (
    <div
      className="flex flex-wrap items-center gap-2 print:hidden"
      role="group"
      aria-label="Filtrar por grado"
    >
      <span className="text-sm font-medium text-slate-600">Grado</span>
      {chip(null, 'Todos')}
      {GRADOS.map((g) => chip(g, `${g}.º`))}
    </div>
  )
}
