import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from './api.js'

const CursosContext = createContext(null)
const CLAVE = 'lectur.curso'

// Lista de cursos del docente y el curso elegido como filtro ('' = todos).
export function CursosProvider({ children }) {
  const [cursos, setCursos] = useState([])
  const [cursoId, setCursoIdState] = useState(() => localStorage.getItem(CLAVE) ?? '')

  const recargar = useCallback(
    () =>
      api
        .cursos()
        .then((r) => {
          setCursos(r.cursos)
          // si el curso guardado ya no existe, se vuelve a "todos"
          setCursoIdState((actual) =>
            actual && !r.cursos.some((c) => String(c.id) === actual) ? '' : actual,
          )
        })
        .catch(() => {}),
    [],
  )
  useEffect(() => {
    recargar()
  }, [recargar])

  const setCursoId = useCallback((valor) => {
    const v = valor ? String(valor) : ''
    localStorage.setItem(CLAVE, v)
    setCursoIdState(v)
  }, [])

  const valor = useMemo(
    () => ({ cursos, cursoId, setCursoId, recargar }),
    [cursos, cursoId, setCursoId, recargar],
  )
  return <CursosContext.Provider value={valor}>{children}</CursosContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCursos = () => useContext(CursosContext)
