import { useCursos } from '../lib/cursos.jsx'

// Filtro por curso: "Todos" y un botón por cada curso que tiene el docente (con su cantidad de alumnos).
// Se arma con los cursos reales, así que se actualiza solo cuando se crea, edita o borra un curso.
export default function FiltroCurso() {
  const { cursos, cursoId, setCursoId } = useCursos()
  if (cursos.length === 0) return null
  const chip = (valor, etiqueta) => (
    <button
      key={valor || 'todos'}
      type="button"
      onClick={() => setCursoId(valor)}
      aria-pressed={cursoId === valor}
      className={`rounded-full border px-3 py-1 text-sm font-semibold ${cursoId === valor ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}
    >
      {etiqueta}
    </button>
  )
  return (
    <div
      className="flex flex-wrap items-center gap-2 print:hidden"
      role="group"
      aria-label="Filtrar por curso"
    >
      <span className="text-sm font-medium text-slate-600">Curso</span>
      {chip('', 'Todos')}
      {cursos.map((c) => chip(String(c.id), `${c.nombre} (${c.alumnos})`))}
    </div>
  )
}
