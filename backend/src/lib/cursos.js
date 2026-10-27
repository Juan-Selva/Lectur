import { badRequest, notFound } from './errors.js'

// Devuelve el curso si es del docente; si no, 404.
export async function cursoDelDocente(pool, cursoId, docenteId) {
  const { rows } = await pool.query(
    'SELECT id, nombre, grado FROM cursos WHERE id = $1 AND docente_id = $2',
    [cursoId, docenteId],
  )
  if (!rows[0]) throw notFound('Curso no encontrado')
  return rows[0]
}

// Si viene cursoId, el grado se toma del curso; si no, hace falta el grado.
export async function resolverCursoYGrado(pool, docenteId, { cursoId, grado }) {
  if (cursoId !== undefined) {
    const curso = await cursoDelDocente(pool, cursoId, docenteId)
    return { cursoId: curso.id, grado: curso.grado }
  }
  if (grado === undefined) throw badRequest('Indicá el curso del alumno')
  return { cursoId: null, grado }
}

// Parsea el filtro ?grado= (1, 2 o 3; null = todos los grados).
export function filtroGrado(query) {
  if (query.grado === undefined || query.grado === '') return null
  const n = Number(query.grado)
  if (![1, 2, 3].includes(n)) throw badRequest('grado inválido')
  return n
}

// Parsea el filtro ?cursoId= de una consulta (null = todos los cursos).
export function filtroCurso(query) {
  if (query.cursoId === undefined || query.cursoId === '') return null
  const n = Number(query.cursoId)
  if (!Number.isInteger(n) || n <= 0) throw badRequest('cursoId inválido')
  return n
}
