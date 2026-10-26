import { useCursos } from '../lib/cursos.jsx'

export default function SelectorCurso() {
  const { cursos, cursoId, setCursoId } = useCursos()
  if (cursos.length === 0) return null
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-slate-600 print:hidden">
      Curso
      <select
        value={cursoId}
        onChange={(e) => setCursoId(e.target.value)}
        className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-semibold text-ink"
      >
        <option value="">Todos</option>
        {cursos.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>
    </label>
  )
}
