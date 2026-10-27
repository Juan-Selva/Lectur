// Habilidades que mide cada pregunta. `tipo` (literal / inferencial) se deriva de la habilidad.
export const HABILIDADES = [
  'dato_explicito',
  'inferencia',
  'estructura',
  'idea_principal',
  'vocabulario_contexto',
  'convenciones',
]

export const ETIQUETAS_HABILIDAD = {
  dato_explicito: 'Dato explícito',
  inferencia: 'Inferencia',
  estructura: 'Estructura del texto',
  idea_principal: 'Idea principal',
  vocabulario_contexto: 'Vocabulario por contexto',
  convenciones: 'Convenciones de escritura',
}

export const TIPO_DE_HABILIDAD = {
  dato_explicito: 'literal',
  estructura: 'literal',
  convenciones: 'literal',
  inferencia: 'inferencial',
  idea_principal: 'inferencial',
  vocabulario_contexto: 'inferencial',
}

// Habilidad que se asume cuando solo se conoce el tipo (preguntas viejas o cargadas sin habilidad).
export const habilidadPorDefecto = (tipo) => (tipo === 'inferencial' ? 'inferencia' : 'dato_explicito')

// Para decir algo de una habilidad hacen falta al menos estas preguntas respondidas,
// y se marca para reforzar si los aciertos quedan por debajo de este porcentaje (el mismo 70 % del verde).
export const MIN_PREGUNTAS = 4
export const UMBRAL_REFORZAR = 0.7

// Frases para la familia, en lenguaje simple.
export const FRASE_FAMILIA = {
  dato_explicito: 'Practicar buscar en el texto datos concretos: quién, qué, dónde y cuándo.',
  inferencia: 'Conversar sobre lo que el texto no dice: «¿por qué creés que pasó eso?».',
  estructura: 'Pedirle que cuente la historia con inicio, nudo y final.',
  idea_principal: 'Preguntarle, al terminar de leer, de qué trata el texto en una sola frase.',
  vocabulario_contexto: 'Ayudarle a adivinar qué significa una palabra nueva a partir de la oración.',
  convenciones: 'Jugar a encontrar mayúsculas, puntos y espacios entre palabras al leer y escribir.',
}

// filas: [{ habilidad, correctas, total }] -> [{ habilidad, correctas, total }] en el orden de HABILIDADES.
export function ordenarHabilidades(filas) {
  const porHabilidad = new Map(filas.map((f) => [f.habilidad, f]))
  return HABILIDADES.filter((h) => porHabilidad.has(h) && porHabilidad.get(h).total > 0).map((h) => ({
    habilidad: h,
    correctas: porHabilidad.get(h).correctas,
    total: porHabilidad.get(h).total,
  }))
}

// La habilidad con peor porcentaje de aciertos (con suficientes preguntas); null si ninguna está floja.
export function habilidadAReforzar(filas) {
  const candidatas = filas
    .filter((f) => f.total >= MIN_PREGUNTAS && f.correctas / f.total < UMBRAL_REFORZAR)
    .sort((a, b) => a.correctas / a.total - b.correctas / b.total || b.total - a.total)
  return candidatas[0] ?? null
}

// Suma varias listas de filas (por ejemplo, las de todos los alumnos de un curso).
export function sumarHabilidades(listas) {
  const suma = new Map()
  for (const lista of listas)
    for (const f of lista) {
      const a = suma.get(f.habilidad) ?? { habilidad: f.habilidad, correctas: 0, total: 0 }
      a.correctas += f.correctas
      a.total += f.total
      suma.set(f.habilidad, a)
    }
  return [...suma.values()]
}

// Aciertos por habilidad de cada alumno, a partir de lo que respondió en actividades asignadas
// (la práctica libre no cuenta, igual que en el semáforo). Devuelve Map alumnoId -> filas.
export async function habilidadesDe(pool, alumnoIds) {
  const porAlumno = new Map(alumnoIds.map((id) => [id, []]))
  if (alumnoIds.length === 0) return porAlumno
  const { rows } = await pool.query(
    `SELECT a.alumno_id, p.habilidad,
            count(*)::int AS total,
            count(*) FILTER (WHERE (x->>'acierto')::boolean)::int AS correctas
       FROM resultados r
       JOIN asignaciones a ON a.id = r.asignacion_id
       CROSS JOIN LATERAL jsonb_array_elements(r.respuestas) x
       JOIN preguntas p ON p.id = (x->>'preguntaId')::int
      WHERE a.alumno_id = ANY($1::int[])
      GROUP BY a.alumno_id, p.habilidad`,
    [alumnoIds],
  )
  for (const f of rows) porAlumno.get(f.alumno_id).push(f)
  return new Map([...porAlumno].map(([id, filas]) => [id, ordenarHabilidades(filas)]))
}
